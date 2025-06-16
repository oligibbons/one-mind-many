import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { isAdmin } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get admin dashboard stats
router.get('/stats', isAdmin, async (req, res) => {
  try {
    console.log('Fetching admin stats...');
    
    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (usersError) {
      console.error('Users error:', usersError);
      throw usersError;
    }
    
    // Get active games count
    const { count: activeGames, error: gamesError } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress');
    
    if (gamesError) {
      console.error('Games error:', gamesError);
      throw gamesError;
    }
    
    // Get total scenarios count
    const { count: totalScenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select('*', { count: 'exact', head: true });
    
    if (scenariosError) {
      console.error('Scenarios error:', scenariosError);
      throw scenariosError;
    }

    // Get active users (logged in within last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { count: activeUsers, error: activeUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_login', yesterday.toISOString());

    if (activeUsersError) {
      console.error('Active users error:', activeUsersError);
      throw activeUsersError;
    }

    // Get new users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: newUsersToday, error: newUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    if (newUsersError) {
      console.error('New users error:', newUsersError);
      throw newUsersError;
    }

    // Get banned users
    const { count: bannedUsers, error: bannedError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'banned');

    if (bannedError) {
      console.error('Banned users error:', bannedError);
      throw bannedError;
    }
    
    const statsData = {
      totalUsers: totalUsers || 0,
      activeGames: activeGames || 0,
      totalScenarios: totalScenarios || 0,
      activeUsers: activeUsers || 0,
      newUsersToday: newUsersToday || 0,
      bannedUsers: bannedUsers || 0
    };

    console.log('Stats fetched successfully:', statsData);
    
    return res.status(200).json(statsData);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch admin statistics',
      error: error.message 
    });
  }
});

// Test game state endpoint for admin testing
router.get('/test-game-state', isAdmin, async (req, res) => {
  try {
    const mockGameState = {
      game: {
        id: 'test-game-123',
        lobby_id: 'test-lobby-123',
        scenario_id: 'test-scenario-123',
        status: 'in_progress',
        current_turn: 3,
        started_at: new Date().toISOString(),
        lobby: {
          id: 'test-lobby-123',
          name: 'Test Prison Break',
          host_id: 'test-user-1'
        },
        scenario: {
          id: 'test-scenario-123',
          title: 'Prison Break Test',
          description: 'A test scenario for admin viewing'
        }
      },
      current_state: {
        turn: 3,
        round: 1,
        phase: 'planning',
        resources: {
          tools: 2,
          keys: 1,
          information: 3
        },
        environment: {
          security_level: 'medium',
          guard_patrol: 'active',
          time_of_day: 'night'
        },
        events: [
          {
            type: 'game_start',
            description: 'The game has begun! You find yourself in a maximum security prison.',
            timestamp: new Date().toISOString()
          },
          {
            type: 'narrative',
            description: 'The lights flicker in the corridor. A guard walks past your cell, keys jangling.',
            timestamp: new Date().toISOString()
          },
          {
            type: 'action',
            description: 'Player moved to the common area.',
            timestamp: new Date().toISOString()
          }
        ]
      },
      players: [
        {
          id: 'test-user-1',
          user_id: 'test-user-1',
          role: 'collaborator',
          is_alive: true,
          user: {
            id: 'test-user-1',
            username: 'TestPlayer1',
            avatar_url: null
          }
        },
        {
          id: 'test-user-2',
          user_id: 'test-user-2',
          role: 'saboteur',
          is_alive: true,
          user: {
            id: 'test-user-2',
            username: 'TestPlayer2',
            avatar_url: null
          }
        },
        {
          id: 'test-user-3',
          user_id: 'test-user-3',
          role: 'rogue',
          is_alive: true,
          user: {
            id: 'test-user-3',
            username: 'TestPlayer3',
            avatar_url: null
          }
        },
        {
          id: 'test-user-4',
          user_id: 'test-user-4',
          role: 'collaborator',
          is_alive: false,
          user: {
            id: 'test-user-4',
            username: 'TestPlayer4',
            avatar_url: null
          }
        }
      ],
      actions: [
        {
          id: 'action-1',
          game_id: 'test-game-123',
          player_id: 'test-user-1',
          action_type: 'move',
          action_data: { target: 'common_area' },
          status: 'completed',
          turn: 2,
          created_at: new Date().toISOString()
        },
        {
          id: 'action-2',
          game_id: 'test-game-123',
          player_id: 'test-user-2',
          action_type: 'search',
          action_data: { target: 'guard_station' },
          status: 'completed',
          turn: 2,
          created_at: new Date().toISOString()
        }
      ],
      your_role: 'collaborator',
      is_host: true,
      narrative_log: [
        {
          id: 'log-1',
          type: 'narrative',
          content: 'The prison is eerily quiet tonight. Emergency lighting casts long shadows down the empty corridors.',
          timestamp: new Date().toISOString(),
          turn_number: 1
        },
        {
          id: 'log-2',
          type: 'action',
          content: 'You hear footsteps echoing from the guard station. Someone is moving around.',
          timestamp: new Date().toISOString(),
          turn_number: 2
        },
        {
          id: 'log-3',
          type: 'narrative',
          content: 'A key card falls from a guard\'s pocket as he rushes past. This could be useful.',
          timestamp: new Date().toISOString(),
          turn_number: 3
        }
      ]
    };

    return res.status(200).json(mockGameState);
  } catch (error) {
    console.error('Error generating test game state:', error);
    return res.status(500).json({ 
      message: 'Failed to generate test game state',
      error: error.message 
    });
  }
});

