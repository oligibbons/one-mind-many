import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Submit action
router.post('/:gameId/action', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { actionType, actionData, targetType, targetId } = req.body;
    const userId = req.user.id;
    
    // Queue the action
    const { data: action, error: actionError } = await supabase
      .rpc('queue_player_action', {
        p_game_id: gameId,
        p_player_id: userId,
        p_action_type: actionType,
        p_action_data: actionData,
        p_target_type: targetType,
        p_target_id: targetId
      });
    
    if (actionError) {
      return res.status(500).json({ message: 'Failed to queue action' });
    }
    
    // Notify other players via WebSocket
    req.app.get('io').to(`game:${gameId}`).emit('action:queued', {
      action,
      player: userId
    });
    
    return res.status(200).json({ 
      message: 'Action queued successfully',
      action
    });
  } catch (error) {
    console.error('Error queueing action:', error);
    return res.status(500).json({ message: 'Failed to queue action' });
  }
});

// Get queued actions
router.get('/:gameId/actions', async (req, res) => {
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
      return res.status(403).json({ message: 'Not authorized to view these actions' });
    }
    
    // Get actions for current turn
    const { data: actions, error: actionsError } = await supabase
      .from('game_actions')
      .select(`
        *,
        player:player_id(id, username)
      `)
      .eq('game_id', gameId)
      .eq('status', 'queued');
    
    if (actionsError) {
      return res.status(500).json({ message: 'Failed to fetch actions' });
    }
    
    return res.status(200).json(actions);
  } catch (error) {
    console.error('Error fetching actions:', error);
    return res.status(500).json({ message: 'Failed to fetch actions' });
  }
});

export default router;