import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get all lobbies
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('lobbies')
      .select(`
        *,
        host:host_id(id, username),
        scenario:scenario_id(id, title, description)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching lobbies:', error);
    return res.status(500).json({ message: 'An error occurred while fetching lobbies' });
  }
});

// Get lobby by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('lobbies')
      .select(`
        *,
        host:host_id(id, username),
        scenario:scenario_id(id, title, description)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      return res.status(404).json({ message: 'Lobby not found' });
    }
    
    // Get lobby players
    const { data: players, error: playersError } = await supabase
      .from('lobby_players')
      .select(`
        *,
        user:user_id(id, username, avatar_url)
      `)
      .eq('lobby_id', id);
    
    if (playersError) {
      return res.status(500).json({ message: playersError.message });
    }
    
    return res.status(200).json({
      ...data,
      players: players || []
    });
  } catch (error) {
    console.error('Error fetching lobby:', error);
    return res.status(500).json({ message: 'An error occurred while fetching the lobby' });
  }
});

// Create new lobby
router.post('/', async (req, res) => {
  try {
    const { name, scenario_id, max_players, settings } = req.body;
    const host_id = req.user.id;
    
    if (!name) {
      return res.status(400).json({ message: 'Lobby name is required' });
    }
    
    // Create lobby
    const { data, error } = await supabase
      .from('lobbies')
      .insert([{
        name,
        host_id,
        scenario_id,
        max_players: max_players || 8,
        settings: settings || {},
        status: 'waiting'
      }])
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    
    // Add host as first player
    const { error: playerError } = await supabase
      .from('lobby_players')
      .insert([{
        lobby_id: data.id,
        user_id: host_id,
        role: 'host',
        joined_at: new Date()
      }]);
    
    if (playerError) {
      // Rollback lobby creation
      await supabase
        .from('lobbies')
        .delete()
        .eq('id', data.id);
      
      return res.status(500).json({ message: playerError.message });
    }
    
    return res.status(201).json({
      message: 'Lobby created successfully',
      lobby: data
    });
  } catch (error) {
    console.error('Error creating lobby:', error);
    return res.status(500).json({ message: 'An error occurred while creating the lobby' });
  }
});

// Update lobby
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, scenario_id, max_players, settings, status } = req.body;
    const userId = req.user.id;
    
    // Check if user is the host
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .select('host_id')
      .eq('id', id)
      .single();
    
    if (lobbyError) {
      return res.status(404).json({ message: 'Lobby not found' });
    }
    
    if (lobby.host_id !== userId) {
      return res.status(403).json({ message: 'Only the host can update the lobby' });
    }
    
    // Update lobby
    const { data, error } = await supabase
      .from('lobbies')
      .update({
        name,
        scenario_id,
        max_players,
        settings,
        status
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    
    return res.status(200).json({
      message: 'Lobby updated successfully',
      lobby: data
    });
  } catch (error) {
    console.error('Error updating lobby:', error);
    return res.status(500).json({ message: 'An error occurred while updating the lobby' });
  }
});

// Delete lobby
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if user is the host
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .select('host_id')
      .eq('id', id)
      .single();
    
    if (lobbyError) {
      return res.status(404).json({ message: 'Lobby not found' });
    }
    
    if (lobby.host_id !== userId) {
      return res.status(403).json({ message: 'Only the host can delete the lobby' });
    }
    
    // Delete lobby players first (due to foreign key constraints)
    await supabase
      .from('lobby_players')
      .delete()
      .eq('lobby_id', id);
    
    // Delete lobby
    const { error } = await supabase
      .from('lobbies')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    
    return res.status(200).json({
      message: 'Lobby deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lobby:', error);
    return res.status(500).json({ message: 'An error occurred while deleting the lobby' });
  }
});

// Join lobby
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if lobby exists and has space
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .select('*')
      .eq('id', id)
      .single();
    
    if (lobbyError) {
      return res.status(404).json({ message: 'Lobby not found' });
    }
    
    if (lobby.status !== 'waiting') {
      return res.status(400).json({ message: 'Cannot join a lobby that is not waiting for players' });
    }
    
    // Count current players
    const { count, error: countError } = await supabase
      .from('lobby_players')
      .select('*', { count: 'exact' })
      .eq('lobby_id', id);
    
    if (countError) {
      return res.status(500).json({ message: countError.message });
    }
    
    if (count >= lobby.max_players) {
      return res.status(400).json({ message: 'Lobby is full' });
    }
    
    // Check if user is already in the lobby
    const { data: existingPlayer, error: existingError } = await supabase
      .from('lobby_players')
      .select('*')
      .eq('lobby_id', id)
      .eq('user_id', userId)
      .single();
    
    if (existingPlayer) {
      return res.status(400).json({ message: 'You are already in this lobby' });
    }
    
    // Add player to lobby
    const { data, error } = await supabase
      .from('lobby_players')
      .insert([{
        lobby_id: id,
        user_id: userId,
        role: lobby.host_id === userId ? 'host' : 'player',
        joined_at: new Date()
      }])
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    
    return res.status(200).json({
      message: 'Joined lobby successfully',
      player: data
    });
  } catch (error) {
    console.error('Error joining lobby:', error);
    return res.status(500).json({ message: 'An error occurred while joining the lobby' });
  }
});

// Leave lobby
router.post('/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if user is in the lobby
    const { data: player, error: playerError } = await supabase
      .from('lobby_players')
      .select('*')
      .eq('lobby_id', id)
      .eq('user_id', userId)
      .single();
    
    if (playerError) {
      return res.status(400).json({ message: 'You are not in this lobby' });
    }
    
    // Check if user is the host
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .select('host_id')
      .eq('id', id)
      .single();
    
    if (lobbyError) {
      return res.status(404).json({ message: 'Lobby not found' });
    }
    
    // If host is leaving, either transfer host role or delete lobby
    if (lobby.host_id === userId) {
      // Find another player to be the new host
      const { data: newHost, error: newHostError } = await supabase
        .from('lobby_players')
        .select('user_id')
        .eq('lobby_id', id)
        .neq('user_id', userId)
        .limit(1)
        .single();
      
      if (newHostError) {
        // No other players, delete lobby
        await supabase
          .from('lobby_players')
          .delete()
          .eq('lobby_id', id);
        
        await supabase
          .from('lobbies')
          .delete()
          .eq('id', id);
        
        return res.status(200).json({
          message: 'Left lobby and deleted it as you were the last player'
        });
      }
      
      // Transfer host role
      await supabase
        .from('lobbies')
        .update({ host_id: newHost.user_id })
        .eq('id', id);
      
      await supabase
        .from('lobby_players')
        .update({ role: 'host' })
        .eq('lobby_id', id)
        .eq('user_id', newHost.user_id);
    }
    
    // Remove player from lobby
    const { error } = await supabase
      .from('lobby_players')
      .delete()
      .eq('lobby_id', id)
      .eq('user_id', userId);
    
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    
    return res.status(200).json({
      message: 'Left lobby successfully'
    });
  } catch (error) {
    console.error('Error leaving lobby:', error);
    return res.status(500).json({ message: 'An error occurred while leaving the lobby' });
  }
});

export default router;