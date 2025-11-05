// server/sockets/gameHandler.ts

import { Server, Socket } from 'socket.io';
import { SupabaseClient } from '@supabase/supabase-js';
import { GameEngine, TurnState } from '../services/GameEngine.js'; // <-- TurnState imported
import {
  GameState,
  PrivatePlayerState,
  SubmittedAction,
  BoardSpace, // <-- NEW
} from '../../src/types/game';

type AdminSupabaseClient = SupabaseClient<any, 'public', any>;

const socketInRoom = new Map<string, string>();
const socketToUser = new Map<string, { userId: string; username: string }>();

// NEW: This holds the "in-progress" state of all active game turns
const gameTurnState = new Map<string, TurnState>();

export const registerGameHandlers = (
  io: Server,
  socket: Socket,
  supabase: AdminSupabaseClient
) => {
  // --- Internal Helper Functions ---

  /**
   * (NEW) Processes the next action in the queue for a given game.
   * This is the core of the new event-driven, pausable turn.
   */
  const processNextAction = async (gameId: string) => {
    let turnState = gameTurnState.get(gameId);
    if (!turnState) {
      console.error(`No turn state found for game ${gameId} to process next action.`);
      return;
    }

    // 1. Check if the action queue is empty
    if (turnState.actionQueue.length === 0) {
      // The round is over
      await endRound(gameId, turnState);
      return;
    }

    // 2. Process the next action
    const action = turnState.actionQueue.shift()!;
    const { nextTurnState, pause } = await GameEngine.processSingleAction(
      turnState,
      action
    );

    // 3. Save the new state
    gameTurnState.set(gameId, nextTurnState);

    // 4. Check if the engine has paused
    if (pause) {
      // PAUSE: The action was a "Move" card.
      console.log(`[Game ${gameId}] Pausing for move input from ${pause.playerId}`);
      // Send the request *only* to the player who needs to move
      const playerSocketId = Object.keys(socketToUser).find(
        (key) => socketToUser.get(key)?.userId === pause.playerId
      );
      if (playerSocketId) {
        io.to(playerSocketId).emit('game:await_move', pause);
      }
      // Notify all other players
      socket.to(gameId).emit('game:awaiting_input', {
        message: `Waiting for ${pause.actingUsername} to move...`,
      });
    } else {
      // CONTINUE: The action was processed instantly.
      // Loop to the next action.
      await processNextAction(gameId);
    }
  };

  /**
   * (NEW) Checks if all players have submitted their action.
   * If so, kicks off the round resolution.
   */
  const checkAllActionsSubmitted = async (gameId: string) => {
    // 1. Check if all players have submitted
    const { data: players, error: fetchError } = await supabase
      .from('game_players')
      .select('user_id, submitted_action')
      .eq('game_id', gameId);

    if (fetchError)
      throw new Error(`Supabase player fetch error: ${fetchError.message}`);

    const allSubmitted = players.every((p) => p.submitted_action != null);
    if (!allSubmitted) {
      return; // Not ready yet
    }

    console.log(`[Game ${gameId}] All actions submitted. Resolving round...`);

    // 2. Get all game data to start the turn
    const { data: currentState, error: gameFetchError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();
    if (gameFetchError)
      throw new Error(`Supabase game fetch error: ${gameFetchError.message}`);

    const { data: allPlayerStates, error: playersFetchError } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', gameId);
    if (playersFetchError)
      throw new Error(`Supabase players fetch error: ${playersFetchError.message}`);

    const submittedActions = allPlayerStates.map((p) => ({
      playerId: p.user_id,
      card: p.submitted_action,
      priority: 0, // Engine will sort this
    }));

    // 3. Initialize the TurnState
    const initialTurnState = GameEngine.startRoundResolution(
      currentState as GameState,
      allPlayerStates as PrivatePlayerState[],
      submittedActions as SubmittedAction[]
    );
    
    // 4. Save the initial turn state and start the loop
    gameTurnState.set(gameId, initialTurnState);
    await processNextAction(gameId);
  };

  /**
   * (NEW) Called when a round is finished processing.
   * Saves everything to DB and notifies clients.
   */
  const endRound = async (gameId: string, finalTurnState: TurnState) => {
    console.log(`[Game ${gameId}] Round ${finalTurnState.state.currentRound} finished.`);
    
    // 1. Apply end-of-round effects (VP, Complications, etc.)
    const { nextState, nextPrivateStates } = GameEngine.applyEndOfRoundEffects(
      finalTurnState
    );

    // 2. Save new public state to DB
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update(nextState as any)
      .eq('id', gameId)
      .select()
      .single();
    if (updateError)
      throw new Error(`Supabase game update error: ${updateError.message}`);

    // 3. Save new private states to DB
    const playerUpdates = nextPrivateStates.map((p) => {
      return supabase
        .from('game_players')
        .update({
          vp: p.vp,
          hand: p.hand,
          personal_goal: p.personalGoal,
          submitted_action: null, // Clear action for next round
        })
        .eq('id', p.id);
    });
    await Promise.all(playerUpdates);

    // 4. Notify all clients
    io.to(gameId).emit('game:state_update', updatedGame);
    for (const p of nextPrivateStates) {
      const playerSocket = Object.keys(socketToUser).find(
        (key) => socketToUser.get(key)?.userId === p.userId
      );
      if (playerSocket) {
        io.to(playerSocket).emit('game:private_update', p);
      }
    }

    // 5. Clean up the turn state
    gameTurnState.delete(gameId);
  };

  // --- Socket Event Listeners ---

  const joinGame = async (payload: { gameId: string; userId: string }) => {
    try {
      const { gameId, userId } = payload;
      console.log(`[${socket.id}] joinGame: ${userId} joining ${gameId}`);

      const { data: publicState, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();
      if (gameError || !publicState) throw new Error(`Game not found: ${gameId}`);

      const { data: privateState, error: playerError } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .single();
      if (playerError || !privateState)
        throw new Error(`Player ${userId} not found in game ${gameId}`);

      socket.join(gameId);
      socketInRoom.set(socket.id, gameId);
      socketToUser.set(socket.id, {
        userId,
        username: privateState.username,
      });

      socket.emit('game:full_state', {
        publicState: publicState as GameState,
        privateState: privateState as PrivatePlayerState,
      });

      socket
        .to(gameId)
        .emit('game:player_joined', { username: privateState.username });
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
      console.log(
        `[${socket.id}] submitAction: ${userId} played ${card.name} for game ${gameId}`
      );

      const { error } = await supabase
        .from('game_players')
        .update({ submitted_action: card })
        .eq('game_id', gameId)
        .eq('user_id', userId);
      if (error)
        throw new Error(`Supabase action update error: ${error.message}`);

      io.to(gameId).emit('game:player_submitted', { userId });

      // Check if all players are ready
      await checkAllActionsSubmitted(gameId);
    } catch (error: any) {
      console.error(`[${socket.id}] Error in submitAction: ${error.message}`);
      socket.emit('error:game', { message: 'Failed to submit action.' });
    }
  };
  
  /**
   * (NEW) Player has submitted their chosen move.
   */
  const submitMove = async (payload: {
    gameId: string;
    position: BoardSpace;
  }) => {
    try {
      const { gameId, position } = payload;
      let turnState = gameTurnState.get(gameId);
      if (!turnState) {
        throw new Error('No active turn state found for this move.');
      }
      
      const userInfo = socketToUser.get(socket.id);
      if (turnState.modifiers.awaitingMoveFromPlayerId !== userInfo?.userId) {
        throw new Error('It is not your turn to move.');
      }

      console.log(`[${socket.id}] submitMove: ${userInfo.username} moves to ${position.x},${position.y}`);

      // 1. Process the move
      const { nextTurnState } = GameEngine.processSubmittedMove(
        turnState,
        position
      );
      
      // 2. Update the state
      gameTurnState.set(gameId, nextTurnState);
      
      // 3. Resume the action queue
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

  const handleDisconnect = () => {
    try {
      const gameId = socketInRoom.get(socket.id);
      const userInfo = socketToUser.get(socket.id);
      if (gameId && userInfo) {
        console.log(
          `[${socket.id}] ${userInfo.username} disconnected from game ${gameId}`
        );
        io.to(gameId).emit('game:player_left', {
          username: userInfo.username,
        });
        // TODO: Handle disconnect in the middle of a turn
        // e.g., if (gameTurnState.has(gameId)) { ... }
      }
      socketInRoom.delete(socket.id);
      socketToUser.delete(socket.id);
    } catch (error: any) {
      console.error(`[${socket.id}] Error in handleDisconnect: ${error.message}`);
    }
  };

  // --- Register Listeners ---
  socket.on('game:join', joinGame);
  socket.on('action:submit', submitAction);
  socket.on('action:submit_move', submitMove); // <-- NEW
  socket.on('chat:send', handleChatMessage);
  socket.on('disconnecting', handleDisconnect);
};