// Test post-game state endpoint
router.get('/test-postgame-state', isAdmin, async (req, res) => {
  try {
    const mockPostGameState = {
      game: {
        id: 'test-game-123',
        status: 'completed',
        started_at: new Date(Date.now() - 2700000).toISOString(), // 45 minutes ago
        ended_at: new Date().toISOString(),
        scenario: {
          title: 'Prison Break Test',
          difficulty: 'medium'
        }
      },
      results: {
        outcome: 'success',
        winner: 'collaborators',
        duration: 45, // minutes
        turns_completed: 12,
        objectives_completed: 3,
        objectives_total: 4
      },
      players: [
        {
          id: 'test-user-1',
          username: 'TestPlayer1',
          role: 'collaborator',
          is_alive: true,
          points: 150,
          achievements: ['Team Player', 'Objective Complete'],
          actions_taken: 8,
          successful_actions: 6
        },
        {
          id: 'test-user-2',
          username: 'TestPlayer2',
          role: 'saboteur',
          is_alive: true,
          points: 75,
          achievements: ['Chaos Creator'],
          actions_taken: 7,
          successful_actions: 4
        },
        {
          id: 'test-user-3',
          username: 'TestPlayer3',
          role: 'rogue',
          is_alive: true,
          points: 120,
          achievements: ['Lone Wolf', 'Information Gatherer'],
          actions_taken: 9,
          successful_actions: 7
        },
        {
          id: 'test-user-4',
          username: 'TestPlayer4',
          role: 'collaborator',
          is_alive: false,
          points: 50,
          achievements: ['Martyr'],
          actions_taken: 5,
          successful_actions: 3
        }
      ],
      timeline: [
        { turn: 1, event: 'Game started', description: 'Players begin in their cells' },
        { turn: 3, event: 'First key found', description: 'TestPlayer1 discovered a guard key' },
        { turn: 5, event: 'Player eliminated', description: 'TestPlayer4 was caught by guards' },
        { turn: 8, event: 'Security breach', description: 'TestPlayer2 triggered an alarm' },
        { turn: 10, event: 'Major progress', description: 'Access to the main corridor gained' },
        { turn: 12, event: 'Game completed', description: 'Collaborators achieved their objective' }
      ],
      statistics: {
        most_active_player: 'TestPlayer3',
        most_successful_player: 'TestPlayer3',
        total_actions: 29,
        successful_actions: 20,
        sabotage_attempts: 3,
        objectives_failed: 1
      }
    };

    return res.status(200).json(mockPostGameState);
  } catch (error) {
    console.error('Error generating test post-game state:', error);
    return res.status(500).json({ 
      message: 'Failed to generate test post-game state',
      error: error.message 
    });
  }
});

