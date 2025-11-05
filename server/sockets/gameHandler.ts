// server/sockets/gameHandler.ts

import { Server, Socket } from 'socket.io';
import { SupabaseClient } from '@supabase/supabase-js';
import { GameEngine } from '../services/GameEngine.js'; // Note .js
import {
  GameState,
  PrivatePlayerState,
  SubmittedAction,
} from '../../src/types/game';

type AdminSupabaseClient = SupabaseClient<any, 'public', any>;

// This map will track which game room a socket is in
const socketInRoom = new Map<string, string>();
// This map will track the user ID for a socket
const socketToUser = new Map<string, { userId: string; username: string }>();

export const registerGameHandlers = (
  io: Server,
  socket: Socket,
  supabase: AdminSupabaseClient
) => {
  /**
   * Creates a new game lobby (and immediately a game).
   */
  const createGame = async (payload: {
    userId: string;
    username: string;
    scenario: 'wanting-beggar';
  }) => {
    try {
      console.log(`[${socket.id}] createGame:`, payload);
      const { userId, username, scenario } = payload;

      // In a real lobby, you'd gather 3-6 players first.
      // For now, we'll create a 1-player game for testing.
      const playerIds = [userId];
      const usernames = { [userId]: username };

      const { gameState, privatePlayerStates } = GameEngine.setupGame(
        playerIds,
        usernames,
        scenario
      );

      // --- 1. Save to Supabase ---
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert(gameState as any)
        .select()
        .single();

      if (gameError)
        throw new Error(`Supabase game insert error: ${gameError.message}`);

      const playerInserts = privatePlayerStates.map((p) => ({
        ...p,
        game_id: gameData.id,
        user_id: p.userId,
      }));

      const { error: playerError } = await supabase
        .from('game_players')
        .insert(playerInserts);

      if (playerError)
        throw new Error(`Supabase player insert error: ${playerError.message}`);

      console.log(`[${socket.id}] Game created: ${gameData.id}`);

      // --- 2. Join Socket to Room ---
      socket.join(gameData.id);
      socketInRoom.set(socket.id, gameData.id);
      socketToUser.set(socket.id, { userId, username });

      // --- 3. Send Full Data to Creator ---
      // We emit 'game:created' which the MainMenuPage will listen for
      socket.emit('game:created', {
        publicState: gameData as GameState,
        privateState: privatePlayerStates[0],
      });
    } catch (error) {
      console.error(`[${socket.id}] Error in createGame: ${error.message}`);
      socket.emit('error:game', { message: 'Failed to create game.' });
    }
  };

  /**
   * Joins a player to an existing game room.
   */
  const joinGame = async (payload: { gameId: string; userId: string }) => {
    try {
      const { gameId, userId } = payload;
      console.log(`[${socket.id}] joinGame: ${userId} joining ${gameId}`);

      // 1. Fetch the Public Game State
      const { data: publicState, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError || !publicState)
        throw new Error(`Game not found: ${gameId}`);

      // 2. Fetch the Private Player State
      const { data: privateState, error: playerError } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .single();

      if (playerError || !privateState)
        throw new Error(`Player ${userId} not found in game ${gameId}`);

      // 3. Add socket to the room and user tracking
      socket.join(gameId);
      socketInRoom.set(socket.id, gameId);
      socketToUser.set(socket.id, {
        userId,
        username: privateState.username,
      });

      // 4. Send the full state to the joining player
      socket.emit('game:full_state', { publicState, privateState });

      // 5. Notify other players in the room
      socket
        .to(gameId)
        .emit('game:player_joined', { username: privateState.username });
    } catch (error) {
      console.error(`[${socket.id}] Error in joinGame: ${error.message}`);
      socket.emit('error:game', { message: 'Failed to join game.' });
    }
  };

  /**
   * Handles a player submitting their action.
   */
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

      // 1. Save the player's action to the DB
      const { error } = await supabase
        .from('game_players')
        .update({ submitted_action: card })
        .eq('game_id', gameId)
        .eq('user_id', userId);

      if (error)
        throw new Error(`Supabase action update error: ${error.message}`);

      // 2. Notify the room that this player has submitted
      io.to(gameId).emit('game:player_submitted', { userId });

      // 3. Check if all players have submitted
      const { data: players, error: fetchError } = await supabase
        .from('game_players')
        .select('user_id, submitted_action')
        .eq('game_id', gameId);

      if (fetchError)
        throw new Error(`Supabase player fetch error: ${fetchError.message}`);

      const allSubmitted = players.every((p) => p.submitted_action != null);

      if (allSubmitted) {
        console.log(
          `[${socket.id}] All actions submitted for game ${gameId}. Resolving round...`
        );

        const { data: currentState, error: gameFetchError } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();

        if (gameFetchError)
          throw new Error(`Supabase game fetch error: ${gameFetchError.message}`);

        const submittedActions = players.map((p) => ({
          playerId: p.user_id,
          card: p.submitted_action,
          priority: 0, // Engine will determine this
        }));

        const nextState = GameEngine.resolveRound(
          currentState as any,
          submittedActions as SubmittedAction[]
        );

        const { data: updatedGame, error: updateError } = await supabase
          .from('games')
          .update(nextState as any)
          .eq('id', gameId)
          .select()
          .single();

        if (updateError)
          throw new Error(`Supabase game update error: ${updateError.message}`);

        io.to(gameId).emit('game:state_update', updatedGame);

        await supabase
          .from('game_players')
          .update({ submitted_action: null })
          .eq('game_id', gameId);
      }
    } catch (error) {
      console.error(`[${socket.id}] Error in submitAction: ${error.message}`);
      socket.emit('error:game', { message: 'Failed to submit action.' });
    }
  };

  /**
   * (NEW) Handle a chat message
   */
  const handleChatMessage = (payload: { gameId: string; message: any }) => {
    try {
      const { gameId, message } = payload;
      // Broadcast to everyone *except* the sender
      socket.to(gameId).emit('chat:receive', message);
    } catch (error) {
      console.error(`[${socket.id}] Error in handleChatMessage: ${error.message}`);
    }
  };

  /**
   * Handle a player disconnecting
   */
  const handleDisconnect = () => {
    try {
      const gameId = socketInRoom.get(socket.id);
      const userInfo = socketToUser.get(socket.id);

      if (gameId && userInfo) {
        console.log(
          `[${socket.id}] ${userInfo.username} disconnected from game ${gameId}`
        );
        // Notify room that this user left
        io.to(gameId).emit('game:player_left', {
          username: userInfo.username,
        });
      }
      // Clean up maps
      socketInRoom.delete(socket.id);
      socketToUser.delete(socket.id);
    } catch (error) {
      console.error(`[${socket.id}] Error in handleDisconnect: ${error.message}`);
    }
  };

  // --- Register Listeners ---
  socket.on('game:create', createGame);
  socket.on('game:join', joinGame);
  socket.on('action:submit', submitAction);
  socket.on('chat:send', handleChatMessage); // <-- New
  socket.on('disconnecting', handleDisconnect);
};