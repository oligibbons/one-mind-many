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
    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (usersError) throw usersError;
    
    // Get active games count
    const { count: activeGames, error: gamesError } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress');
    
    if (gamesError) throw gamesError;
    
    // Get total scenarios count
    const { count: totalScenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select('*', { count: 'exact', head: true });
    
    if (scenariosError) throw scenariosError;
    
    return res.status(200).json({
      totalUsers: totalUsers || 0,
      activeGames: activeGames || 0,
      totalScenarios: totalScenarios || 0
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch admin statistics',
      error: error.message 
    });
  }
});

// Get user list with pagination and filters
router.get('/users', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });
    
    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    if (role) {
      query = query.eq('role', role);
    }
    
    const { data, count, error } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
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

// Update user role
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
    
    if (error) throw error;
    
    return res.status(200).json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ 
      message: 'Failed to update user role',
      error: error.message 
    });
  }
});

// Ban user
router.post('/users/:id/ban', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Update user status
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        status: 'banned',
        banned_reason: reason,
        banned_at: new Date()
      })
      .eq('id', id);
    
    if (updateError) throw updateError;
    
    // Invalidate user's session
    const { error: authError } = await supabase.auth.admin.signOut(id);
    
    if (authError) throw authError;
    
    return res.status(200).json({ message: 'User banned successfully' });
  } catch (error) {
    console.error('Error banning user:', error);
    return res.status(500).json({ 
      message: 'Failed to ban user',
      error: error.message 
    });
  }
});

// Get system logs
router.get('/logs', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, type } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('game_logs')
      .select('*', { count: 'exact' });
    
    if (type) {
      query = query.eq('log_type', type);
    }
    
    const { data, count, error } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return res.status(200).json({
      logs: data,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch system logs',
      error: error.message 
    });
  }
});

export default router;