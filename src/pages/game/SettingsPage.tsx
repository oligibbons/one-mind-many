// src/pages/game/SettingsPage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Switch';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { AlertCircle, Check, User } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const { profile, refreshProfile } = useAuth(); // <-- NEW: Get refreshProfile
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data } = await api.patch('/profile', {
        username,
        avatar_url: avatarUrl || null,
      });
      
      // Update was successful
      setSuccess('Profile updated successfully!');
      if (refreshProfile) {
        refreshProfile(); // <-- Refresh the profile in AuthContext
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    }
    setIsLoading(false);
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!profile) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-8">
      <h1 className="mb-6 text-5xl font-bold game-title">Settings</h1>
      
      <Card className="game-card">
        <form onSubmit={handleSave}>
          <CardHeader>
            <CardTitle className="text-2xl text-orange-400">Your Profile</CardTitle>
            <CardDescription className="text-gray-300">
              Update your public username and avatar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full" />
              ) : (
                <User className="h-20 w-20 rounded-full bg-brand-navy p-4 text-gray-400" />
              )}
              <div className="flex-1 space-y-2">
                <Label htmlFor="avatar-url">Avatar URL</Label>
                <Input
                  id="avatar-url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://.../my-image.png"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                minLength={3}
              />
              <p className="text-sm text-gray-400">
                Must be 3-20 characters. This is how other players see you.
              </p>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-green-400">
                <Check className="h-5 w-5" />
                <p>{success}</p>
              </div>
            )}
            
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" className="game-button" disabled={isLoading}>
              {isLoading ? <LoadingSpinner /> : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card className="game-card mt-8">
        <CardHeader>
          <CardTitle className="text-2xl text-orange-400">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="btn-outline border-red-500/50 text-red-400 hover:bg-red-900/30 hover:border-red-500 hover:text-red-300"
            onClick={handleLogout}
          >
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};