// User management endpoints
router.get('/users', isAdmin, async (req, res) => {
  try {
    console.log('Fetching users...');
    const { page = 1, limit = 10, search, role, status } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });
    
    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data, count, error } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Users query error:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} users`);
    
    return res.status(200).json({
      users: data,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch users',
      error: error.message 
    });
  }
});

router.patch('/users/:id/role', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id);
    
    if (error) {
      console.error('Role update error:', error);
      throw error;
    }
    
    return res.status(200).json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ 
      message: 'Failed to update user role',
      error: error.message 
    });
  }
});

router.patch('/users/:id/status', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['online', 'offline', 'banned'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const { error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', id);
    
    if (error) {
      console.error('Status update error:', error);
      throw error;
    }
    
    return res.status(200).json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ 
      message: 'Failed to update user status',
      error: error.message 
    });
  }
});

router.delete('/users/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete user from auth.users (this will cascade to public.users)
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    
    if (authError) {
      console.error('Auth delete error:', authError);
      throw authError;
    }
    
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ 
      message: 'Failed to delete user',
      error: error.message 
    });
  }
});

// Game management endpoints
router.get('/games', isAdmin, async (req, res) => {
  try {
    console.log('Fetching games...');
    const { page = 1, limit = 10, search, status, difficulty } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('games')
      .select(`
        *,
        scenario:scenario_id(id, title, difficulty),
        players:game_players(
          id,
          user:user_id(id, username),
          role,
          is_alive
        )
      `, { count: 'exact' });
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data, count, error } = await query
      .range(offset, offset + limit - 1)
      .order('started_at', { ascending: false });
    
    if (error) {
      console.error('Games query error:', error);
      throw error;
    }

    // Transform data to match expected format
    const transformedData = data.map(game => ({
      ...game,
      host: game.players?.[0]?.user || { id: '', username: 'Unknown' }
    }));
    
    console.log(`Fetched ${transformedData?.length || 0} games`);
    
    return res.status(200).json({
      games: transformedData,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch games',
      error: error.message 
    });
  }
});

router.get('/games/stats', isAdmin, async (req, res) => {
  try {
    console.log('Fetching game stats...');
    
    // Get total games
    const { count: totalGames, error: totalError } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Total games error:', totalError);
      throw totalError;
    }

    // Get active games
    const { count: activeGames, error: activeError } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    if (activeError) {
      console.error('Active games error:', activeError);
      throw activeError;
    }

    // Get completed games
    const { count: completedGames, error: completedError } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    if (completedError) {
      console.error('Completed games error:', completedError);
      throw completedError;
    }

    // Get average duration (mock for now)
    const averageDuration = 45; // minutes

    // Get total players across all games
    const { count: totalPlayers, error: playersError } = await supabase
      .from('game_players')
      .select('*', { count: 'exact', head: true });

    if (playersError) {
      console.error('Total players error:', playersError);
      throw playersError;
    }

    const gameStats = {
      totalGames: totalGames || 0,
      activeGames: activeGames || 0,
      completedGames: completedGames || 0,
      averageDuration,
      totalPlayers: totalPlayers || 0
    };

    console.log('Game stats fetched successfully:', gameStats);

    return res.status(200).json(gameStats);
  } catch (error) {
    console.error('Error fetching game stats:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch game statistics',
      error: error.message 
    });
  }
});

router.post('/games/:id/end', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('games')
      .update({ 
        status: 'abandoned',
        ended_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('End game error:', error);
      throw error;
    }
    
    return res.status(200).json({ message: 'Game ended successfully' });
  } catch (error) {
    console.error('Error ending game:', error);
    return res.status(500).json({ 
      message: 'Failed to end game',
      error: error.message 
    });
  }
});

router.delete('/games/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Delete game error:', error);
      throw error;
    }
    
    return res.status(200).json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Error deleting game:', error);
    return res.status(500).json({ 
      message: 'Failed to delete game',
      error: error.message 
    });
  }
});

// AI System endpoints
router.post('/ai/create-master', isAdmin, async (req, res) => {
  try {
    const { huggingFaceKey, config } = req.body;
    
    if (!huggingFaceKey) {
      return res.status(400).json({ message: 'Hugging Face API key is required' });
    }

    // Test the API key by making a simple request to Hugging Face
    const testResponse = await fetch(`https://api-inference.huggingface.co/models/${config.baseModel}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${huggingFaceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: 'Test connection',
        parameters: {
          max_new_tokens: 10,
          temperature: 0.7
        }
      })
    });

    if (!testResponse.ok) {
      if (testResponse.status === 401) {
        return res.status(400).json({ message: 'Invalid Hugging Face API key. Please check your token.' });
      } else if (testResponse.status === 403) {
        return res.status(400).json({ message: 'Access denied. Make sure you have access to the Llama model.' });
      } else {
        return res.status(400).json({ message: `Hugging Face API Error: ${testResponse.status}` });
      }
    }
    
    const masterModel = {
      id: 'master-ai-' + Date.now(),
      name: 'Master Narrative AI',
      type: 'narrative',
      status: 'ready',
      config,
      created_at: new Date()
    };
    
    // In a real implementation, this would:
    // 1. Store the API key securely in the database
    // 2. Store model configuration in database
    // 3. Set up the model for use in the application
    
    return res.status(200).json({
      message: 'Master AI model created successfully',
      model: masterModel
    });
  } catch (error) {
    console.error('Error creating master AI:', error);
    return res.status(500).json({ 
      message: 'Failed to create master AI model',
      error: error.message 
    });
  }
});

