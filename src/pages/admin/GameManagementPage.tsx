// src/pages/admin/GameManagementPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { AlertCircle, Trash2, StopCircle, ChevronLeft, ChevronRight, Users, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Label } from '../../components/ui/Switch';
import { useAuth } from '../../hooks/useAuth';

// This type matches the 'transformedData' from your /admin/games endpoint
interface Game {
  id: string;
  status: 'lobby' | 'active' | 'finished' | 'abandoned';
  created_at: string;
  scenario: {
    id: string;
    name: string; // Your API returns 'name', not 'title'
  };
  players: {
    user_id: string;
    username: string;
    role: string;
  }[];
}

interface GameData {
  games: Game[];
  total: number;
  page: number;
  totalPages: number;
}

export const GameManagementPage: React.FC = () => {
  const { profile } = useAuth(); // To check if admin
  const [data, setData] = useState<GameData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');

  const fetchGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status,
      });
      const response = await api.get(`/admin/games?${params.toString()}`);
      
      // Fix for API mock data vs. real data
      // Your API mock sends 'scenario.title', but schema has 'scenario.name'
      const fixedData = response.data.games.map((game: any) => ({
        ...game,
        scenario: game.scenario || { id: 'unknown', name: 'Unknown' },
        players: game.players || [],
      }));
      
      setData({ ...response.data, games: fixedData });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load games.');
    }
    setIsLoading(false);
  }, [page, status]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Calls POST /admin/games/:id/end
  const handleEndGame = async (gameId: string) => {
    if (window.confirm('Are you sure you want to force-end this game? Its status will be set to abandoned/finished.')) {
      try {
        await api.post(`/admin/games/${gameId}/end`);
        fetchGames();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to end game.');
      }
    }
  };

  // Calls DELETE /admin/games/:id
  const handleDeleteGame = async (gameId: string) => {
    if (window.confirm('Are you sure you want to PERMANENTLY delete this game and all player data? This is irreversible.')) {
      try {
        await api.delete(`/admin/games/${gameId}`);
        fetchGames();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete game.');
      }
    }
  };
  
  // Only admins should see this page, but as a fallback:
  if (!profile?.is_admin) {
    return <p className="p-8 text-red-400">You do not have permission to view this page.</p>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-8">
      <h1 className="mb-6 text-5xl font-bold game-title">Game Management</h1>

      {/* Filter Bar */}
      <Card className="game-card mb-6">
        <CardContent className="p-4">
          <div className="w-full md:w-56">
            <Label htmlFor="status-filter">Status</Label>
            <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="Filter by status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="lobby">Lobby</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="finished">Finished</SelectItem>
                <SelectItem value="abandoned">Abandoned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-red-700 bg-red-900/30 p-3 text-red-300">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card className="game-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-brand-navy/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Game / Scenario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Players</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-6 text-center text-gray-400"><LoadingSpinner /></td></tr>
                ) : !data || data.games.length === 0 ? (
                  <tr><td colSpan={4} className="p-6 text-center text-gray-400">No games found.</td></tr>
                ) : (
                  data.games.map((game) => (
                    <tr key={game.id} className="hover:bg-brand-navy/20">
                      <td className="px-6 py-4">
                        <div className="font-medium text-brand-cream">{game.id}</div>
                        <div className="text-sm text-gray-400 flex items-center gap-1.5">
                          <Shield className="h-3 w-3" /> {game.scenario.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "rounded-full px-3 py-1 text-sm font-medium",
                          game.status === 'active' && "bg-green-900/50 text-green-300",
                          game.status === 'lobby' && "bg-blue-900/50 text-blue-300",
                          game.status === 'finished' && "bg-gray-700 text-gray-300",
                          game.status === 'abandoned' && "bg-red-900/50 text-red-400",
                        )}>
                          {game.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-300">
                          <Users className="h-4 w-4 mr-1.5" />
                          {game.players.length} Players
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        {game.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEndGame(game.id)}
                            title="Force End Game"
                            className="text-yellow-400 hover:bg-yellow-900/50 hover:text-yellow-300"
                          >
                            <StopCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGame(game.id)}
                          title="Delete Game"
                          className="text-red-400 hover:bg-red-900/50 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            className="btn-secondary"
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-gray-400">
            Page {data.page} of {data.totalPages}
          </span>
          <Button
            className="btn-secondary"
            onClick={() => setPage(p => p + 1)}
            disabled={page === data.totalPages}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};