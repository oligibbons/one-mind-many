// src/pages/admin/UserManagementPage.tsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Profile } from '../../types/game';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      // Admin tasks like fetching all users should be done with
      // the service_role key. For this client-side page,
      // we'll rely on RLS policies.
      // Ensure your 'profiles' table RLS allows admins to read all.
      
      // Let's create a temporary admin-all-read policy for 'profiles'
      // in the Supabase SQL editor:
      // CREATE POLICY "Allow admins to read all profiles"
      // ON public.profiles FOR SELECT
      // USING ( (SELECT auth.role()) = 'service_role' OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = TRUE );
      // (This requires an 'is_admin' column on your profiles table)

      // For now, we'll just fetch based on your existing "public read" policy.
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error('Error fetching users:', error);
        setError(error.message);
      } else {
        setUsers(data as Profile[]);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl p-8">
      <Button
        as={Link}
        to="/admin"
        variant="outline"
        className="mb-6"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Admin
      </Button>

      <h1 className="mb-8 text-4xl font-bold text-white">User Management</h1>
      
      <Card className="border-gray-700 bg-gray-800 text-gray-200">
        <CardHeader>
          <CardTitle className="text-orange-400">All Registered Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <LoadingSpinner />}
          {error && <p className="text-red-400">{error}</p>}
          {!loading && !error && (
            <div className="space-y-3">
              {users.length === 0 && <p>No users found.</p>}
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between rounded-lg bg-gray-700/50 p-3"
                >
                  <div>
                    <p className="font-bold text-gray-100">{user.username}</p>
                    <p className="text-xs text-gray-400">ID: {user.id}</p>
                  </div>
                  <p className="text-sm text-gray-400">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};