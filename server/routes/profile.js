// server/routes/profile.js

import express from 'express';

// Helper function to get Supabase client from app locals
const getSupabase = (req) => req.app.locals.supabase;

const router = express.Router();

// --- 1. GET Profile Stats ---
// (Unchanged from last batch)
router.get('/:userId/stats', async (req, res) => {
  const supabase = getSupabase(req);
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, created_at, avatar_url, status, total_vp, total_wins, total_games_played')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Profile not found' });

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 2. GET Profile Game History ---
// (Unchanged from last batch)
router.get('/:userId/history', async (req, res) => {
  const supabase = getSupabase(req);
  const { userId } = req.params;

  try {
    const { data: playerHistory, error: playerError } = await supabase
      .from('game_history_players')
      .select('game_history_id, role, sub_role, total_vp, rank')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (playerError) throw playerError;
    if (!playerHistory || playerHistory.length === 0) {
      return res.status(200).json([]);
    }

    const gameIds = playerHistory.map(h => h.game_history_id);
    
    const { data: gameHistory, error: gameError } = await supabase
      .from('game_history')
      .select(`
        id,
        completed_at,
        end_condition,
        winning_role,
        scenarios ( name ),
        game_history_players ( username, role, rank )
      `)
      .in('id', gameIds);

    if (gameError) throw gameError;

    const combinedHistory = playerHistory.map(playerGame => {
      const game = gameHistory.find(g => g.id === playerGame.game_history_id);
      return {
        ...game,
        myStats: {
          role: playerGame.role,
          sub_role: playerGame.sub_role,
          total_vp: playerGame.total_vp,
          rank: playerGame.rank
        }
      };
    });

    res.status(200).json(combinedHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 3. NEW: PATCH Profile Settings ---
// Allows a user to update their own profile
router.patch('/', async (req, res) => {
  const supabase = getSupabase(req);
  const { user } } = req; // The authenticated user
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  
  const { username, avatar_url } = req.body;
  
  // Basic validation
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        username: username,
        avatar_url: avatar_url || null // Allow setting avatar to null
      })
      .eq('id', user.id) // RLS policy also enforces this, but good to be explicit
      .select()
      .single();

    if (error) {
      // Handle unique username constraint
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Username is already taken' });
      }
      throw error;
    }
    
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default router;