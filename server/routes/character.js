import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get character details
router.get('/:gameId/character', async (req, res) => {
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
      return res.status(403).json({ message: 'Not authorized to view this character' });
    }
    
    // Get character data
    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select(`
        *,
        inventory:character_inventory(*)
      `)
      .eq('game_id', gameId)
      .single();
    
    if (characterError) {
      return res.status(404).json({ message: 'Character not found' });
    }
    
    return res.status(200).json(character);
  } catch (error) {
    console.error('Error fetching character:', error);
    return res.status(500).json({ message: 'Failed to fetch character data' });
  }
});

// Update character state
router.patch('/:gameId/character', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { location, status } = req.body;
    const userId = req.user.id;
    
    // Check if user is in the game
    const { data: player, error: playerError } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .single();
    
    if (playerError) {
      return res.status(403).json({ message: 'Not authorized to update this character' });
    }
    
    // Update character
    const { data: character, error: updateError } = await supabase
      .rpc('update_character_location', {
        p_character_id: gameId,
        p_new_location: location
      });
    
    if (updateError) {
      return res.status(500).json({ message: 'Failed to update character' });
    }
    
    return res.status(200).json({ message: 'Character updated successfully' });
  } catch (error) {
    console.error('Error updating character:', error);
    return res.status(500).json({ message: 'Failed to update character' });
  }
});

export default router;