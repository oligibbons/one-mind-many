import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Card } from '../../components/ui/Card';
import { User, CheckCircle, BarChart, Trophy, Shield } from 'lucide-react';
import { Profile } from '../../types/game'; // Assuming you have this type from game.d.ts

// Define a more complete Profile type for this page
type UserProfile = Profile & {
  total_vp: number;
  total_wins: number;
  total_games_played: number;
  avatar_url: string | null;
  status: string;
};

export const ProfilePage: React.FC = () => {
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  
  // --- THIS IS THE FIX ---
  // If a user ID is in the URL, use that.
  // Otherwise, fall back to the currently logged-in user's ID.
  const userIdToFetch = paramUserId || user?.id;
  // --- END FIX ---

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      // --- FIX: Check if we have an ID to fetch ---
      if (!userIdToFetch) {
        setError('No user ID provided.');
        setLoading(false);
        return;
      }
      // --- END FIX ---

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userIdToFetch)
          .single();

        if (error) {
          throw error;
        }
        
        if (data) {
          setProfile(data as UserProfile);
        } else {
          setError('Profile not found.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching the profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userIdToFetch]); // Re-fetch if the ID changes

  const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number }> = ({ icon: Icon, title, value }) => (
    <Card className="bg-slate-800 p-4">
      <div className="flex items-center space-x-3">
        <Icon className="w-6 h-6 text-orange-400" />
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/50 border-red-700 p-6 text-center">
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

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="bg-slate-800 p-6">
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
                'absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-slate-800',
                profile.status === 'Online' ? 'bg-green-500' : 'bg-gray-500'
              )}
              title={profile.status}
            />
          </div>
          <div className="mt-4 md:mt-0 text-center md:text-left">
            <h1 
              className="text-4xl font-bold text-white" 
              style={{ fontFamily: "'CustomHeading', system-ui, sans-serif" }}
            >
              {profile.username}
            </h1>
            <p className="text-slate-400">
              Joined: {new Date(profile.created_at).toLocaleDateString()}
            </p>
            {profile.is_admin && (
              <span className="mt-2 inline-block bg-orange-500 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
                ADMIN
              </span>
            )}
          </div>
        </div>

        {/* Profile Stats */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-4">Player Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon={Trophy} title="Total Wins" value={profile.total_wins} />
            <StatCard icon={BarChart} title="Win Rate" value={winRate} />
            <StatCard icon={Shield} title="Games Played" value={profile.total_games_played} />
            <StatCard icon={CheckCircle} title="Total Victory Points" value={profile.total_vp} />
          </div>
        </div>

        {/* Placeholder for Game History */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-4">Game History</h2>
          <div className="text-center text-slate-400 p-6 bg-slate-800/50 rounded-lg">
            <p>Recent game history will be displayed here.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;