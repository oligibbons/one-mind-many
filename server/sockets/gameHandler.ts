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
  socketToUser: UserMap, // <-- NEW
  socketInRoom: RoomMap  // <-- NEW
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
    const { nextTurnState, pause } = await GameEngine.processSingleAction(turnState, action);
    gameTurnState.set(gameId, nextTurnState);

    if (pause) {
      console.log(`[Game ${gameId}] Pausing for move input from ${pause.playerId}`);
      const playerSocketId = findSocketIdByUserId(socketToUser, pause.playerId);
      
      if (playerSocketId) {
        io.to(playerSocketId).emit('game:await_move', pause);
      }
      socket.to(gameId).emit('game:awaiting_input', {
        message: `Waiting for ${pause.actingUsername} to move...`,
      });
    } else {
      await processNextAction(gameId);
    }
  };

  const checkAllActionsSubmitted = async (gameId: string) => {
    const { data: players, error: fetchError } = await supabase
      .from('game_players')
      .select('user_id, submitted_action')
      .eq('game_id', gameId);
    if (fetchError) throw new Error(`Supabase player fetch error: ${fetchError.message}`);

    const allSubmitted = players.every((p) => p.submitted_action != null);
    if (!allSubmitted) return;

    console.log(`[Game ${gameId}] All actions submitted. Resolving round...`);

    const { data: currentState, error: gameFetchError } = await supabase
      .from('games').select('*').eq('id', gameId).single();
    if (gameFetchError) throw new Error(`Supabase game fetch error: ${gameFetchError.message}`);

    const { data: allPlayerStates, error: playersFetchError } = await supabase
      .from('game_players').select('*').eq('game_id', gameId);
    if (playersFetchError) throw new Error(`Supabase players fetch error: ${playersFetchError.message}`);

    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios').select('*').eq('id', currentState.scenario_id).single();
    if (scenarioError || !scenario) {
      throw new Error(`Failed to load scenario ${currentState.scenario_id}: ${scenarioError?.message}`);
    }

    const submittedActions = allPlayerStates.map((p) => ({
      playerId: p.user_id, card: p.submitted_action, priority: 0,
    }));

    const initialTurnState = GameEngine.startRoundResolution(
      currentState as GameState,
      allPlayerStates as PrivatePlayerState[],
      submittedActions as SubmittedAction[],
      scenario as Scenario
    );
    
    gameTurnState.set(gameId, initialTurnState);
    await processNextAction(gameId);
  };

  const endRound = async (gameId: string, finalTurnState: TurnState) => {
    console.log(`[Game ${gameId}] Round ${finalTurnState.state.currentRound} finished.`);
    
    const { nextState, nextPrivateStates } = GameEngine.applyEndOfRoundEffects(finalTurnState);

    const { data: updatedGame, error: updateError } = await supabase
      .from('games').update(nextState as any).eq('id', gameId).select().single();
    if (updateError) throw new Error(`Supabase game update error: ${updateError.message}`);

    const playerUpdates = nextPrivateStates.map((p) => {
      return supabase
        .from('game_players')
        .update({
          vp: p.vp, hand: p.hand, personal_goal: p.personalGoal,
          submitted_action: null,
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

      const { data: privateState, error: playerError } = await supabase
        .from('game_players').select('*').eq('game_id', gameId).eq('user_id', userId).single();
      if (playerError || !privateState) throw new Error(`Player ${userId} not found in game ${gameId}`);

      socket.join(gameId);
      
      // Populate central maps
      socketInRoom.set(socket.id, { roomId: gameId, type: 'game' });
      socketToUser.set(socket.id, { userId, username: privateState.username });

      socket.emit('game:full_state', {
        publicState: publicState as GameState,
        privateState: privateState as PrivatePlayerState,
      });

      socket.to(gameId).emit('game:player_joined', { username: privateState.username });
    } catch (error: any) {
      console.error(`[${socket.id}] Error in joinGame: ${error.message}`);
      socket.emit('error:game', { message: 'Failed to join game.' });
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
      if (turnState.modifiers.awaitingMoveFromPlayerId !== userInfo?.userId) {
        throw new Error('It is not your turn to move.');
      }

      console.log(`[${socket.id}] submitMove: ${userInfo.username} moves to ${position.x},${position.y}`);
      const { nextTurnState } = GameEngine.processSubmittedMove(turnState, position);
      gameTurnState.set(gameId, nextTurnState);
      await processNextAction(gameId);
    } catch (error: any) {
      console.error(`[${socket.id}] Error in submitMove: ${error.message}`);
      socket.emit('error:game', { message: 'Failed to submit move.' });
    }
  };

  const handleChatMessage = (payload: { gameId: string; message: any }) => {
    try {
      const { gameId, message } = payload;
      socket.to(gameId).emit('chat:receive', message);
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
export const handleGameDisconnect = (
  io: Server,
  socket: Socket,
  supabase: AdminSupabaseClient,
  roomId: string,
  userInfo: { userId: string; username: string }
) => {
  console.log(`[${socket.id}] ${userInfo.username} disconnected from game ${roomId}`);
  io.to(roomId).emit('game:player_left', { username: userInfo.username });
  
  // TODO: Handle disconnect in the middle of a turn.
  // This is complex. e.g., if (gameTurnState.has(roomId)) { ... }
  // You might need to auto-play a "Buffer" card for them.
};