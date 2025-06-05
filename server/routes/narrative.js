import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get narrative log
router.get('/:gameId/log', async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;
    
    // Check if user is in the game
    const { data: player, error: playerError } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .single();
    
    if (playerError) {
      return res.status(403).json({ message: 'Not authorized to view this log' });
    }
    
    // Get log entries
    const { data: logs, error: logsError } = await supabase
      .from('game_logs')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false });
    
    if (logsError) {
      return res.status(500).json({ message: 'Failed to fetch log' });
    }
    
    return res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching log:', error);
    return res.status(500).json({ message: 'Failed to fetch log' });
  }
});

// Add narrative entry
router.post('/:gameId/log', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { content, metadata } = req.body;
    const userId = req.user.id;
    
    // Check if user is in the game
    const { data: player, error: playerError } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .single();
    
    if (playerError) {
      return res.status(403).json({ message: 'Not authorized to add to this log' });
    }
    
    // Add log entry
    const { data: log, error: logError } = await supabase
      .rpc('add_narrative_log', {
        p_game_id: gameId,
        p_content: content,
        p_metadata: metadata
      });
    
    if (logError) {
      return res.status(500).json({ message: 'Failed to add log entry' });
    }
    
    // Notify other players via WebSocket
    req.app.get('io').to(`game:${gameId}`).emit('log:added', {
      log,
      player: userId
    });
    
    return res.status(200).json({ 
      message: 'Log entry added successfully',
      log
    });
  } catch (error) {
    console.error('Error adding log entry:', error);
    return res.status(500).json({ message: 'Failed to add log entry' });
  }
});

export default router;