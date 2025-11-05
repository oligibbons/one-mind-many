// src/pages/game/FriendsPage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { Profile } from '../../types/game';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { UserPlus, UserMinus, Search, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

type FriendStatus = 'friends' | 'pending_to' | 'pending_from' | 'none';

interface FriendProfile extends Profile {
  status: FriendStatus;
}

export const FriendsPage: React.FC = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Implement friend fetching logic
  useEffect(() => {
    const fetchFriends = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      // This logic is complex and needs to query the 'friends' junction table
      // For now, we'll just set loading to false.
      setLoading(false);
    };
    fetchFriends();
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || searchQuery.trim().length < 3) {
      setError('Search query must be at least 3 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Search for profiles
      const { data: profiles, error: searchError } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${searchQuery}%`)
        .not('id', 'eq', user.id) // Don't find yourself
        .limit(10);

      if (searchError) throw searchError;

      // TODO: Check friendship status for each result
      const resultsWithStatus: FriendProfile[] = profiles.map((p) => ({
        ...p,
        created_at: '', // Not needed for this view
        status: 'none', // Placeholder
      }));

      setSearchResults(resultsWithStatus);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-4xl p-8 text-white">
      <h1 className="mb-6 text-4xl font-bold">Friends</h1>

      {/* Search Bar */}
      <Card className="mb-8 border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle>Find Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex space-x-2">
            <Input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              <Search size={16} className="mr-2" />
              Search
            </Button>
          </form>
          {error && (
            <p className="mt-2 text-red-400 flex items-center">
              <AlertCircle size={14} className="mr-1" /> {error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card className="mb-8 border-gray-700 bg-gray-800">
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: Map over search results */}
          </CardContent>
        </Card>
      )}

      {/* Friends List */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle>Your Friends</CardTitle>
        </CardHeader>
        {/* --- FIX IS HERE --- */}
        <CardContent>
          {loading && <LoadingSpinner />}
          {!loading && friends.length === 0 && (
            <p className="text-gray-400">You haven't added any friends yet.</p>
          )}
          {!loading && (
            <div className="space-y-4">
              {/* TODO: Map over 'friends' array here */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};