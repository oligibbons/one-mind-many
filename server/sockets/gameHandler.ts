// server/sockets/gameHandler.ts

import { Server, Socket } from 'socket.io';
import { SupabaseClient } from '@supabase/supabase-js';
import { GameEngine, TurnState } from '../services/GameEngine.js';
import {
  GameState,
  PrivatePlayerState,
  SubmittedAction,
  BoardSpace,
  Scenario,
  PublicPlayerState,
} from '../../src/types/game';

type AdminSupabaseClient = SupabaseClient<any, 'public', any>;
type UserMap = Map<string, { userId: string; username: string }>;
type RoomMap = Map<string, { roomId: string, type: 'lobby' | 'game' }>;

const gameTurnState = new Map<string, TurnState>();

const findSocketIdByUserId = (userMap: UserMap, userId: string): string | undefined => {
  for (const [id, user] of userMap.entries()) {
    if (user.userId === userId) {
      return id;
    }
  }
  return undefined;
};

export const registerGameHandlers = (
  io: Server,
  socket: Socket,
  supabase: AdminSupabaseClient,
  socketToUser: UserMap, 
  socketInRoom: RoomMap  
) => {
  // --- Internal Helper Functions ---

  const processNextAction = async (gameId: string) => {
    let turnState = gameTurnState.get(gameId);
    if (!turnState) {
      console.error(`No turn state found for game ${gameId} to process next action.`);
      return;
    }

    if (turnState.actionQueue.length === 0) {
      await endRound(gameId, turnState);
      return;
    }

    const action = turnState.actionQueue.shift()!;
    const { nextTurnState, pause } = GameEngine.processSingleAction(turnState, action);
    gameTurnState.set(gameId, nextTurnState);

    if (pause) {
      console.log(`[Game ${gameId}] Pausing for move input from ${pause.playerId}`);
      
      // Check if the paused player is disconnected
      const pausedPlayer = nextTurnState.playerStates.find(p => p.userId === pause.playerId);
      if (pausedPlayer?.is_disconnected) {
          console.log(`[Game ${gameId}] Player ${pause.playerId} is disconnected. Submitting non-move.`);
          // Auto-submit a "non-move" (their current position)
          const { nextTurnState: movedState } = GameEngine.processSubmittedMove(nextTurnState, nextTurnState.state.harbingerPosition);
          gameTurnState.set(gameId, movedState);
          setImmediate(() => processNextAction(gameId));
      } else {
          // Player is connected, emit event as normal
          const playerSocketId = findSocketIdByUserId(socketToUser, pause.playerId);
          if (playerSocketId) {
            io.to(playerSocketId).emit('game:await_move', pause);
          }
          socket.to(gameId).emit('game:awaiting_input', {
            message: `Waiting for ${pause.actingUsername} to move...`,
          });
      }
    } else {
      setImmediate(() => processNextAction(gameId));
    }
  };

  const checkAllActionsSubmitted = async (gameId: string) => {
    const { data: players, error: fetchError } = await supabase
      .from('game_players')
      .select('user_id, submitted_action, is_disconnected') // <-- NEW
      .eq('game_id', gameId);
    if (fetchError) throw new Error(`Supabase player fetch error: ${fetchError.message}`);

    // --- NEW: Disconnected players count as "submitted" ---
    const allSubmitted = players.every((p) => p.submitted_action !== null || p.is_disconnected);
    if (!allSubmitted) return;

    console.log(`[Game ${gameId}] All actions submitted. Resolving round...`);

    const { data: currentState, error: gameFetchError } = await supabase
      .from('games').select('*').eq('id', gameId).single();
    if (gameFetchError) throw new Error(`Supabase game fetch error: ${gameFetchError.message}`);

    const { data: allPlayerStates, error: playersFetchError } = await supabase
      .from('game_players').select('*').eq('game_id', gameId);
    if (playersFetchError) throw new Error(`Supabase players fetch error: ${playersFetchError.message}`);
    
    // We need both public and private states for the engine
    const allPublicPlayerStates = currentState.players as PublicPlayerState[];
    const allPrivatePlayerStates = allPlayerStates as PrivatePlayerState[];

    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios').select('*').eq('id', currentState.scenario_id).single();
    if (scenarioError || !scenario) {
      throw new Error(`Failed to load scenario ${currentState.scenario_id}: ${scenarioError?.message}`);
    }

    const submittedActions = allPlayerStates
        .filter(p => !p.is_disconnected) // Don't add disconnected players' actions
        .map((p) => ({
            playerId: p.user_id, card: p.submitted_action, priority: 0,
        }));

    const initialTurnState = GameEngine.startRoundResolution(
      currentState as GameState,
      allPrivatePlayerStates,
      allPublicPlayerStates, // <-- NEW
      submittedActions as SubmittedAction[],
      scenario as Scenario
    );
    
    gameTurnState.set(gameId, initialTurnState);
    await processNextAction(gameId);
  };

  const endRound = async (gameId: string, finalTurnState: TurnState) => {
    console.log(`[Game ${gameId}] Round ${finalTurnState.state.currentRound} finished.`);
    
    const { nextState, nextPrivateStates } = GameEngine.applyEndOfRoundEffects(finalTurnState);

    // --- NEW: Update all game state fields ---
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update({
        status: nextState.status,
        current_round: nextState.currentRound,
        harbinger_position: nextState.harbingerPosition,
        stalker_position: nextState.stalkerPosition, // <-- NEW
        board_modifiers: nextState.boardModifiers, // <-- NEW
        priority_track: nextState.priorityTrack,
        active_complications: nextState.activeComplications,
        game_log: nextState.gameLog,
        game_objects: nextState.boardObjects,
        npcs: nextState.boardNPCs,
        players: nextState.players, // <-- NEW: Save updated public player state (for disconnects)
      })
      .eq('id', gameId)
      .select()
      .single();
      
    if (updateError) throw new Error(`Supabase game update error: ${updateError.message}`);

    const playerUpdates = nextPrivateStates.map((p) => {
      // Find the corresponding public player state to see if they are disconnected
      const publicPlayer = nextState.players.find(pp => pp.id === p.id);
      
      return supabase
        .from('game_players')
        .update({
          vp: p.vp, 
          hand: p.hand, 
          personal_goal: p.personalGoal,
          submitted_action: null,
          is_disconnected: publicPlayer?.is_disconnected || false, // Persist disconnect status
        })
        .eq('id', p.id);
    });
    await Promise.all(playerUpdates);

    io.to(gameId).emit('game:state_update', updatedGame);
    for (const p of nextPrivateStates) {
      const playerSocketId = findSocketIdByUserId(socketToUser, p.userId);
      if (playerSocketId) {
        io.to(playerSocketId).emit('game:private_update', p);
      }
    }
    gameTurnState.delete(gameId);
  };

  // --- Socket Event Listeners ---

  const joinGame = async (payload: { gameId: string; userId: string }) => {
    try {
      const { gameId, userId } = payload;
      console.log(`[${socket.id}] joinGame: ${userId} joining ${gameId}`);

      const { data: publicState, error: gameError } = await supabase
        .from('games').select('*').eq('id', gameId).single();
      if (gameError || !publicState) throw new Error(`Game not found: ${gameId}`);
        
      if (publicState.status !== 'active' && publicState.status !== 'finished') {
        throw new Error(`Game is not active. Status: ${publicState.status}`);
      }
      
      // --- NEW: Handle Reconnecting Player ---
      const { error: updateError } = await supabase
        .from('game_players')
        .update({ is_disconnected: false })
        .eq('game_id', gameId)
        .eq('user_id', userId);
      if (updateError) throw new Error(`Player ${userId} failed to reconnect: ${updateError.message}`);

      const { data: privateState, error: playerError } = await supabase
        .from('game_players').select('*').eq('game_id', gameId).eq('user_id', userId).single();
      if (playerError || !privateState) throw new Error(`Player ${userId} not found in game ${gameId}`);
      
      // Update the public player state in the 'games' table
      const publicPlayers = publicState.players as PublicPlayerState[];
      const player = publicPlayers.find((p: PublicPlayerState) => p.userId === userId);
      if(player) {
          player.is_disconnected = false;
          await supabase.from('games').update({ players: publicPlayers }).eq('id', gameId);
      }


      socket.join(gameId);
      
      socketInRoom.set(socket.id, { roomId: gameId, type: 'game' });
      socketToUser.set(socket.id, { userId, username: privateState.username });

      socket.emit('game:full_state', {
        publicState: publicState as GameState,
        privateState: privateState as PrivatePlayerState,
      });

      // Emit with full user info
      socket.to(gameId).emit('game:player_joined', { userId: privateState.userId, username: privateState.username });
    } catch (error: any) {
      console.error(`[${socket.id}] Error in joinGame: ${error.message}`);
      socket.emit('error:game', { message: `Failed to join game: ${error.message}` });
    }
  };

  const submitAction = async (payload: {
    gameId: string;
    userId: string;
    card: any;
  }) => {
    try {
      const { gameId, userId, card } = payload;
      
      const { error } = await supabase
        .from('game_players').update({ submitted_action: card }).eq('game_id', gameId).eq('user_id', userId);
      if (error) throw new Error(`Supabase action update error: ${error.message}`);

      io.to(gameId).emit('game:player_submitted', { userId });
      await checkAllActionsSubmitted(gameId);
    } catch (error: any) {
      console.error(`[${socket.id}] Error in submitAction: ${error.message}`);
      socket.emit('error:game', { message: 'Failed to submit action.' });
    }
  };
  
  const submitMove = async (payload: {
    gameId: string;
    position: BoardSpace;
  }) => {
    try {
      const { gameId, position } = payload;
      let turnState = gameTurnState.get(gameId);
      if (!turnState) throw new Error('No active turn state found for this move.');
      
      const userInfo = socketToUser.get(socket.id);
      if (!userInfo || turnState.modifiers.awaitingMoveFromPlayerId !== userInfo.userId) {
        throw new Error('It is not your turn to move.');
      }

      console.log(`[${socket.id}] submitMove: ${userInfo.username} moves to ${position.x},${position.y}`);
      const { nextTurnState } = GameEngine.processSubmittedMove(turnState, position);
      gameTurnState.set(gameId, nextTurnState);
      
      setImmediate(() => processNextAction(gameId));
      
    } catch (error: any) {
      console.error(`[${socket.id}] Error in submitMove: ${error.message}`);
      socket.emit('error:game', { message: 'Failed to submit move.' });
    }
  };

  const handleChatMessage = (payload: { gameId: string; message: any }) => {
    try {
      const { gameId, message } = payload;
      io.to(gameId).emit('chat:receive', message);
    } catch (error: any) {
      console.error(`[${socket.id}] Error in handleChatMessage: ${error.message}`);
    }
  };

  socket.on('game:join', joinGame);
  socket.on('action:submit', submitAction);
  socket.on('action:submit_move', submitMove);
  socket.on('chat:send', handleChatMessage);
};

