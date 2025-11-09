// src/pages/game/ProfilePage.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import {
  User,
  CheckCircle,
  BarChart,
  Trophy,
  Shield,
  // --- NEW: Icons for expanded stats ---
  HelpCircle,
  AlertTriangle,
  ShieldQuestion,
  PieChart,
  ListChecks,
  Repeat,
  AlertOctagon,
} from 'lucide-react';
import { Profile } from '../../types/game';
import clsx from 'clsx';

// --- NEW: Types for expanded stats ---
type UserProfile = Profile & {
  total_vp: number;
  total_wins: number;
  total_games_played: number;
  avatar_url: string | null;
  status: string;
};

interface RoleStats {
  'True Believer': number;
  Heretic: number;
  Opportunist: number;
}

interface SubRoleStats {
  [subRole: string]: number;
}

interface ScenarioStats {
  [scenarioName: string]: {
    plays: number;
    wins: number;
  };
}

interface ExpandedStats {
  roleStats: RoleStats;
  topRoles: [string, number][];
  subRoleStats: SubRoleStats;
  topSubRoles: [string, number][];
  scenarioStats: ScenarioStats;
  topScenarios: [string, { plays: number; wins: number }][];
}

// --- END NEW ---

export const ProfilePage: React.FC = () => {
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  
  const userIdToFetch = paramUserId || user?.id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- NEW: State for expanded stats ---
  const [expandedStats, setExpandedStats] = useState<ExpandedStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  // --- END NEW ---

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userIdToFetch) {
        setError('No user ID provided.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userIdToFetch)
          .single();
        if (error) throw error;
        if (data) setProfile(data as UserProfile);
        else setError('Profile not found.');
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching the profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userIdToFetch]);

  // --- NEW: Effect to fetch and process expanded stats ---
  useEffect(() => {
    const fetchExpandedStats = async () => {
      if (!userIdToFetch) return;

      setStatsLoading(true);
      setStatsError(null);
      try {
        // 1. Fetch all game history for the player, joining with game_history
        const { data: historyData, error: historyError } = await supabase
          .from('game_history_players')
          .select(`
            role, 
            sub_role, 
            rank,
            game_history:game_history_id (
              scenario_id,
              end_condition,
              winning_role
            )
          `)
          .eq('user_id', userIdToFetch);

        if (historyError) throw historyError;

        // 2. Fetch all scenario names (in a real app, this might be cached)
        const { data: scenariosData, error: scenariosError } = await supabase
          .from('scenarios')
          .select('id, name');
        
        if (scenariosError) throw scenariosError;
        
        const scenarioNameMap = new Map(scenariosData.map(s => [s.id, s.name]));

        // 3. Process the data
        const roleStats: RoleStats = { 'True Believer': 0, Heretic: 0, Opportunist: 0 };
        const subRoleStats: SubRoleStats = {};
        const scenarioStats: ScenarioStats = {};

        for (const game of historyData) {
          const { role, sub_role, rank, game_history } = game;
          if (!game_history) continue; // Skip if join failed

          // Process Role Stats
          if (role in roleStats) {
            roleStats[role as keyof RoleStats]++;
          }

          // Process Sub-Role Stats
          subRoleStats[sub_role] = (subRoleStats[sub_role] || 0) + 1;

          // Process Scenario Stats
          const scenarioId = game_history.scenario_id;
          const scenarioName = scenarioNameMap.get(scenarioId) || 'Unknown Scenario';
          
          if (!scenarioStats[scenarioName]) {
            scenarioStats[scenarioName] = { plays: 0, wins: 0 };
          }
          scenarioStats[scenarioName].plays++;
          
          if (rank === 1) {
            scenarioStats[scenarioName].wins++;
          }
        }

        // Get Top 5s
        const topRoles = Object.entries(roleStats).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topSubRoles = Object.entries(subRoleStats).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topScenarios = Object.entries(scenarioStats).sort((a, b) => b[1].plays - a[1].plays).slice(0, 5);

        setExpandedStats({
          roleStats,
          topRoles,
          subRoleStats,
          topSubRoles,
          scenarioStats,
          topScenarios
        });

      } catch (err: any) {
        setStatsError(err.message || 'Failed to load detailed stats.');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchExpandedStats();
  }, [userIdToFetch]);
  // --- END NEW ---


  // --- Stat Card component (using new theme) ---
  const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number }> = ({ icon: Icon, title, value }) => (
    <div className="game-stat flex items-center space-x-3"> {/* <-- FIX: Using game-stat class */}
      <Icon className="w-6 h-6 text-orange-400 flex-shrink-0" />
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  );

  // --- NEW: Component for displaying expanded stat lists ---
  const StatDisplayCard: React.FC<{
    icon: React.ElementType;
    title: string;
    data: [string, string | number][];
    emptyText: string;
  }> = ({ icon: Icon, title, data, emptyText }) => (
    <Card className="game-card">
      <CardHeader className="flex flex-row items-center space-x-3 pb-2">
        <Icon className="w-6 h-6 text-orange-400" />
        <CardTitle className="text-xl text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-gray-400">{emptyText}</p>
        ) : (
          <ul className="space-y-2">
            {data.map(([label, value]) => (
              <li key={label} className="flex justify-between items-center">
                <span className="text-gray-300">{label}</span>
                <span className="font-bold text-white">{value}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
  // --- END NEW ---

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="game-card bg-red-900/50 border-red-700 p-6 text-center">
        <h2 className="text-xl font-bold text-red-300">Error Loading Profile</h2>
        <p className="text-red-200">{error}</p>
      </Card>
    );
  }

  if (!profile) {
    return null;
  }
  
  const winRate = profile.total_games_played > 0 
    ? ((profile.total_wins / profile.total_games_played) * 100).toFixed(0) + '%'
    : 'N/A';

  // --- NEW: Helper for role icons ---
  const getRoleIcon = (role: string) => {
    if (role === 'Heretic') return <AlertTriangle className="w-5 h-5 text-red-400 inline-block mr-2" />;
    if (role === 'Opportunist') return <ShieldQuestion className="w-5 h-5 text-blue-400 inline-block mr-2" />;
    return <HelpCircle className="w-5 h-5 text-green-400 inline-block mr-2" />;
  };

  return (
    // --- FIX: Using game-card for main container ---
    <div className="mx-auto w-full max-w-4xl p-4 md:p-8">
      <Card className="game-card p-6">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:space-x-6">
          <div className="relative">
            <img
              src={profile.avatar_url || `https://api.dicebear.com/8.x/bottts/svg?seed=${profile.username}`}
              alt={`${profile.username}'s avatar`}
              className="w-32 h-32 rounded-full border-4 border-orange-500 object-cover"
            />
            <span 
              className={clsx(
                'absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-gray-900',
                profile.status === 'Online' ? 'bg-green-500' : 'bg-gray-500'
              )}
              title={profile.status}
            />
          </div>
          <div className="mt-4 md:mt-0 text-center md:text-left">
            {/* --- FIX: Using game-title class --- */}
            <h1 className="text-5xl font-bold game-title">
              {profile.username}
            </h1>
            <p className="text-gray-400">
              Joined: {new Date(profile.created_at).toLocaleDateString()}
            </p>
            {profile.is_admin && (
              <span className="mt-2 inline-block bg-orange-500 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
                ADMIN
              </span>
            )}
          </div>
        </div>

        {/* Basic Stats */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h2 className="text-2xl font-semibold text-white mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Trophy} title="Total Wins" value={profile.total_wins} />
            <StatCard icon={BarChart} title="Win Rate" value={winRate} />
            <StatCard icon={Shield} title="Games Played" value={profile.total_games_played} />
            <StatCard icon={CheckCircle} title="Total Victory Points" value={profile.total_vp} />
          </div>
        </div>

        {/* --- NEW: Expanded Stats Section --- */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h2 className="text-2xl font-semibold text-white mb-4">Detailed Statistics</h2>
          {statsLoading ? (
            <div className="flex justify-center items-center h-48">
              <LoadingSpinner size="lg" />
            </div>
          ) : statsError ? (
            <div className="text-center text-red-400 p-6 bg-red-900/30 rounded-lg">
              <AlertOctagon className="w-8 h-8 mx-auto mb-2" />
              <p>Could not load detailed statistics: {statsError}</p>
            </div>
          ) : expandedStats && profile.total_games_played > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Role Performance */}
              <StatDisplayCard
                icon={PieChart}
                title="Role Performance"
                emptyText="No roles played."
                data={expandedStats.topRoles.map(([role, count]) => [
                  role,
                  `${count} plays (${((count / profile.total_games_played) * 100).toFixed(0)}%)`
                ])}
              />
              
              {/* Top Sub-Roles */}
              <StatDisplayCard
                icon={ListChecks}
                title="Top 5 Sub-Roles"
                emptyText="No sub-roles played."
                data={expandedStats.topSubRoles}
              />

              {/* Top Scenarios */}
              <Card className="game-card">
                <CardHeader className="flex flex-row items-center space-x-3 pb-2">
                  <Repeat className="w-6 h-6 text-orange-400" />
                  <CardTitle className="text-xl text-white">Top 5 Scenarios</CardTitle>
                </CardHeader>
                <CardContent>
                  {expandedStats.topScenarios.length === 0 ? (
                    <p className="text-gray-400">No scenarios played.</p>
                  ) : (
                    <ul className="space-y-3">
                      {expandedStats.topScenarios.map(([name, stats]) => (
                        <li key={name} className="text-sm">
                          <p className="font-bold text-white">{name}</p>
                          <p className="text-gray-400">
                            {stats.plays} Plays / {stats.wins} Wins ({stats.plays > 0 ? ((stats.wins / stats.plays) * 100).toFixed(0) : 0}%)
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

            </div>
          ) : (
            <div className="text-center text-gray-400 p-6 bg-gray-900/50 rounded-lg">
              <p>Play your first game to see detailed statistics here.</p>
            </div>
          )}
        </div>
        {/* --- END NEW --- */}

        {/* Game History (Placeholder) */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h2 className="text-2xl font-semibold text-white mb-4">Recent Game History</h2>
          <div className="text-center text-gray-400 p-6 bg-gray-900/50 rounded-lg">
            <p>A list of recent games will be displayed here soon.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;