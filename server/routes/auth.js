import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { authMiddleware } from '../index.js'; // <-- Import middleware

dotenv.config();

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Use public key for auth routes
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // For admin tasks

if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase URL, Key, or Service Role Key');
}

// Use the public key for client-side auth operations
const supabase = createClient(supabaseUrl, supabaseKey);
// Use the service key for admin-level operations if needed
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);


// GET /api/auth/user
// Gets the user session from a JWT
router.get('/user', authMiddleware, async (req, res) => {
  try {
    // req.user is added by the authMiddleware
    const user = req.user;

    // Fetch the full profile from the 'profiles' table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError.message);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    // Combine auth user data with profile data
    const userSession = {
      ...user,
      profile: {
        username: profile.username,
        avatar_url: profile.avatar_url,
        is_admin: profile.is_admin,
        status: profile.status
      }
    };

    res.status(200).json(userSession);
  } catch (error) {
    console.error('Error in /user route:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username are required' });
  }
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
  }

  try {
    // 1. Check if username is already taken in 'profiles' table
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') { // PGRST116 = 'No rows found'
      throw profileCheckError;
    }

    if (existingProfile) {
      return res.status(409).json({ error: 'Username is already taken' });
    }

    // 2. Create the user in auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username, // This will be added to auth.users.raw_user_meta_data
        }
      }
    });

    if (authError) {
      // Handle "User already registered" specifically
      if (authError.message.includes('User already registered')) {
        return res.status(409).json({ error: 'A user with this email already exists' });
      }
      throw authError;
    }

    if (!authData.user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // 3. The public.profiles table is automatically populated by the trigger
    // We just need to wait a moment and then check
    
    // Return the session and user (email confirmation may be required)
    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: authData.user,
      session: authData.session
    });

  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ error: `Registration failed: ${error.message}` });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut(req.headers.authorization.split(' ')[1]);
    if (error) {
      throw error;
    }
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error.message);
    res.status(500).json({ error: 'Failed to logout' });
  }
});


// --- NEW: UPDATE EMAIL ---
// This route is protected by the authMiddleware
router.post('/update-email', authMiddleware, async (req, res) => {
  const { email } = req.body;
  const token = req.headers.authorization.split(' ')[1];

  if (!email) {
    return res.status(400).json({ error: 'New email is required' });
  }

  try {
    // Supabase handles this by sending a confirmation email.
    // We use the user's own token to make this request.
    const { data, error } = await supabase.auth.updateUser(
      { email },
      { jwt: token }
    );

    if (error) {
      console.error('Email update error:', error.message);
      if (error.message.includes('same as the current')) {
        return res.status(400).json({ error: 'This is already your email address.' });
      }
      if (error.message.includes('already registered')) {
        return res.status(409).json({ error: 'This email is already in use.' });
      }
      return res.status(500).json({ error: 'Failed to update email.' });
    }

    res.status(200).json({ message: 'Confirmation emails sent to both your old and new addresses. Please verify to complete the change.' });
  } catch (error) {
    console.error('Email update error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- NEW: UPDATE PASSWORD ---
// This route is protected by the authMiddleware
router.post('/update-password', authMiddleware, async (req, res) => {
  const { newPassword } = req.body;
  const token = req.headers.authorization.split(' ')[1];

  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required' });
  }

  try {
    // We use the user's own token to make this request.
    const { data, error } = await supabase.auth.updateUser(
      { password: newPassword },
      { jwt: token }
    );

    if (error) {
      console.error('Password update error:', error.message);
      return res.status(500).json({ error: 'Failed to update password.' });
    }

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Password update error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


export default router;