router.post('/ai/train/:modelId', isAdmin, async (req, res) => {
  try {
    const { modelId } = req.params;
    
    // Mock implementation - replace with actual training logic
    // This would:
    // 1. Gather training data from scenarios
    // 2. Start training process
    // 3. Update model status
    
    return res.status(200).json({
      message: 'Model training started',
      modelId,
      status: 'training'
    });
  } catch (error) {
    console.error('Error training model:', error);
    return res.status(500).json({ 
      message: 'Failed to start model training',
      error: error.message 
    });
  }
});

router.post('/ai/test/:modelId', isAdmin, async (req, res) => {
  try {
    const { modelId } = req.params;
    const { prompt, config } = req.body;
    
    // For testing, we'll use a stored API key or mock response
    // In a real implementation, retrieve the stored API key for this model
    const storedApiKey = process.env.HUGGING_FACE_API_KEY; // You would store this securely per model
    
    if (!storedApiKey) {
      // Return mock response if no API key is available
      const mockOutput = "The facility's emergency lights cast eerie shadows down the empty corridor. You hear a distant sound of metal scraping against concrete...";
      return res.status(200).json({
        message: 'Model test completed (mock response)',
        output: mockOutput
      });
    }

    try {
      // Make actual API call to Hugging Face
      const response = await fetch(`https://api-inference.huggingface.co/models/${config.baseModel || 'meta-llama/Llama-3.1-8B-Instruct'}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${storedApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: config.maxLength || 512,
            temperature: config.temperature || 0.8,
            top_p: config.topP || 0.9,
            repetition_penalty: config.repetitionPenalty || 1.1,
            return_full_text: false
          }
        })
      });

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Model is loading. Please try again in a few moments.');
        } else if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Hugging Face token.');
        } else {
          throw new Error(`API Error: ${response.status}`);
        }
      }

      const result = await response.json();
      
      let output = '';
      if (Array.isArray(result) && result[0]?.generated_text) {
        output = result[0].generated_text;
      } else if (result.error) {
        throw new Error(result.error);
      } else {
        throw new Error('Unexpected response format');
      }

      return res.status(200).json({
        message: 'Model test completed',
        output
      });
    } catch (apiError) {
      // If API call fails, return mock response
      const mockOutput = "The facility's emergency lights cast eerie shadows down the empty corridor. You hear a distant sound of metal scraping against concrete...";
      return res.status(200).json({
        message: 'Model test completed (mock response due to API error)',
        output: mockOutput,
        warning: apiError.message
      });
    }
  } catch (error) {
    console.error('Error testing model:', error);
    return res.status(500).json({ 
      message: 'Failed to test model',
      error: error.message 
    });
  }
});

// Scenario Management endpoints
router.get('/scenarios', isAdmin, async (req, res) => {
  try {
    const { data: scenarios, error } = await supabase
      .from('scenarios')
      .select(`
        *,
        creator:creator_id(id, username)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return res.status(200).json(scenarios);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch scenarios',
      error: error.message 
    });
  }
});

