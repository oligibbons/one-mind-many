// server/sockets/lobbyHandler.ts

import { Server, Socket } from 'socket.io';
import { SupabaseClient } from '@supabase/supabase-js';
import { GameEngine } from '../services/GameEngine.js';
import { Scenario } from '../../src/types/game.js';

type AdminSupabaseClient = SupabaseClient<any, 'public', any>;
type UserMap = Map<string, { userId: string; username: string }>;
type RoomMap = Map<string, { roomId: string, type: 'lobby' | 'game' }>;

// Helper for random lobby codes
const generateLobbyCode = (length = 6): string => {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // Omitted O and 0
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Helper to broadcast lobby list updates to all clients NOT in a lobby
const broadcastLobbyList = async (
  io: Server,
  supabase: AdminSupabaseClient,
) => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select(
        `
        id, 
        name, 
        host_id, 
        game_players ( user_id, username ),
        scenarios ( name ) 
      `,
      )
      .eq('status', 'lobby')
      .eq('is_public', true);

    if (error) throw new Error(`DB lobby fetch error: ${error.message}`);
    
    const lobbyList = data.map(lobby => ({
      ...lobby,
      scenario_name: lobby.scenarios?.name || 'Unknown Scenario'
    }));

    io.emit('lobby:list', lobbyList);
  } catch (error: any) {
    console.error(`[broadcastLobbyList] Error: ${error.message}`);
  }
};

