import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import inkExternalFunctions from '../services/inkExternalFunctions.js';

dotenv.config();

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Start a new game from a lobby
router.post('/start', async (req, res) => {
  try {
    const { lobby_id } = req.body;
    const userId = req.user.id;
    
    if (!lobby_id) {
      return res.status(400).json({ message: 'Lobby ID is required' });
    }
    
    // Check if user is the host
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .select('*')
      .eq('id', lobby_id)
      .single();
    
    if (lobbyError) {
      return res.status(404).json({ message: 'Lobby not found' });
    }
    
    if (lobby.host_id !== userId) {
      return res.status(403).json({ message: 'Only the host can start the game' });
    }
    
    if (lobby.status !== 'waiting') {
      return res.status(400).json({ message: 'Lobby is not in waiting status' });
    }
    
    // Get scenario
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', lobby.scenario_id)
      .single();
    
    if (scenarioError) {
      return res.status(404).json({ message: 'Scenario not found' });
    }
    
    // Get lobby players
    const { data: players, error: playersError } = await supabase
      .from('lobby_players')
      .select('*')
      .eq('lobby_id', lobby_id);
    
    if (playersError) {
      return res.status(500).json({ message: playersError.message });
    }
    
    if (players.length < scenario.min_players) {
      return res.status(400).json({ 
        message: `Not enough players. Minimum ${scenario.min_players} required.` 
      });
    }
    
    // Create game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert([{
        lobby_id,
        scenario_id: scenario.id,
        status: 'in_progress',
        settings: lobby.settings,
        current_turn: 1,
        started_at: new Date()
      }])
      .select()
      .single();
    
    if (gameError) {
      return res.status(500).json({ message: gameError.message });
    }
    
    // Update lobby status
    await supabase
      .from('lobbies')
      .update({ 
        status: 'in_progress',
        started_at: new Date()
      })
      .eq('id', lobby_id);
    
    // Assign roles to players (including saboteur)
    const playerIds = players.map(player => player.user_id);
    const saboteurIndex = Math.floor(Math.random() * playerIds.length);
    
    // Add players to game with roles
    const gamePlayersData = players.map((player, index) => ({
      game_id: game.id,
      user_id: player.user_id,
      role: index === saboteurIndex ? 'saboteur' : 'crewmate',
      is_alive: true
    }));
    
    const { error: gamePlayers } = await supabase
      .from('game_players')
      .insert(gamePlayersData);
    
    if (gamePlayers) {
      return res.status(500).json({ message: gamePlayers.message });
    }
    
    // Initialize game state
    const initialState = {
      turn: 1,
      resources: scenario.content.initial_resources || {},
      environment: scenario.content.initial_environment || {},
      events: [{
        type: 'game_start',
        description: 'The game has begun!',
        timestamp: new Date()
      }]
    };
    
    const { error: stateError } = await supabase
      .from('game_states')
      .insert([{
        game_id: game.id,
        turn: 1,
        state: initialState,
        created_at: new Date()
      }]);
    
    if (stateError) {
      return res.status(500).json({ message: stateError.message });
    }
    
    return res.status(200).json({
      message: 'Game started successfully',
      game: {
        ...game,
        initial_state: initialState
      }
    });
  } catch (error) {
    console.error('Error starting game:', error);
    return res.status(500).json({ message: 'An error occurred while starting the game' });
  }
});