router.post('/scenarios', isAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      min_players,
      max_players,
      is_public,
      is_featured,
      image_url,
      content
    } = req.body;
    
    const { data: scenario, error } = await supabase
      .from('scenarios')
      .insert([{
        title,
        description,
        difficulty: difficulty || 'medium',
        min_players: min_players || 4,
        max_players: max_players || 8,
        creator_id: req.user.id,
        is_public: is_public !== undefined ? is_public : true,
        is_featured: is_featured || false,
        image_url,
        content
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(201).json({
      message: 'Scenario created successfully',
      scenario
    });
  } catch (error) {
    console.error('Error creating scenario:', error);
    return res.status(500).json({ 
      message: 'Failed to create scenario',
      error: error.message 
    });
  }
});

router.put('/scenarios/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      difficulty,
      min_players,
      max_players,
      is_public,
      is_featured,
      image_url,
      content
    } = req.body;
    
    const { data: scenario, error } = await supabase
      .from('scenarios')
      .update({
        title,
        description,
        difficulty,
        min_players,
        max_players,
        is_public,
        is_featured,
        image_url,
        content,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(200).json({
      message: 'Scenario updated successfully',
      scenario
    });
  } catch (error) {
    console.error('Error updating scenario:', error);
    return res.status(500).json({ 
      message: 'Failed to update scenario',
      error: error.message 
    });
  }
});

router.delete('/scenarios/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return res.status(200).json({
      message: 'Scenario deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return res.status(500).json({ 
      message: 'Failed to delete scenario',
      error: error.message 
    });
  }
});

router.post('/scenarios/:id/featured', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    
    const { data: scenario, error } = await supabase
      .from('scenarios')
      .update({ is_featured: featured })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(200).json({
      message: `Scenario ${featured ? 'featured' : 'unfeatured'} successfully`,
      scenario
    });
  } catch (error) {
    console.error('Error updating scenario featured status:', error);
    return res.status(500).json({ 
      message: 'Failed to update scenario',
      error: error.message 
    });
  }
});

// Content Management endpoints
router.get('/content', isAdmin, async (req, res) => {
  try {
    // Mock implementation - replace with actual content storage
    const content = {
      pages: {
        homepage: {
          hero_title: 'One Mind, Many',
          hero_subtitle: 'The ultimate social deduction experience',
          hero_description: 'Navigate through AI-driven scenarios where trust is scarce and survival depends on wit.',
          features: [
            {
              title: 'AI Scenarios',
              description: 'Dynamic stories that adapt to your choices',
              icon: 'Brain'
            }
          ]
        }
      },
      global: {
        site_name: 'One Mind, Many',
        site_description: 'The ultimate social deduction game',
        contact_email: 'contact@onemindmany.com'
      }
    };
    
    return res.status(200).json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch content',
      error: error.message 
    });
  }
});

router.put('/content', isAdmin, async (req, res) => {
  try {
    const content = req.body;
    
    // Mock implementation - replace with actual content storage
    // This would save to database or file system
    
    return res.status(200).json({
      message: 'Content saved successfully'
    });
  } catch (error) {
    console.error('Error saving content:', error);
    return res.status(500).json({ 
      message: 'Failed to save content',
      error: error.message 
    });
  }
});

router.post('/content/publish', isAdmin, async (req, res) => {
  try {
    // Mock implementation - replace with actual publishing logic
    // This would deploy content to production
    
    return res.status(200).json({
      message: 'Content published successfully'
    });
  } catch (error) {
    console.error('Error publishing content:', error);
    return res.status(500).json({ 
      message: 'Failed to publish content',
      error: error.message 
    });
  }
});

router.post('/assets/upload', isAdmin, async (req, res) => {
  try {
    // Mock implementation - replace with actual file upload logic
    // This would handle file uploads to storage service
    
    const mockUrl = `https://example.com/assets/${Date.now()}.jpg`;
    
    return res.status(200).json({
      message: 'Asset uploaded successfully',
      url: mockUrl
    });
  } catch (error) {
    console.error('Error uploading asset:', error);
    return res.status(500).json({ 
      message: 'Failed to upload asset',
      error: error.message 
    });
  }
});

export default router;