export const registerLobbyHandlers = (
  io: Server,
  socket: Socket,
  supabase: AdminSupabaseClient,
  socketToUser: UserMap,
  socketInRoom: RoomMap,
) => {
  // --- createLobby (from Batch 2) ---
  const createLobby = async (
    payload: {
      name: string;
      isPublic: boolean;
    },
    callback: (
      response:
        | { status: 'ok'; lobbyId: string }
        | { status: 'error'; message: string },
    ) => void,
  ) => {
    try {
      const { name, isPublic } = payload;
      const userInfo = socketToUser.get(socket.id);
      if (!userInfo) throw new Error('User not authenticated');
      if (!name) throw new Error('Lobby name is required');

      const { userId, username } = userInfo;

      const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('id')
        .eq('is_published', true)
        .limit(1)
        .single();

      if (scenarioError || !scenario) {
        throw new Error('No published scenarios found. Cannot create lobby.');
      }
      
      let lobbyCode: string | null = null;
      if (!isPublic) {
        let isUnique = false;
        while (!isUnique) {
          lobbyCode = generateLobbyCode();
          const { data: existing, error } = await supabase
            .from('games')
            .select('id')
            .eq('lobby_code', lobbyCode)
            .eq('status', 'lobby')
            .single();
          if (!existing) isUnique = true;
        }
      }

      const gameId = crypto.randomUUID();
      const { error: gameError } = await supabase.from('games').insert({
        id: gameId,
        host_id: userId,
        scenario_id: scenario.id,
        status: 'lobby',
        name,
        is_public: isPublic,
        lobby_code: lobbyCode,
        priority_track: [],
      });
      if (gameError)
        throw new Error(`DB game insert error: ${gameError.message}`);

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

      console.log(`[${socket.id}] Lobby created: ${gameId} (Public: ${isPublic})`);
      socket.join(gameId);
      socketInRoom.set(socket.id, { roomId: gameId, type: 'lobby' });
      
      callback({ status: 'ok', lobbyId: gameId });

      broadcastLobbyList(io, supabase);
      
    } catch (error: any) {
      console.error(`[${socket.id}] Error in createLobby: ${error.message}`);
      callback({ status: 'error', message: `Failed to create lobby: ${error.message}` });
    }
  };

  // --- getLobbies (from Batch 2) ---
  const getLobbies = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(
          `
          id, 
          name, 
          host_id, 
          game_players ( user_id, username ),
          scenarios ( name )
        `,
        )
        .eq('status', 'lobby')
        .eq('is_public', true);
        
      if (error) throw new Error(`DB lobby fetch error: ${error.message}`);
      
      const lobbyList = data.map(lobby => ({
        ...lobby,
        scenario_name: lobby.scenarios?.name || 'Unknown Scenario'
      }));

      socket.emit('lobby:list', lobbyList);
    } catch (error: any) {
      console.error(`[${socket.id}] Error in getLobbies: ${error.message}`);
      socket.emit('error:lobby', { message: 'Failed to fetch lobbies.' });
    }
  };

  // --- joinLobby (from Batch 2) ---
  const joinLobby = async (payload: {
    gameId: string;
    userId: string;
    username: string;
  }) => {
    try {
      const { gameId, userId, username } = payload;
      
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('status, is_public')
        .eq('id', gameId)
        .single();
        
      if (gameError || !game) throw new Error('Lobby not found.');
      if (game.status !== 'lobby') throw new Error('Game has already started.');
      if (!game.is_public) throw new Error('This is a private lobby. Use a code to join.');

      const { data: players, error: countError } = await supabase
        .from('game_players')
        .select('user_id', { count: 'exact' })
        .eq('game_id', gameId);

      if (countError) throw new Error(`DB player count error: ${countError.message}`);
      const playerCount = players?.length || 0;
      
      const isAlreadyIn = players.some(p => p.user_id === userId);
      if (isAlreadyIn) {
        console.log(`[${socket.id}] User ${username} rejoining lobby ${gameId}`);
      } else {
        if (playerCount >= 6) throw new Error('Lobby is full (max 6 players).');
        
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
      }
      
      socket.join(gameId);
      socketInRoom.set(socket.id, { roomId: gameId, type: 'lobby' });

      socket.emit('lobby:joined', { gameId: gameId });
      
      broadcastLobbyList(io, supabase);
      
    } catch (error: any) {
      console.error(`[${socket.id}] Error in joinLobby: ${error.message}`);
      socket.emit('error:lobby', { message: `Failed to join lobby: ${error.message}` });
    }
  };

  // --- joinPrivateLobby (from Batch 2) ---
  const joinPrivateLobby = async (payload: {
    lobbyCode: string;
    userId: string;
    username: string;
  }) => {
    try {
      const { lobbyCode, userId, username } = payload;
      
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('id, status')
        .eq('lobby_code', lobbyCode.toUpperCase()) // Ensure code is uppercase
        .eq('status', 'lobby')
        .single();
        
      if (gameError || !game) throw new Error('Invalid lobby code.');
      if (game.status !== 'lobby') throw new Error('Game has already started.');

      // Found game, now call the normal join logic, but use game.id
      // We'll bypass the public check by calling joinLobby logic directly
      const { data: players, error: countError } = await supabase
        .from('game_players')
        .select('user_id', { count: 'exact' })
        .eq('game_id', game.id);

      if (countError) throw new Error(`DB player count error: ${countError.message}`);
      const playerCount = players?.length || 0;

      const isAlreadyIn = players.some(p => p.user_id === userId);
      if (isAlreadyIn) {
         console.log(`[${socket.id}] User ${username} rejoining lobby ${game.id}`);
      } else {
        if (playerCount >= 6) throw new Error('Lobby is full (max 6 players).');
        
        const { error: playerError } = await supabase
          .from('game_players')
          .insert({
            game_id: game.id,
            user_id: userId,
            username: username,
            is_ready: false,
          });
        if (playerError)
          throw new Error(`DB player insert error: ${playerError.message}`);
      }

      socket.join(game.id);
      socketInRoom.set(socket.id, { roomId: game.id, type: 'lobby' });
      socket.emit('lobby:joined', { gameId: game.id });
      
      // No need to broadcast, as it's a private lobby
      
    } catch (error: any) {
      console.error(`[${socket.id}] Error in joinPrivateLobby: ${error.message}`);
      socket.emit('error:lobby', { message: error.message });
    }
  };
  
  // --- kickPlayer (from Batch 2) ---
  const kickPlayer = async (payload: { gameId: string; kickUserId: string }) => {
     try {
        const { gameId, kickUserId } = payload;
        const userInfo = socketToUser.get(socket.id);
        if (!userInfo) throw new Error('User not authenticated');
        
        const { data: game, error: gameError } = await supabase
          .from('games')
          .select('host_id')
          .eq('id', gameId)
          .single();
          
        if (gameError || !game) throw new Error('Game not found');
        if (game.host_id !== userInfo.userId) throw new Error('Only the host can kick players.');
        if (game.host_id === kickUserId) throw new Error('Host cannot kick themselves.');
        
        const { error: deleteError } = await supabase
          .from('game_players')
          .delete()
          .match({ game_id: gameId, user_id: kickUserId });
          
        if (deleteError) throw new Error(`DB delete error: ${deleteError.message}`);
        
        const kickedSocketId = [...socketToUser.entries()].find(
          ([, user]) => user.userId === kickUserId
        )?.[0];
        
        if (kickedSocketId && io.sockets.sockets.get(kickedSocketId)) {
          const kickedSocket = io.sockets.sockets.get(kickedSocketId)!;
          kickedSocket.emit('lobby:kicked');
          kickedSocket.leave(gameId);
          socketInRoom.delete(kickedSocketId);
        }
        
        console.log(`[${socket.id}] Kicked user ${kickUserId} from lobby ${gameId}`);
        broadcastLobbyList(io, supabase);

     } catch (error: any) {
      console.error(`[${socket.id}] Error in kickPlayer: ${error.message}`);
      socket.emit('error:lobby', { message: `Failed to kick player: ${error.message}` });
    }
  };

  // --- setReady (from Batch 1 / Original) ---
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
      if (error)
        throw new Error(`DB ready update error: ${error.message}`);
      
    } catch (error: any) {
      console.error(`[${socket.id}] Error in setReady: ${error.message}`);
      socket.emit('error:lobby', { message: 'Failed to set ready status.' });
    }
  };

  // --- startGame (from Batch 1 / Original, with minor tweaks) ---
  const startGame = async (payload: { gameId: string }) => {
    try {
      const { gameId } = payload;

      const { data: lobbyData, error: lobbyError } = await supabase
        .from('games')
        .select(`*, game_players ( user_id, username, is_ready )`)
        .eq('id', gameId)
        .single();
      if (lobbyError)
        throw new Error(`DB lobby fetch error: ${lobbyError.message}`);

      const userInfo = socketToUser.get(socket.id);
      if (lobbyData.host_id !== userInfo?.userId) {
        throw new Error('Only the host can start the game.');
      }

      const players = lobbyData.game_players;
      if (players.length < 3)
        throw new Error('Not enough players (min 3).');
      if (players.length > 6)
        throw new Error('Too many players (max 6).');
      if (!players.every((p) => p.is_ready))
        throw new Error('Not all players are ready.');

      console.log(`[${socket.id}] Starting game ${gameId}...`);

      const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', lobbyData.scenario_id)
        .single();
      if (scenarioError || !scenario) {
        throw new Error(
          `Could not load scenario: ${lobbyData.scenario_id}`
        );
      }

      const playerIds = players.map((p) => p.user_id);
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
          players: gameState.players,
        })
        .eq('id', gameId);
      if (gameUpdateError)
        throw new Error(`DB game update error: ${gameUpdateError.message}`);

      const playerUpdates = privatePlayerStates.map((p) => {
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

      for (const player of players) {
        const playerSocketId = [...socketToUser.entries()].find(
          ([, user]) => user.userId === player.user_id
        )?.[0];
        if (playerSocketId) {
          socketInRoom.set(playerSocketId, {
            roomId: gameId,
            type: 'game',
          });
        }
      }

      console.log(`[${socket.id}] Game ${gameId} is starting!`);
      io.to(gameId).emit('game:starting');
      
      broadcastLobbyList(io, supabase);

    } catch (error: any)
      {
      console.error(
        `[${socket.id}] Error in startGame: ${error.message}`
      );
      socket.emit('error:lobby', {
        message: `Failed to start game: ${error.message}`,
      });
    }
  };
  
  // --- NEW: setScenario (for Batch 3) ---
  const setScenario = async (
    payload: {
      gameId: string;
      scenarioId: string;
    },
    callback: (
      response:
        | { status: 'ok' }
        | { status: 'error'; message: string },
    ) => void,
  ) => {
    try {
      const { gameId, scenarioId } = payload;
      const userInfo = socketToUser.get(socket.id);
      if (!userInfo) throw new Error('User not authenticated');

      // 1. Verify user is host
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('host_id')
        .eq('id', gameId)
        .single();
      
      if (gameError || !game) throw new Error('Lobby not found.');
      if (game.host_id !== userInfo.userId) throw new Error('Only the host can change the scenario.');

      // 2. Verify scenario is valid and published
      const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('id')
        .eq('id', scenarioId)
        .eq('is_published', true)
        .single();

      if (scenarioError || !scenario) throw new Error('Invalid or unpublished scenario.');

      // 3. Update the game
      const { error: updateError } = await supabase
        .from('games')
        .update({ scenario_id: scenarioId })
        .eq('id', gameId);
        
      if (updateError) throw new Error(`DB update error: ${updateError.message}`);

      console.log(`[${socket.id}] Host changed scenario for lobby ${gameId} to ${scenarioId}`);
      callback({ status: 'ok' });
      // Realtime will notify clients of the change

    } catch (error: any) {
      console.error(`[${socket.id}] Error in setScenario: ${error.message}`);
      callback({ status: 'error', message: error.message });
    }
  };


  // --- Register all handlers ---
  socket.on('lobby:create', createLobby);
  socket.on('lobby:get_list', getLobbies);
  socket.on('lobby:join', joinLobby);
  socket.on('lobby:join_private', joinPrivateLobby);
  socket.on('lobby:kick', kickPlayer);
  socket.on('lobby:set_ready', setReady);
  socket.on('lobby:set_scenario', setScenario); // <-- NEW
  socket.on('lobby:start_game', startGame);
};