// Get game state
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if game exists
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select(`
        *,
        lobby:lobby_id(*),
        scenario:scenario_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (gameError) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if user is a player in the game
    const { data: player, error: playerError } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', id)
      .eq('user_id', userId)
      .single();
    
    if (playerError) {
      return res.status(403).json({ message: 'You are not a player in this game' });
    }
    
    // Get game state
    const { data: state, error: stateError } = await supabase
      .from('game_states')
      .select('*')
      .eq('game_id', id)
      .order('turn', { ascending: false })
      .limit(1)
      .single();
    
    if (stateError) {
      return res.status(500).json({ message: stateError.message });
    }
    
    // Get all players
    const { data: players, error: playersError } = await supabase
      .from('game_players')
      .select(`
        *,
        user:user_id(id, username, avatar_url)
      `)
      .eq('game_id', id);
    
    if (playersError) {
      return res.status(500).json({ message: playersError.message });
    }
    
    // Get all actions for the current turn
    const { data: actions, error: actionsError } = await supabase
      .from('game_actions')
      .select('*')
      .eq('game_id', id)
      .eq('turn_number', game.current_turn);
    
    if (actionsError) {
      return res.status(500).json({ message: actionsError.message });
    }
    
    // Get narrative logs
    const { data: narrativeLogs, error: logsError } = await supabase
      .from('game_logs')
      .select('*')
      .eq('game_id', id)
      .order('created_at', { ascending: true });
    
    if (logsError) {
      return res.status(500).json({ message: logsError.message });
    }
    
    // Filter information based on player role
    const isHost = game.lobby.host_id === userId;
    const isSaboteur = player.role === 'saboteur';
    
    // Hide saboteur identity from non-saboteurs
    const filteredPlayers = players.map(p => ({
      ...p,
      // Only reveal role if player is saboteur or host
      role: isSaboteur || isHost ? p.role : p.user_id === userId ? p.role : 'unknown'
    }));
    
    return res.status(200).json({
      game,
      current_state: state.state,
      players: filteredPlayers,
      actions,
      your_role: player.role,
      is_host: isHost,
      narrative_log: narrativeLogs || []
    });
  } catch (error) {
    console.error('Error fetching game:', error);
    return res.status(500).json({ message: 'An error occurred while fetching the game' });
  }
});

// Submit an action
router.post('/:id/action', async (req, res) => {
  try {
    const { id } = req.params;
    const { action_type, action_data } = req.body;
    const userId = req.user.id;
    
    if (!action_type || !action_data) {
      return res.status(400).json({ message: 'Action type and data are required' });
    }
    
    // Check if game exists and is in progress
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();
    
    if (gameError) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    if (game.status !== 'in_progress') {
      return res.status(400).json({ message: 'Game is not in progress' });
    }
    
    // Check if user is a player in the game
    const { data: player, error: playerError } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', id)
      .eq('user_id', userId)
      .single();
    
    if (playerError) {
      return res.status(403).json({ message: 'You are not a player in this game' });
    }
    
    if (!player.is_alive) {
      return res.status(400).json({ message: 'Dead players cannot perform actions' });
    }
    
    // Check if player has already submitted an action for this turn
    const { count, error: actionError } = await supabase
      .from('game_actions')
      .select('*', { count: 'exact' })
      .eq('game_id', id)
      .eq('player_id', userId)
      .eq('turn_number', game.current_turn);
    
    if (actionError) {
      return res.status(500).json({ message: actionError.message });
    }
    
    if (count > 0) {
      return res.status(400).json({ message: 'You have already submitted an action for this turn' });
    }
    
    // Record the action
    const { data: action, error: insertError } = await supabase
      .from('game_actions')
      .insert([{
        game_id: id,
        player_id: userId,
        turn_number: game.current_turn,
        action_type,
        action_data,
        status: 'queued',
        created_at: new Date()
      }])
      .select()
      .single();
    
    if (insertError) {
      return res.status(500).json({ message: insertError.message });
    }
    
    // Check if all players have submitted actions for this turn
    const { count: playerCount, error: playerCountError } = await supabase
      .from('game_players')
      .select('*', { count: 'exact' })
      .eq('game_id', id)
      .eq('is_alive', true);
    
    if (playerCountError) {
      return res.status(500).json({ message: playerCountError.message });
    }
    
    const { count: actionCount, error: actionCountError } = await supabase
      .from('game_actions')
      .select('*', { count: 'exact' })
      .eq('game_id', id)
      .eq('turn_number', game.current_turn);
    
    if (actionCountError) {
      return res.status(500).json({ message: actionCountError.message });
    }
    
    // If all players have submitted actions, process the turn
    if (actionCount >= playerCount) {
      // In a real implementation, this would trigger the turn processing logic
      // For now, we'll just increment the turn counter
      await supabase
        .from('games')
        .update({ current_turn: game.current_turn + 1 })
        .eq('id', id);
    }
    
    return res.status(200).json({
      message: 'Action submitted successfully',
      action,
      turn_complete: actionCount >= playerCount
    });
  } catch (error) {
    console.error('Error submitting action:', error);
    return res.status(500).json({ message: 'An error occurred while submitting the action' });
  }
});

// Handle Ink external function calls
router.post('/:id/ink-external-call', async (req, res) => {
  try {
    const { id } = req.params;
    const { functionName, args } = req.body;
    const userId = req.user.id;
    
    // Check if game exists
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();
    
    if (gameError) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if user is a player in the game
    const { data: player, error: playerError } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', id)
      .eq('user_id', userId)
      .single();
    
    if (playerError) {
      return res.status(403).json({ message: 'You are not a player in this game' });
    }
    
    // Check if the function exists
    if (!inkExternalFunctions[functionName]) {
      return res.status(400).json({ message: `Unknown function: ${functionName}` });
    }
    
    // Call the function with the game ID and provided arguments
    const result = await inkExternalFunctions[functionName](id, ...args);
    
    return res.status(200).json({ result });
  } catch (error) {
    console.error(`Error calling Ink external function:`, error);
    return res.status(500).json({ message: 'An error occurred while calling the external function' });
  }
});

// Get Ink story JSON for a game
router.get('/:id/ink-story', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if game exists
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select(`
        *,
        scenario:scenario_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (gameError) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if user is a player in the game
    const { data: player, error: playerError } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', id)
      .eq('user_id', userId)
      .single();
    
    if (playerError) {
      return res.status(403).json({ message: 'You are not a player in this game' });
    }
    
    // Get the Ink story JSON from the scenario
    const inkStoryJSON = game.scenario.content.ink_story_json;
    
    if (!inkStoryJSON) {
      return res.status(404).json({ message: 'Ink story not found for this scenario' });
    }
    
    return res.status(200).json({ inkStoryJSON });
  } catch (error) {
    console.error('Error fetching Ink story:', error);
    return res.status(500).json({ message: 'An error occurred while fetching the Ink story' });
  }
});