/**
 * (NEW) Exported disconnect handler
 */
export const handleGameDisconnect = async (
  io: Server,
  socket: Socket,
  supabase: AdminSupabaseClient,
  roomId: string,
  userInfo: { userId: string; username: string }
) => {
  console.log(`[${socket.id}] ${userInfo.username} disconnected from game ${roomId}`);
  // Emit with full user info
  io.to(roomId).emit('game:player_left', { userId: userInfo.userId, username: userInfo.username });
  
  try {
    // Set disconnected flag in game_players
    const { error: playerUpdateError } = await supabase
      .from('game_players')
      .update({ is_disconnected: true })
      .eq('game_id', roomId)
      .eq('user_id', userInfo.userId);

    if (playerUpdateError) throw new Error(`DB player update error: ${playerUpdateError.message}`);

    // Set disconnected flag in games.players (public state)
    const { data: game, error: gameFetchError } = await supabase
      .from('games')
      .select('players')
      .eq('id', roomId)
      .single();
      
    if (gameFetchError) throw new Error(`DB game fetch error: ${gameFetchError.message}`);
    
    const publicPlayers = game.players as PublicPlayerState[];
    const player = publicPlayers.find(p => p.userId === userInfo.userId);
    if (player) {
        player.is_disconnected = true;
        await supabase.from('games').update({ players: publicPlayers }).eq('id', roomId);
    }

    // Check if a turn is in progress
    const turnState = gameTurnState.get(roomId);
    if (turnState) {
      // Update the in-memory turn state
      const publicPlayer = turnState.playerStates.find(p => p.userId === userInfo.userId);
      if(publicPlayer) publicPlayer.is_disconnected = true;

      // Check if the disconnected player was awaiting a move
      if (turnState.modifiers.awaitingMoveFromPlayerId === userInfo.userId) {
        console.log(`[Game ${roomId}] Disconnected player was awaiting move. Auto-submitting non-move.`);
        const { nextTurnState } = GameEngine.processSubmittedMove(turnState, turnState.state.harbingerPosition);
        gameTurnState.set(roomId, nextTurnState);
        setImmediate(() => processNextAction(roomId)); // Continue the queue
      } else {
        // Otherwise, check if this disconnect means all actions are now "submitted"
        await checkAllActionsSubmitted(roomId);
      }
    } else {
        // No turn in progress, just check if all actions are submitted (for next round)
        await checkAllActionsSubmitted(roomId);
    }

  } catch (error: any) {
    console.error(`[${socket.id}] Error in handleGameDisconnect: ${error.message}`);
  }
};