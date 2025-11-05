// src/pages/game/SettingsPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/'); // Redirect to home page on logout
    } catch (err: any) {
      console.error('Error logging out:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl p-8">
      <Button
        as={Link}
        to="/menu"
        variant="outline"
        className="mb-6"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Menu
      </Button>

      <h1 className="mb-8 text-4xl font-bold text-white">Settings</h1>

      <div className="space-y-6">
        {/* Account Info */}
        <Card className="border-gray-700 bg-gray-800 text-gray-200">
          <CardHeader>
            <CardTitle className="text-orange-400">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">Username</p>
              <p className="text-lg text-gray-100">{profile?.username || '...'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-lg text-gray-100">{user?.email || '...'}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
              disabled={loading}
            >
              <LogOut size={16} className="mr-2" />
              {loading ? 'Logging Out...' : 'Log Out'}
            </Button>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </CardContent>
        </Card>

        {/* Game Settings (Placeholder) */}
        <Card className="border-gray-700 bg-gray-800 text-gray-200 opacity-50">
          <CardHeader>
            <CardTitle className="text-gray-400">Game (Coming Soon)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">
              Audio, video, and accessibility settings will go here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};