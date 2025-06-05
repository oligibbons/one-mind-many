import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Validate required environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }
    
    // Check if username exists
    const { data: existingUsername, error: usernameError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();
    
    if (usernameError && usernameError.code !== 'PGRST116') {
      return res.status(500).json({ message: 'Error checking username availability' });
    }
    
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Register with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) {
      return res.status(400).json({ message: authError.message });
    }
    
    if (!authData?.user?.id) {
      return res.status(500).json({ message: 'Failed to create user account' });
    }
    
    // Create user profile in users table
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        { 
          id: authData.user.id, 
          username, 
          email,
          role: 'user',
        }
      ]);
    
    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ message: 'Failed to create user profile' });
    }
    
    return res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        username,
        email,
        role: 'user',
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      message: 'An error occurred during registration',
      error: error.message 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return res.status(401).json({ message: error.message });
    }
    
    // Get user data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (userError) {
      return res.status(500).json({ message: userError.message });
    }
    
    // Update last login timestamp
    await supabase
      .from('users')
      .update({ last_login: new Date() })
      .eq('id', data.user.id);
    
    return res.status(200).json({
      message: 'Login successful',
      token: data.session.access_token,
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      message: 'An error occurred during login',
      error: error.message 
    });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }
    
    // Verify JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Get user data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      return res.status(500).json({ message: userError.message });
    }
    
    return res.status(200).json({
      message: 'Token is valid',
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ 
      message: 'An error occurred during token verification',
      error: error.message 
    });
  }
});

export default router;