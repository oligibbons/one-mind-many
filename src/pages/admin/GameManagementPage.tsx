// src/pages/admin/GameManagementPage.tsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle } from 'lucide-react';

interface Game {
  id: string;
  status: 'lobby' | 'active' | 'finished';
  created_at: string;
  current_round: number;
}

export const GameManagementPage: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      setError(null);

      // Fetch all games
      const { data, error } = await supabase
        .from('games')
        .select('id, status, created_at, current_round')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching games:', error);
        setError(error.message);
      } else {
        setGames(data as Game[]);
      }
      setLoading(false);
    };

    fetchGames();
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

      <h1 className="mb-8 text-4xl font-bold text-white">Game Management</h1>
      
      <Card className="border-gray-700 bg-gray-800 text-gray-200">
        <CardHeader>
          <CardTitle className="text-orange-400">Recent Games (Last 20)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <LoadingSpinner />}
          {error && <p className="text-red-400">{error}</p>}
          {!loading && !error && (
            <div className="space-y-3">
              {games.length === 0 && <p>No games found.</p>}
              {games.map((game) => (
                <div 
                  key={game.id} 
                  className="flex items-center justify-between rounded-lg bg-gray-700/50 p-3"
                >
                  <div className="flex items-center">
                    {game.status === 'active' && <Play size={18} className="mr-3 text-green-400" />}
                    {game.status === 'lobby' && <CheckCircle size={18} className="mr-3 text-yellow-400" />}
                    {game.status === 'finished' && <CheckCircle size={18} className="mr-3 text-gray-500" />}
                    <div>
                      <p className="font-bold text-gray-100">Game: {game.id.substring(0, 8)}...</p>
                      <p className="text-xs text-gray-400">Status: {game.status}</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" disabled>
                    Inspect (Soon)
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};