// src/pages/auth/RegisterPage.tsx
// (Complete file with the email redirect fix)

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Get the base URL (e.g., "http://localhost:5173")
    const redirectTo = `${window.location.origin}/main-menu`;

    try {
      // --- Step 1: Sign up and pass username AND emailRedirectTo ---
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username, // For your 'handle_new_user' trigger
          },
          // --- THIS IS THE FIX ---
          // This tells Supabase where to send the user
          // after they click the confirmation link in their email.
          emailRedirectTo: redirectTo,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Registration successful but no user data returned.');

      // --- Step 2: (REMOVED!) ---
      // The database trigger 'handle_new_user' is doing this work.
      
      alert('Registration successful! Please check your email to verify your account.');
      navigate('/login');

    } catch (error: any) {
      console.error('Registration error:', error.message);
      
      if (error.message.includes('duplicate key') || error.message.includes('profiles_username_key')) {
        setError('This username is already taken. Please choose another.');
      } else if (error.message.includes('User already registered')) {
         setError('An account with this email already exists.');
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm border-gray-700 bg-gray-800 text-gray-200">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-orange-400">
            Create Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="mb-1 block text-sm font-medium text-gray-300"
              >
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-gray-600 bg-gray-700 text-white"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-300"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-gray-600 bg-gray-700 text-white"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-300"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-600 bg-gray-700 text-white"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </Button>
            </div>
          </form>
          <p className="mt-4 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-orange-400 hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};