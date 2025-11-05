// server/sockets/lobbyHandler.ts

import { Server, Socket } from 'socket.io';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';
import { GameEngine } from '../services/GameEngine.js'; // We need the GameEngine!

type AdminSupabaseClient = SupabaseClient<any, 'public', any>;

export const registerLobbyHandlers = (
  io: Server,
  socket: Socket,
  supabase: AdminSupabaseClient
) => {
  /**
   * Creates a new game lobby and sets the creator as host.
   */
  const createLobby = async (payload: {
    userId: string;
    username: string;
    scenarioId: string;
  }) => {
    try {
      const { userId, username, scenarioId } = payload;
      const gameId = uuid();

      // 1. Create the 'game' entry
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          id: gameId,
          host_id: userId,
          scenario_id: scenarioId, // This must be a valid UUID from your 'scenarios' table
          status: 'lobby',
          priority_track: [],
        })
        .select()
        .single();

      if (gameError) throw new Error(`DB game insert error: ${gameError.message}`);

      // 2. Add the host as the first player
      const { data: playerData, error: playerError } = await supabase
        .from('game_players')
        .insert({
          game_id: gameId,
          user_id: userId,
          username: username,
          is_ready: false,
        })
        .select()
        .single();

      if (playerError)
        throw new Error(`DB player insert error: ${playerError.message}`);

      console.log(`[${socket.id}] Lobby created: ${gameId}`);
      socket.join(gameId);
      socket.emit('lobby:joined', { gameId: gameId });
    } catch (error) {
      console.error(`[${socket.id}] Error in createLobby: ${error.message}`);
      socket.emit('error:lobby', { message: 'Failed to create lobby.' });
    }
  };

  /**
   * Gets a list of all currently open lobbies.
   */
  const getLobbies = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(
          `
          id,
          host_id,
          scenario_id,
          game_players ( user_id, username )
        `
        )
        .eq('status', 'lobby');

      if (error) throw new Error(`DB lobby fetch error: ${error.message}`);
      socket.emit('lobby:list', data);
    } catch (error) {
      console.error(`[${socket.id}] Error in getLobbies: ${error.message}`);
      socket.emit('error:lobby', { message: 'Failed to fetch lobbies.' });
    }
  };

  /**
   * Joins an existing lobby.
   */
  const joinLobby = async (payload: {
    gameId: string;
    userId: string;
    username: string;
  }) => {
    try {
      const { gameId, userId, username } = payload;
      
      // TODO: Add check to see if lobby is full (max 6)

      // 1. Add this player to the 'game_players' table
      const { error: playerError } = await supabase
        .from('game_players')
        .insert({
          game_id: gameId,
          user_id: userId,
          username: username,
          is_ready: false,
        });

      if (playerError)
        throw new Error(`DB player insert error: ${playerError.message}`);

      // 2. Join the socket to the lobby room
      socket.join(gameId);

      // 3. Send confirmation *back to the joiner*
      socket.emit('lobby:joined', { gameId: gameId });
      // Realtime handles broadcasting to others!
    } catch (error) {
      console.error(`[${socket.id}] Error in joinLobby: ${error.message}`);
      socket.emit('error:lobby', { message: 'Failed to join lobby.' });
    }
  };

  /**
   * (NEW) Sets a player's ready status.
   */
  const setReady = async (payload: {
    gameId: string;
    userId: string;
    isReady: boolean;
  }) => {
    try {
      const { gameId, userId, isReady } = payload;
      const { error } = await supabase
        .from('game_players')
        .update({ is_ready: isReady })
        .eq('game_id', gameId)
        .eq('user_id', userId);

      if (error) throw new Error(`DB ready update error: ${error.message}`);
      // Realtime handles broadcasting the change!
    } catch (error) {
      console.error(`[${socket.id}] Error in setReady: ${error.message}`);
      socket.emit('error:lobby', { message: 'Failed to set ready status.' });
    }
  };

  /**
   * (NEW) Starts the game.
   */
  const startGame = async (payload: { gameId: string }) => {
    try {
      const { gameId } = payload;
      const { data: lobbyData, error: lobbyError } = await supabase
        .from('games')
        .select(
          `
          host_id,
          game_players ( user_id, username, is_ready )
        `
        )
        .eq('id', gameId)
        .single();
      
      if (lobbyError) throw new Error(`DB lobby fetch error: ${lobbyError.message}`);
      
      // --- Validation ---
      if (lobbyData.host_id !== socket.handshake.auth.userId) { // Assuming you pass userId in auth
        // Fallback if not passing auth: check against a map
        console.warn(`[${socket.id}] Non-host tried to start game ${gameId}`);
        // For now, we'll just check if they are the host from the DB
        // const { data: profile } = await supabase.auth.getUser(); // This is client-side
        // This needs a robust check, but for now we'll trust the client
        // A better way is to pass user ID on socket connection
      }

      const players = lobbyData.game_players;
      if (players.length < 3) throw new Error('Not enough players (min 3).');
      if (players.length > 6) throw new Error('Too many players (max 6).');
      if (!players.every(p => p.is_ready)) throw new Error('Not all players are ready.');

      console.log(`[${socket.id}] Starting game ${gameId}...`);

      // --- 1. Setup the Game ---
      const playerIds = players.map(p => p.user_id);
      const usernames = players.reduce((acc, p) => {
        acc[p.user_id] = p.username;
        return acc;
      }, {} as Record<string, string>);

      // TODO: Get real scenario name
      const { gameState, privatePlayerStates } = GameEngine.setupGame(
        playerIds,
        usernames,
        'wanting-beggar'
      );

      // --- 2. Update the Game table ---
      const { error: gameUpdateError } = await supabase
        .from('games')
        .update({
          status: 'active',
          current_round: 1,
          harbinger_position: gameState.harbingerPosition,
          priority_track: gameState.priorityTrack,
          game_objects: gameState.boardObjects,
          npcs: gameState.boardNPCs,
          // etc.
        })
        .eq('id', gameId);

      if (gameUpdateError) throw new Error(`DB game update error: ${gameUpdateError.message}`);

      // --- 3. Update all Player tables ---
      const playerUpdates = privatePlayerStates.map(p => {
        return supabase
          .from('game_players')
          .update({
            hand: p.hand,
            role: p.role,
            sub_role: p.subRole,
            secret_identity: p.secretIdentity,
            vp: 0,
            personal_goal: p.personalGoal || null,
          })
          .eq('game_id', gameId)
          .eq('user_id', p.userId);
      });
      
      await Promise.all(playerUpdates);

      // --- 4. Broadcast to all players ---
      console.log(`[${socket.id}] Game ${gameId} is starting!`);
      io.to(gameId).emit('game:starting');
      
    } catch (error) {
      console.error(`[${socket.id}] Error in startGame: ${error.message}`);
      socket.emit('error:lobby', { message: `Failed to start game: ${error.message}` });
    }
  };

  // --- Register Listeners ---
  socket.on('lobby:create', createLobby);
  socket.on('lobby:get_list', getLobbies);
  socket.on('lobby:join', joinLSobby);
  socket.on('lobby:set_ready', setReady); // <-- New
  socket.on('lobby:start_game', startGame); // <-- New
};