// Save Ink story state
router.post('/:id/ink-state', async (req, res) => {
  try {
    const { id } = req.params;
    const { stateJSON } = req.body;
    const userId = req.user.id;
    
    if (!stateJSON) {
      return res.status(400).json({ message: 'State JSON is required' });
    }
    
    // Check if game exists
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();
    
    if (gameError) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if user is a player in the game
    const { data: player, error: playerError } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', id)
      .eq('user_id', userId)
      .single();
    
    if (playerError) {
      return res.status(403).json({ message: 'You are not a player in this game' });
    }
    
    // Save the Ink story state
    const { data, error } = await supabase
      .from('game_ink_states')
      .upsert({
        game_id: id,
        state_json: stateJSON,
        updated_at: new Date()
      })
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    
    return res.status(200).json({
      message: 'Ink state saved successfully',
      state: data
    });
  } catch (error) {
    console.error('Error saving Ink state:', error);
    return res.status(500).json({ message: 'An error occurred while saving the Ink state' });
  }
});

// Load Ink story state
router.get('/:id/ink-state', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if game exists
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();
    
    if (gameError) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if user is a player in the game
    const { data: player, error: playerError } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', id)
      .eq('user_id', userId)
      .single();
    
    if (playerError) {
      return res.status(403).json({ message: 'You are not a player in this game' });
    }
    
    // Get the Ink story state
    const { data, error } = await supabase
      .from('game_ink_states')
      .select('*')
      .eq('game_id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No state found, return empty
        return res.status(200).json({ stateJSON: null });
      }
      return res.status(500).json({ message: error.message });
    }
    
    return res.status(200).json({
      stateJSON: data.state_json
    });
  } catch (error) {
    console.error('Error loading Ink state:', error);
    return res.status(500).json({ message: 'An error occurred while loading the Ink state' });
  }
});

export default router;