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
      totalScenarios: totalScenarios || 0,
      totalAssets: 89 // Mock data for now
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch admin statistics',
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

// User management endpoints
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

export default router;