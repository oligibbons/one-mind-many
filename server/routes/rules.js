import express from 'express';
import { createClient } from '@supabase/supabase-js';
import RulesEngine from '../services/RulesEngine.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const rulesEngine = new RulesEngine();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get all rules
router.get('/', async (req, res) => {
  try {
    const { category, role, active } = req.query;
    let rules = rulesEngine.getAllRules();
    
    if (category) {
      rules = rules.filter(rule => rule.category === category);
    }
    
    if (role) {
      rules = rulesEngine.getRulesByRole(role);
    }
    
    if (active !== undefined) {
      rules = rules.filter(rule => rule.active === (active === 'true'));
    }
    
    return res.status(200).json(rules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    return res.status(500).json({ message: 'Failed to fetch rules' });
  }
});

// Get specific rule
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rule = rulesEngine.getRule(id);
    
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }
    
    return res.status(200).json(rule);
  } catch (error) {
    console.error('Error fetching rule:', error);
    return res.status(500).json({ message: 'Failed to fetch rule' });
  }
});

// Create new rule
router.post('/', async (req, res) => {
  try {
    const {
      id,
      type,
      name,
      description,
      category,
      parameters,
      roles,
      actions,
      active = true
    } = req.body;
    
    if (!id || !type || !name || !description || !category) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    if (rulesEngine.getRule(id)) {
      return res.status(400).json({ message: 'Rule with this ID already exists' });
    }
    
    const rule = {
      id,
      type,
      name,
      description,
      category,
      parameters: parameters || {},
      roles: roles || [],
      actions: actions || [],
      active,
      validate: () => true // Default validation function
    };
    
    rulesEngine.addRule(rule);
    
    return res.status(201).json({
      message: 'Rule created successfully',
      rule
    });
  } catch (error) {
    console.error('Error creating rule:', error);
    return res.status(500).json({ message: 'Failed to create rule' });
  }
});

// Update rule
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const success = rulesEngine.updateRule(id, updates);
    
    if (!success) {
      return res.status(404).json({ message: 'Rule not found' });
    }
    
    const updatedRule = rulesEngine.getRule(id);
    
    return res.status(200).json({
      message: 'Rule updated successfully',
      rule: updatedRule
    });
  } catch (error) {
    console.error('Error updating rule:', error);
    return res.status(500).json({ message: 'Failed to update rule' });
  }
});

// Delete rule
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = rulesEngine.deleteRule(id);
    
    if (!success) {
      return res.status(404).json({ message: 'Rule not found' });
    }
    
    return res.status(200).json({
      message: 'Rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting rule:', error);
    return res.status(500).json({ message: 'Failed to delete rule' });
  }
});

// Validate action
router.post('/validate', async (req, res) => {
  try {
    const { gameState, playerId, action } = req.body;
    
    if (!gameState || !playerId || !action) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const validation = rulesEngine.validateAction(gameState, playerId, action);
    
    return res.status(200).json(validation);
  } catch (error) {
    console.error('Error validating action:', error);
    return res.status(500).json({ message: 'Failed to validate action' });
  }
});

// Get valid intention tags for action
router.post('/intention-tags', async (req, res) => {
  try {
    const { gameState, playerId, action } = req.body;
    
    if (!gameState || !playerId || !action) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const validTags = rulesEngine.getValidIntentionTags(gameState, playerId, action);
    
    return res.status(200).json(validTags);
  } catch (error) {
    console.error('Error getting intention tags:', error);
    return res.status(500).json({ message: 'Failed to get intention tags' });
  }
});

// Get turn order
router.post('/turn-order', async (req, res) => {
  try {
    const { gameState } = req.body;
    
    if (!gameState) {
      return res.status(400).json({ message: 'Game state required' });
    }
    
    const turnOrder = rulesEngine.calculateTurnOrder(gameState);
    
    return res.status(200).json(turnOrder);
  } catch (error) {
    console.error('Error calculating turn order:', error);
    return res.status(500).json({ message: 'Failed to calculate turn order' });
  }
});

// Validate game state
router.post('/validate-state', async (req, res) => {
  try {
    const { gameState } = req.body;
    
    if (!gameState) {
      return res.status(400).json({ message: 'Game state required' });
    }
    
    const validation = rulesEngine.validateGameState(gameState);
    
    return res.status(200).json(validation);
  } catch (error) {
    console.error('Error validating game state:', error);
    return res.status(500).json({ message: 'Failed to validate game state' });
  }
});

export default router;