// server/sockets/lobbyHandler.ts

import { Server, Socket } from 'socket.io';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';
import { GameEngine } from '../services/GameEngine.js';
import { Scenario } from '../../src/types/game.js';

type AdminSupabaseClient = SupabaseClient<any, 'public', any>;
type UserMap = Map<string, { userId: string; username: string }>;
type RoomMap = Map<string, { roomId: string, type: 'lobby' | 'game' }>;

export const registerLobbyHandlers = (
  io: Server,
  socket: Socket,
  supabase: AdminSupabaseClient,
  socketToUser: UserMap, // <-- NEW
  socketInRoom: RoomMap  // <-- NEW
) => {
  const createLobby = async (payload: {
    userId: string;
    username: string;
    scenarioId: string;
  }) => {
    try {
      const { userId, username, scenarioId } = payload;
      const gameId = uuid();

      const { error: gameError } = await supabase
        .from('games')
        .insert({ id: gameId, host_id: userId, scenario_id: scenarioId, status: 'lobby', priority_track: [] });
      if (gameError) throw new Error(`DB game insert error: ${gameError.message}`);

      const { error: playerError } = await supabase
        .from('game_players')
        .insert({ game_id: gameId, user_id: userId, username: username, is_ready: false });
      if (playerError) throw new Error(`DB player insert error: ${playerError.message}`);

      console.log(`[${socket.id}] Lobby created: ${gameId}`);
      socket.join(gameId);
      
      // Populate central maps
      socketInRoom.set(socket.id, { roomId: gameId, type: 'lobby' });
      socketToUser.set(socket.id, { userId, username });
      
      socket.emit('lobby:joined', { gameId: gameId });
    } catch (error: any) {
      console.error(`[${socket.id}] Error in createLobby: ${error.message}`);
      socket.emit('error:lobby', { message: 'Failed to create lobby.' });
    }
  };

  const getLobbies = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`id, host_id, scenarios ( id, name, description ), game_players ( user_id, username )`)
        .eq('status', 'lobby')
        .eq('scenarios.is_published', true);
      if (error) throw new Error(`DB lobby fetch error: ${error.message}`);
      socket.emit('lobby:list', data);
    } catch (error: any) {
      console.error(`[${socket.id}] Error in getLobbies: ${error.message}`);
      socket.emit('error:lobby', { message: 'Failed to fetch lobbies.' });
    }
  };

  const joinLobby = async (payload: {
    gameId: string;
    userId: string;
    username: string;
  }) => {
    try {
      const { gameId, userId, username } = payload;
      
      const { error: playerError } = await supabase
        .from('game_players')
        .insert({ game_id: gameId, user_id: userId, username: username, is_ready: false });
      if (playerError) throw new Error(`DB player insert error: ${playerError.message}`);

      socket.join(gameId);
      
      // Populate central maps
      socketInRoom.set(socket.id, { roomId: gameId, type: 'lobby' });
      socketToUser.set(socket.id, { userId, username });
      
      socket.emit('lobby:joined', { gameId: gameId });
    } catch (error: any) {
      console.error(`[${socket.id}] Error in joinLobby: ${error.message}`);
      socket.emit('error:lobby', { message: 'Failed to join lobby.' });
    }
  };

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
    } catch (error: any) {
      console.error(`[${socket.id}] Error in setReady: ${error.message}`);
      socket.emit('error:lobby', { message: 'Failed to set ready status.' });
    }
  };

  const startGame = async (payload: { gameId: string }) => {
    try {
      const { gameId } = payload;
      
      const { data: lobbyData, error: lobbyError } = await supabase
        .from('games')
        .select(`*, game_players ( user_id, username, is_ready )`)
        .eq('id', gameId)
        .single();
      if (lobbyError) throw new Error(`DB lobby fetch error: ${lobbyError.message}`);
      
      const userInfo = socketToUser.get(socket.id);
      if (lobbyData.host_id !== userInfo?.userId) {
        throw new Error('Only the host can start the game.');
      }

      const players = lobbyData.game_players;
      if (players.length < 3) throw new Error('Not enough players (min 3).');
      if (players.length > 6) throw new Error('Too many players (max 6).');
      if (!players.every(p => p.is_ready)) throw new Error('Not all players are ready.');

      console.log(`[${socket.id}] Starting game ${gameId}...`);

      const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', lobbyData.scenario_id)
        .single();
      if (scenarioError || !scenario) {
        throw new Error(`Could not load scenario: ${lobbyData.scenario_id}`);
      }

      const playerIds = players.map(p => p.user_id);
      const usernames = players.reduce((acc, p) => {
        acc[p.user_id] = p.username;
        return acc;
      }, {} as Record<string, string>);

      const { gameState, privatePlayerStates } = GameEngine.setupGame(
        playerIds,
        usernames,
        scenario as Scenario
      );

      const { error: gameUpdateError } = await supabase
        .from('games')
        .update({
          status: 'active',
          current_round: 1,
          harbinger_position: gameState.harbingerPosition,
          priority_track: gameState.priorityTrack,
          game_objects: gameState.boardObjects,
          npcs: gameState.boardNPCs,
          active_complications: [],
          game_log: ['Game started.'],
        })
        .eq('id', gameId);
      if (gameUpdateError) throw new Error(`DB game update error: ${gameUpdateError.message}`);

      const playerUpdates = privatePlayerStates.map(p => {
        return supabase
          .from('game_players')
          .update({
            hand: p.hand, role: p.role, sub_role: p.subRole,
            secret_identity: p.secretIdentity, vp: 0,
            personal_goal: p.personalGoal || null,
          })
          .eq('game_id', gameId)
          .eq('user_id', p.userId);
      });
      await Promise.all(playerUpdates);

      // Update room type for all players
      for (const player of players) {
        const playerSocketId = [...socketToUser.entries()]
          .find(([, user]) => user.userId === player.user_id)?.[0];
        if (playerSocketId) {
          socketInRoom.set(playerSocketId, { roomId: gameId, type: 'game' });
        }
      }

      console.log(`[${socket.id}] Game ${gameId} is starting!`);
      io.to(gameId).emit('game:starting');
      
    } catch (error: any) {
      console.error(`[${socket.id}] Error in startGame: ${error.message}`);
      socket.emit('error:lobby', { message: `Failed to start game: ${error.message}` });
    }
  };

  socket.on('lobby:create', createLobby);
  socket.on('lobby:get_list', getLobbies);
  socket.on('lobby:join', joinLobby);
  socket.on('lobby:set_ready', setReady);
  socket.on('lobby:start_game', startGame);
};

/**
 * (NEW) Exported disconnect handler
 */
export const handleLobbyDisconnect = (
  io: Server,
  socket: Socket,
  supabase: AdminSupabaseClient,
  roomId: string,
  userInfo: { userId: string; username: string }
) => {
  console.log(`[${socket.id}] ${userInfo.username} disconnected from lobby ${roomId}`);
  // TODO: Add logic to remove player from 'game_players' table
  // and notify others in the lobby.
  // const { error } = await supabase.from('game_players').delete().match({ game_id: roomId, user_id: userInfo.userId });
  // io.to(roomId).emit('lobby:player_left', { userId: userInfo.userId });
};