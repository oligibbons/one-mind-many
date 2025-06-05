import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { isAdmin } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get all scenarios (public or owned by user)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const isUserAdmin = req.user.role === 'admin';
    
    let query = supabase
      .from('scenarios')
      .select(`
        *,
        creator:creator_id(id, username)
      `)
      .order('created_at', { ascending: false });
    
    // If not admin, only show public scenarios or owned by user
    if (!isUserAdmin) {
      query = query.or(`is_public.eq.true,creator_id.eq.${userId}`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return res.status(500).json({ message: 'An error occurred while fetching scenarios' });
  }
});

// Get scenario by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isUserAdmin = req.user.role === 'admin';
    
    const { data, error } = await supabase
      .from('scenarios')
      .select(`
        *,
        creator:creator_id(id, username)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      return res.status(404).json({ message: 'Scenario not found' });
    }
    
    // Check if user has access to this scenario
    if (!data.is_public && data.creator_id !== userId && !isUserAdmin) {
      return res.status(403).json({ message: 'You do not have access to this scenario' });
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching scenario:', error);
    return res.status(500).json({ message: 'An error occurred while fetching the scenario' });
  }
});

// Create new scenario
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      min_players,
      max_players,
      is_public,
      image_url,
      content
    } = req.body;
    
    const creator_id = req.user.id;
    
    if (!title || !description || !content) {
      return res.status(400).json({ message: 'Title, description, and content are required' });
    }
    
    // Create scenario
    const { data, error } = await supabase
      .from('scenarios')
      .insert([{
        title,
        description,
        difficulty: difficulty || 'medium',
        min_players: min_players || 4,
        max_players: max_players || 8,
        creator_id,
        is_public: is_public !== undefined ? is_public : true,
        image_url,
        content
      }])
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    
    return res.status(201).json({
      message: 'Scenario created successfully',
      scenario: data
    });
  } catch (error) {
    console.error('Error creating scenario:', error);
    return res.status(500).json({ message: 'An error occurred while creating the scenario' });
  }
});

// Update scenario
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      difficulty,
      min_players,
      max_players,
      is_public,
      image_url,
      content
    } = req.body;
    
    const userId = req.user.id;
    const isUserAdmin = req.user.role === 'admin';
    
    // Check if scenario exists and user has permission
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('creator_id')
      .eq('id', id)
      .single();
    
    if (scenarioError) {
      return res.status(404).json({ message: 'Scenario not found' });
    }
    
    if (scenario.creator_id !== userId && !isUserAdmin) {
      return res.status(403).json({ message: 'You do not have permission to update this scenario' });
    }
    
    // Update scenario
    const { data, error } = await supabase
      .from('scenarios')
      .update({
        title,
        description,
        difficulty,
        min_players,
        max_players,
        is_public,
        image_url,
        content,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    
    return res.status(200).json({
      message: 'Scenario updated successfully',
      scenario: data
    });
  } catch (error) {
    console.error('Error updating scenario:', error);
    return res.status(500).json({ message: 'An error occurred while updating the scenario' });
  }
});

// Delete scenario
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isUserAdmin = req.user.role === 'admin';
    
    // Check if scenario exists and user has permission
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('creator_id')
      .eq('id', id)
      .single();
    
    if (scenarioError) {
      return res.status(404).json({ message: 'Scenario not found' });
    }
    
    if (scenario.creator_id !== userId && !isUserAdmin) {
      return res.status(403).json({ message: 'You do not have permission to delete this scenario' });
    }
    
    // Delete scenario
    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    
    return res.status(200).json({
      message: 'Scenario deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return res.status(500).json({ message: 'An error occurred while deleting the scenario' });
  }
});

// Admin endpoints
router.post('/featured/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    
    // Update scenario featured status
    const { data, error } = await supabase
      .from('scenarios')
      .update({ is_featured: featured })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    
    return res.status(200).json({
      message: `Scenario ${featured ? 'featured' : 'unfeatured'} successfully`,
      scenario: data
    });
  } catch (error) {
    console.error('Error updating scenario featured status:', error);
    return res.status(500).json({ message: 'An error occurred while updating the scenario' });
  }
});

export default router;