// src/pages/game/SettingsPage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { User, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth(); // Use auth context

  // Profile Settings
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Account Settings: Email
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  // Account Settings: Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user?.profile) {
      setUsername(user.profile.username);
      setAvatarUrl(user.profile.avatar_url || '');
    }
    if (user) {
      setNewEmail(user.email);
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      // Calls PATCH /api/profile
      const response = await api.patch('/profile', {
        username: username,
        avatar_url: avatarUrl || null,
      });
      
      // Update the user in the auth context with the new profile data
      updateUser(response.data); 
      setProfileSuccess('Profile updated successfully!');
    } catch (err: any) {
      setProfileError(err.response?.data?.error || 'Failed to update profile.');
    }
    setProfileLoading(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail === user?.email) {
      setEmailError('This is already your email address.');
      return;
    }
    setEmailLoading(true);
    setEmailError(null);
    setEmailSuccess(null);

    try {
      // Calls POST /api/auth/update-email
      const response = await api.post('/auth/update-email', { email: newEmail });
      setEmailSuccess(response.data.message);
    } catch (err: any) {
      setEmailError(err.response?.data?.error || 'Failed to update email.');
    }
    setEmailLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPassError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters long.');
      return;
    }

    setPassLoading(true);
    setPassError(null);
    setPassSuccess(null);

    try {
      // Calls POST /api/auth/update-password
      const response = await api.post('/auth/update-password', { newPassword });
      setPassSuccess(response.data.message);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.response?.data?.error || 'Failed to update password.');
    }
    setPassLoading(false);
  };

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-8">
      <h1 className="mb-8 text-5xl font-bold game-title">Settings</h1>
      
      {/* --- Profile Settings Card --- */}
      <Card className="game-card mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-brand-orange">
            <User /> Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 text-lg"
                disabled={profileLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Avatar URL</label>
              <Input
                type="text"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="mt-1 text-lg"
                disabled={profileLoading}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button type="submit" className="game-button" disabled={profileLoading}>
                {profileLoading ? <LoadingSpinner /> : 'Save Profile'}
              </Button>
              {profileSuccess && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  {profileSuccess}
                </div>
              )}
              {profileError && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  {profileError}
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* --- Account Settings Card (NEW) --- */}
      <Card className="game-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-brand-orange">
            <Lock /> Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* Change Email Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Change Email</h3>
            <div>
              <label className="text-sm font-medium text-gray-300">Current Email</label>
              <Input
                type="email"
                value={user.email}
                disabled
                className="mt-1 text-lg bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">New Email</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="mt-1 text-lg"
                disabled={emailLoading}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button type="submit" className="game-button btn-secondary" disabled={emailLoading}>
                {emailLoading ? <LoadingSpinner /> : 'Update Email'}
              </Button>
              {emailSuccess && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  Success!
                </div>
              )}
              {emailError && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  {emailError}
                </div>
              )}
            </div>
             {emailSuccess && (
                <p className="text-sm text-green-300">{emailSuccess}</p>
             )}
          </form>
          
          <hr className="border-gray-700" />

          {/* Change Password Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Change Password</h3>
            <div>
              <label className="text-sm font-medium text-gray-300">New Password</label>
              <Input
                type="password"
                placeholder="Must be at least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 text-lg"
                disabled={passLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Confirm New Password</label>
              <Input
                type="password"
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 text-lg"
                disabled={passLoading}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button type="submit" className="game-button btn-secondary" disabled={passLoading}>
                {passLoading ? <LoadingSpinner /> : 'Update Password'}
              </Button>
              {passSuccess && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  {passSuccess}
                </div>
              )}
              {passError && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  {passError}
                </div>
              )}
            </div>
          </form>

        </CardContent>
      </Card>
    </div>
  );
};