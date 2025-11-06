// src/pages/game/ProfilePage.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { AlertCircle, User, BarChart2, Shield, Target, Award, Hash, Star } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns'; // npm install date-fns

// Types for profile data
interface ProfileStats {
  id: string;
  username: string;
  created_at: string;
  avatar_url: string | null;
  status: string;
  total_vp: number;
  total_wins: number;
  total_games_played: number;
}
interface GameHistory {
  id: string;
  completed_at: string;
  end_condition: string;
  winning_role: string;
  scenarios: { name: string } | null;
  game_history_players: { username: string; role: string; rank: number }[];
  myStats: {
    role: string;
    sub_role: string;
    total_vp: number;
    rank: number;
  };
}

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError('No user ID provided.');
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [statsRes, historyRes] = await Promise.all([
          api.get(`/profile/${userId}/stats`),
          api.get(`/profile/${userId}/history`),
        ]);
        setStats(statsRes.data);
        setHistory(historyRes.data);
      } catch (err: any) {
        console.error('Error fetching profile data:', err);
        setError(err.response?.data?.message || 'Failed to load profile.');
      }
      setIsLoading(false);
    };

    fetchData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-4xl p-8 text-center text-red-400">
        <AlertCircle className="h-12 w-12 mx-auto" />
        <h2 className="mt-4 text-2xl font-bold">Error Loading Profile</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!stats) {
    return <p className="text-center text-gray-400 p-8">Profile not found.</p>;
  }

  const winRate = stats.total_games_played > 0 
    ? ((stats.total_wins / stats.total_games_played) * 100).toFixed(0) 
    : 0;
  
  const avgVp = stats.total_games_played > 0
    ? (stats.total_vp / stats.total_games_played).toFixed(0)
    : 0;

  return (
    <div className="mx-auto w-full max-w-5xl p-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
        {stats.avatar_url ? (
          <img src={stats.avatar_url} alt={stats.username} className="h-32 w-32 rounded-full border-4 border-brand-orange" />
        ) : (
          <User className="h-32 w-32 rounded-full bg-brand-navy p-6 text-gray-400 border-4 border-brand-orange" />
        )}
        <div>
          <h1 className="text-5xl font-bold game-title">{stats.username}</h1>
          <p className="text-lg text-gray-400">
            Member since {format(new Date(stats.created_at), 'MMMM yyyy')}
          </p>
          <p className={clsx(
            "text-lg font-semibold",
            stats.status === 'Online' ? 'text-green-400' : 'text-gray-500'
          )}>
            {stats.status}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={BarChart2} label="Total Games" value={stats.total_games_played} />
        <StatCard icon={Award} label="Total Wins" value={stats.total_wins} />
        <StatCard icon={Star} label="Total VP" value={stats.total_vp} />
        <StatCard icon={Hash} label="Win Rate" value={`${winRate}%`} />
        <StatCard icon={Star} label="Avg. VP / Game" value={avgVp} />
      </div>

      {/* Match History */}
      <h2 className="text-3xl font-bold text-white mb-4">Match History</h2>
      <Card className="game-card">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-700">
            {history.length === 0 ? (
              <p className="p-6 text-gray-400">No matches played yet.</p>
            ) : (
              history.map(game => (
                <GameHistoryRow key={game.id} game={game} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Stat Card Component ---
const StatCard: React.FC<{ icon: React.ElementType; label: string; value: string | number }> = ({ icon: Icon, label, value }) => (
  <Card className="game-card p-4">
    <div className="flex items-center gap-4">
      <Icon className="h-10 w-10 text-brand-orange" />
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </div>
  </Card>
);

// --- Game History Row Component ---
const GameHistoryRow: React.FC<{ game: GameHistory }> = ({ game }) => {
  const playerRank = game.myStats.rank;
  const totalPlayers = game.game_history_players.length;
  const isWin = playerRank === 1;

  return (
    <div className={clsx(
      "p-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-center",
      isWin ? "bg-green-900/10" : "bg-red-900/5"
    )}>
      <div className="md:col-span-2">
        <p className="text-xl font-semibold text-brand-cream">{game.scenarios?.name || 'Unknown Scenario'}</p>
        <p className="text-sm text-gray-400">{format(new Date(game.completed_at), 'dd MMM yyyy, h:mm a')}</p>
      </div>
      <div>
        <p className="text-sm text-gray-400">Outcome</p>
        <p className={clsx("text-lg font-bold", isWin ? "text-green-400" : "text-red-400")}>
          Rank {playerRank} / {totalPlayers}
        </p>
      </div>
      <div>
        <p className="text-sm text-gray-400">Role</p>
        <p className="text-lg font-semibold text-white">{game.myStats.role}</p>
      </div>
      <div>
        <p className="text-sm text-gray-400">VP Scored</p>
        <p className="text-lg font-bold text-brand-orange">{game.myStats.total_vp}</p>
      </div>
    </div>
  );
};

export default ProfilePage;