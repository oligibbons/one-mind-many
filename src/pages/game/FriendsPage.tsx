// src/pages/game/FriendsPage.tsx

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { UserPlus, Users, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Profile } from '../../types/game';

export const FriendsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Implement friend list fetching
  const [friends, setFriends] = useState<any[]>([]); 

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length < 3) {
      setError('Search term must be at least 3 characters.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${searchTerm.trim()}%`) // Case-insensitive search
        .neq('id', user!.id) // Don't show ourselves
        .limit(10);

      if (error) throw error;
      setSearchResults(data as Profile[]);
    } catch (err: any) {
      console.error('Error searching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // TODO: Implement this
  const handleAddFriend = (friendId: string) => {
    console.log(`TODO: Add friend logic for ${friendId}`);
    // This will require a new 'friendships' table in Supabase
    // and RLS policies for managing requests.
    alert('Friend request logic not yet implemented.');
  };

  return (
    <div className="mx-auto w-full max-w-4xl p-8">
      <Button
        as={Link}
        to="/menu"
        variant="outline"
        className="mb-6"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Menu
      </Button>
      
      <h1 className="mb-8 text-4xl font-bold text-white">Friends</h1>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Friend List */}
        <Card className="border-gray-700 bg-gray-800 text-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-400">
              <Users size={20} className="mr-2" />
              Your Friends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {friends.length === 0 ? (
              <p className="text-gray-400">You haven't added any friends yet.</p>
            ) : (
              <p>Friend list not implemented.</p>
              // TODO: Map over 'friends' array here
            )}
          </DardContent>
        </Card>

        {/* Add Friend */}
        <Card className="border-gray-700 bg-gray-800 text-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-400">
              <UserPlus size={20} className="mr-2" />
              Add Friend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex space-x-2">
              <Input
                type="text"
                placeholder="Search by username..."
                className="border-gray-600 bg-gray-700 text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button type="submit" disabled={loading}>
                {loading ? <LoadingSpinner size={16} /> : 'Search'}
              </Button>
            </form>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            <div className="mt-4 space-y-2">
              {searchResults.map((profile) => (
                <div 
                  key={profile.id}
                  className="flex items-center justify-between rounded bg-gray-700/50 p-2"
                >
                  <p>{profile.username}</p>
                  <Button size="sm" onClick={() => handleAddFriend(profile.id)}>
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};