// --- handleLobbyDisconnect (from Batch 2) ---
export const handleLobbyDisconnect = async (
  io: Server,
  socket: Socket,
  supabase: AdminSupabaseClient,
  roomId: string,
  userInfo: { userId: string; username: string }
) => {
  try {
    console.log(
      `[${socket.id}] ${userInfo.username} disconnected from lobby ${roomId}`
    );
    
    const { error: deleteError } = await supabase
      .from('game_players')
      .delete()
      .match({ game_id: roomId, user_id: userInfo.userId });
      
    if (deleteError) {
      console.error(`[${socket.id}] DB Error removing player: ${deleteError.message}`);
    }

    const { data: remainingPlayers, error: fetchError } = await supabase
      .from('game_players')
      .select('user_id')
      .eq('game_id', roomId)
      .order('joined_at', { ascending: true });
    
    if (fetchError) {
       console.error(`[${socket.id}] DB Error fetching remaining players: ${fetchError.message}`);
       return;
    }

    if (remainingPlayers.length === 0) {
      console.log(`[${socket.id}] Lobby ${roomId} is empty. Deleting game.`);
      await supabase.from('games').delete().eq('id', roomId);
    } else {
      const { data: game, error: gameFetchError } = await supabase
        .from('games')
        .select('host_id')
        .eq('id', roomId)
        .single();
        
      if (gameFetchError) {
         console.error(`[${socket.id}] DB Error fetching game host: ${gameFetchError.message}`);
         return;
      }

      if (game.host_id === userInfo.userId) {
        const newHost = remainingPlayers[0];
        console.log(`[${socket.id}] Host left lobby ${roomId}. Promoting ${newHost.user_id}.`);
        await supabase
          .from('games')
          .update({ host_id: newHost.user_id })
          .eq('id', roomId);
      }
    }
    
    broadcastLobbyList(io, supabase);

  } catch (error: any) {
    console.error(
      `[${socket.id}] Critical error in handleLobbyDisconnect: ${error.message}`
    );
  }
};