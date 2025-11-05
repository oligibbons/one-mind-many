// server/sockets/gameHandler.ts

import { Server, Socket } from 'socket.io';
import { SupabaseClient } from '@supabase/supabase-js';
import { GameEngine } from '../services/GameEngine.js';
import {
  GameState,
  PrivatePlayerState,
  PublicPlayerState, // <-- NEW
  SubmittedAction,
  BoardSpace,
  Scenario,
  GameResults, // <-- NEW
} from '../../src/types/game.js';

type AdminSupabaseClient = SupabaseClient<any, 'public', any>;
type UserMap = Map<string, { userId: string; username: string }>;
type RoomMap = Map<string, { roomId: string; type: 'lobby' | 'game' }>;

// In-memory store for active game engines/states
const activeGames = new Map<
  string,
  {
    state: GameState;
    privateStates: PrivatePlayerState[];
    publicStates: PublicPlayerState[]; // <-- NEW
    scenario: Scenario;
    submittedActions: Map<string, SubmittedAction>;
  }
>();

export const registerGameHandlers = (
  io: Server,
  socket: Socket,
  supabase: AdminSupabaseClient,
  socketToUser: UserMap,
  socketInRoom: RoomMap,
) => {
  const joinGame = async (payload: { gameId: string; userId: string }) => {
    try {
      const { gameId, userId } = payload;
      console.log(`[${socket.id}] User ${userId} joining game ${gameId}`);
      
      // Update socket-to-room mapping
      socketInRoom.set(socket.id, { roomId: gameId, type: 'game' });
      socket.join(gameId);

      // --- Handle Reconnection ---
      const { error: reconnectError } = await supabase
        .from('game_players')
        .update({ is_disconnected: false })
        .match({ game_id: gameId, user_id: userId });
      if (reconnectError) throw reconnectError;

      // Notify other players
      const userInfo = socketToUser.get(socket.id);
      if (userInfo) {
        socket.to(gameId).emit('game:player_joined', { userId, username: userInfo.username });
      }

      // --- Load Game or Get from Memory ---
      let gameData = activeGames.get(gameId);
      if (!gameData) {
        console.log(`[${socket.id}] Loading game ${gameId} from DB...`);
        const { data: game, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();
        if (gameError) throw new Error(`DB game fetch error: ${gameError.message}`);

        const { data: players, error: playersError } = await supabase
          .from('game_players')
          .select('*')
          .eq('game_id', gameId);
        if (playersError) throw new Error(`DB players fetch error: ${playersError.message}`);

        const { data: scenario, error: scenarioError } = await supabase
          .from('scenarios')
          .select('*')
          .eq('id', game.scenario_id)
          .single();
        if (scenarioError) throw new Error(`DB scenario fetch error: ${scenarioError.message}`);

        // Reconstruct public states from game_players
        const publicStates: PublicPlayerState[] = players.map(p => ({
          id: p.id,
          userId: p.user_id,
          username: p.username,
          vp: p.vp,
          submittedAction: !!p.submitted_action,
          is_disconnected: p.is_disconnected,
        }));
        
        // Update game.players to be in sync
        game.players = publicStates;

        // Reconstruct private states
        const privateStates: PrivatePlayerState[] = players.map(p => ({
          id: p.id,
          userId: p.user_id,
          username: p.username,
          hand: p.hand,
          role: p.role,
          subRole: p.sub_role,
          secretIdentity: p.secret_identity,
          personalGoal: p.personal_goal,
          vp: p.vp,
        }));
        
        gameData = {
          state: game as GameState,
          privateStates: privateStates,
          publicStates: publicStates, // <-- NEW
          scenario: scenario as Scenario,
          submittedActions: new Map(),
        };
        activeGames.set(gameId, gameData);
      }
      
      // --- Send States to Player ---
      const privateState = gameData.privateStates.find(
        (p) => p.userId === userId
      );
      if (!privateState) throw new Error('Player not found in this game.');

      socket.emit('game:full_state', {
        publicState: gameData.state,
        privateState: privateState,
      });

    } catch (error: any) {
      console.error(`[${socket.id}] Error in joinGame: ${error.message}`);
      socket.emit('error:game', { message: `Failed to join game: ${error.message}` });
    }
  };

  const submitAction = async (payload: {
    gameId: string;
    userId: string;
    card: CommandCard;
  }) => {
    try {
      const { gameId, userId, card } = payload;
      const gameData = activeGames.get(gameId);
      if (!gameData) throw new Error('Game not found.');
      if (gameData.state.status !== 'active') throw new Error('Game is not active.');
      if (gameData.submittedActions.has(userId)) throw new Error('Action already submitted.');
      
      const privateState = gameData.privateStates.find(p => p.userId === userId)!;
      const cardInHand = privateState.hand.find(c => c.id === card.id);
      if (!cardInHand) throw new Error('Card not in hand.');
      
      // 1. Remove card from hand
      privateState.hand = privateState.hand.filter(c => c.id !== card.id);

      // 2. Add action to queue
      const priority = gameData.state.priorityTrack.findIndex(p => p.playerId === userId);
      const submittedAction: SubmittedAction = { playerId: userId, card: cardInHand, priority };
      gameData.submittedActions.set(userId, submittedAction);
      
      // 3. Update public player state
      const publicPlayer = gameData.state.players.find(p => p.userId === userId)!;
      publicPlayer.submittedAction = true;
      
      // 4. Update DB
      await supabase
        .from('game_players')
        .update({ submitted_action: submittedAction, hand: privateState.hand })
        .match({ game_id: gameId, user_id: userId });

      // 5. Notify room
      io.to(gameId).emit('game:player_submitted', { userId });
      
      // 6. Check if all (connected) players have submitted
      const allSubmitted = gameData.state.players
        .filter(p => !p.is_disconnected) // <-- Only check connected players
        .every(p => p.submittedAction);
        
      if (allSubmitted) {
        io.to(gameId).emit('game:round_resolving');
        await processRound(gameId);
      }
    } catch (error: any) {
      console.error(`[${socket.id}] Error in submitAction: ${error.message}`);
      socket.emit('error:game', { message: `Action failed: ${error.message}` });
    }
  };
  
  const submitMove = (payload: { gameId: string; position: BoardSpace }) => {
     // This is a synchronous action, handled by the game loop leader (server)
     // The client just emits this, and the leader (processRound) will pick it up
     // For now, we'll just log it
     console.log(`[${socket.id}] Received move for ${payload.gameId}:`, payload.position);
  };

  // --- *** UPDATED: processRound *** ---
  const processRound = async (gameId: string) => {
    const gameData = activeGames.get(gameId);
    if (!gameData) return;

    try {
      let turnState = GameEngine.startRoundResolution(
        gameData.state,
        gameData.privateStates,
        gameData.publicStates, // <-- Pass public states
        Array.from(gameData.submittedActions.values()),
        gameData.scenario
      );
      
      // Clear submitted actions for next round
      gameData.submittedActions.clear();
      
      while (turnState.actionQueue.length > 0) {
        const action = turnState.actionQueue.shift()!;
        
        // 1. Process the action
        const { nextTurnState, pause } = GameEngine.processSingleAction(turnState, action);
        turnState = nextTurnState;
        
        // 2. Send state update
        io.to(gameId).emit('game:state_update', turnState.state);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Pause for effect

        // 3. Handle pause for movement
        if (pause) {
          io.to(gameId).emit('game:await_move', pause);
          
          const move = await new Promise<BoardSpace>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Move timed out')), 20000);
            
            const onMove = (payload: { gameId: string; position: BoardSpace }) => {
              if (payload.gameId === gameId) {
                clearTimeout(timeout);
                socket.off('game:submit_move', onMove); // Clean up listener
                resolve(payload.position);
              }
            };
            socket.on('game:submit_move', onMove);
          });
          
          turnState = GameEngine.processSubmittedMove(turnState, move).nextTurnState;
          io.to(gameId).emit('game:state_update', turnState.state);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // --- 4. Round End ---
      const { nextState, nextPrivateStates, gameResults } = GameEngine.applyEndOfRoundEffects(turnState);
      
      gameData.state = nextState;
      gameData.privateStates = nextPrivateStates;
      
      // 5. Update DB
      await Promise.all([
        supabase
          .from('games')
          .update({
            current_round: gameData.state.currentRound,
            harbinger_position: gameData.state.harbingerPosition,
            stalker_position: gameData.state.stalkerPosition,
            priority_track: gameData.state.priorityTrack,
            active_complications: gameData.state.activeComplications,
            game_log: gameData.state.gameLog,
            status: gameData.state.status, // <-- This might be 'finished'
            players: gameData.state.players,
          })
          .eq('id', gameId),
        ...gameData.privateStates.map(p => 
          supabase
            .from('game_players')
            .update({ 
              vp: p.vp, 
              hand: p.hand, 
              personal_goal: p.personalGoal,
              submitted_action: null, // Clear for next round
            })
            .match({ game_id: gameId, user_id: p.userId })
        )
      ]);
      
      // 6. Send final round update
      io.to(gameId).emit('game:state_update', gameData.state);
      
      // --- 7. HANDLE GAME END ---
      if (gameResults) {
        console.log(`[${gameId}] Game finished! Saving results...`);
        await saveGameResults(gameId, gameData.scenario.id, gameResults);
        
        // Emit results to all players
        io.to(gameId).emit('game:results', gameResults);
        
        // Clean up game from memory
        activeGames.delete(gameId);
        
        // Update room type for all players
        for (const player of gameData.state.players) {
          const playerSocketId = [...socketToUser.entries()].find(
            ([, user])f => user.userId === player.userId
          )?.[0];
          if (playerSocketId) {
            // Set them back to 'lobby' type
            socketInRoom.set(playerSocketId, { roomId: gameId, type: 'lobby' });
          }
        }
      } else {
         // Send private state updates (new hands)
         for (const p of gameData.privateStates) {
            const playerSocketId = [...socketToUser.entries()].find(
              ([, user]) => user.userId === p.userId
            )?.[0];
            if (playerSocketId) {
              io.to(playerSocketId).emit('game:private_update', p);
            }
         }
      }

    } catch (error: any) {
      console.error(`[${gameId}] Error in processRound: ${error.message}`);
      io.to(gameId).emit('error:game', { message: `Round failed: ${error.message}` });
      // TODO: Handle game crash state
    }
  };
  
  // --- NEW: saveGameResults ---
  const saveGameResults = async (
    gameId: string, 
    scenarioId: string, 
    results: GameResults
  ) => {
    try {
      const { summary, leaderboard } = results;
      
      // Format player data for the SQL function
      const playersPayload = leaderboard.map(p => ({
        user_id: p.userId,
        username: p.username,
        role: p.role,
        sub_role: p.subRole,
        total_vp: p.totalVp,
        rank: p.rank,
        secret_identity: p.secretIdentity,
      }));
      
      // Call the Supabase RPC function
      const { error: rpcError } = await supabase.rpc('save_game_results', {
        p_original_game_id: gameId,
        p_scenario_id: scenarioId,
        p_end_condition: summary.endCondition,
        p_winning_role: summary.winningRole,
        p_players: playersPayload,
      });

      if (rpcError) {
        throw new Error(`RPC save_game_results error: ${rpcError.message}`);
      }
      
      console.log(`[${gameId}] Successfully saved game results to DB.`);

    } catch (error: any) {
      console.error(`[${gameId}] CRITICAL: Failed to save game results: ${error.message}`);
      // Don't emit error to client, just log it
    }
  };

  socket.on('game:join', joinGame);
  socket.on('game:submit_action', submitAction);
  socket.on('game:submit_move', submitMove);
};

// --- (handleGameDisconnect is unchanged) ---
export const handleGameDisconnect = async (
  io: Server,
  socket: Socket,
  supabase: AdminSupabaseClient,
  roomId: string,
  userInfo: { userId: string; username: string }
) => {
  try {
    console.log(`[${socket.id}] ${userInfo.username} disconnected from game ${roomId}`);
    
    // Set disconnected flag in DB
    const { error } = await supabase
      .from('game_players')
      .update({ is_disconnected: true })
      .match({ game_id: roomId, user_id: userInfo.userId });

    if (error) {
      console.error(`[${socket.id}] DB Error setting disconnect flag: ${error.message}`);
    }

    // Update in-memory state if game is active
    const gameData = activeGames.get(roomId);
    if (gameData) {
      const publicPlayer = gameData.state.players.find(p => p.userId === userInfo.userId);
      if (publicPlayer) {
        publicPlayer.is_disconnected = true;
      }
      const publicPlayer2 = gameData.publicStates.find(p => p.userId === userInfo.userId);
      if (publicPlayer2) {
          publicPlayer2.is_disconnected = true;
      }
    }
    
    // Notify other players
    io.to(roomId).emit('game:player_left', { userId: userInfo.userId, username: userInfo.username });

  } catch (error: any) {
    console.error(
      `[${socket.id}] Critical error in handleGameDisconnect: ${error.message}`
    );
  }
};