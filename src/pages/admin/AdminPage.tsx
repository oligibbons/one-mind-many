import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, GamepadIcon, Settings, BarChart3, Shield, Brain, FileText, Activity, Gavel, TestTube } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface AdminStats {
  totalUsers: number;
  activeGames: number;
  totalScenarios: number;
  activeUsers: number;
  newUsersToday: number;
  bannedUsers: number;
}

const AdminPage = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      setError(`Failed to load admin statistics: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading admin dashboard..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-2">Manage your game platform</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-400">System Status:</span>
          <span className="font-medium text-green-400">
            🟢 Healthy
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={fetchStats}
            className="mt-2 text-red-400 hover:text-red-300 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Users</p>
                <p className="text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-green-400 mt-1">+{stats.newUsersToday} today</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Active Games</p>
                <p className="text-3xl font-bold text-white">{stats.activeGames}</p>
                <p className="text-sm text-slate-400 mt-1">Currently running</p>
              </div>
              <GamepadIcon className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Scenarios</p>
                <p className="text-3xl font-bold text-white">{stats.totalScenarios}</p>
                <p className="text-sm text-slate-400 mt-1">Available to play</p>
              </div>
              <FileText className="w-12 h-12 text-purple-500 opacity-50" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Active Users</p>
                <p className="text-3xl font-bold text-white">{stats.activeUsers}</p>
                <p className="text-sm text-slate-400 mt-1">Last 24 hours</p>
              </div>
              <Activity className="w-12 h-12 text-orange-500 opacity-50" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">New Users Today</p>
                <p className="text-3xl font-bold text-white">{stats.newUsersToday}</p>
                <p className="text-sm text-green-400 mt-1">Registration growth</p>
              </div>
              <Users className="w-12 h-12 text-cyan-500 opacity-50" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Banned Users</p>
                <p className="text-3xl font-bold text-white">{stats.bannedUsers}</p>
                <p className="text-sm text-red-400 mt-1">Moderation actions</p>
              </div>
              <Shield className="w-12 h-12 text-red-500 opacity-50" />
            </div>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/admin/users">
          <Card variant="interactive" className="p-6 h-full">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">User Management</h3>
                <p className="text-slate-400 text-sm">Manage user accounts, roles, and permissions</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/games">
          <Card variant="interactive" className="p-6 h-full">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <GamepadIcon className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Game Management</h3>
                <p className="text-slate-400 text-sm">Monitor active games and game history</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/scenarios">
          <Card variant="interactive" className="p-6 h-full">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <FileText className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Scenario Management</h3>
                <p className="text-slate-400 text-sm">Create, edit, and manage game scenarios</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/content">
          <Card variant="interactive" className="p-6 h-full">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <FileText className="w-8 h-8 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Content Management</h3>
                <p className="text-slate-400 text-sm">Manage website content, pages, and navigation</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/ai">
          <Card variant="interactive" className="p-6 h-full">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-pink-500/20 rounded-lg">
                <Brain className="w-8 h-8 text-pink-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">AI System</h3>
                <p className="text-slate-400 text-sm">Configure AI models and narrative generation</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/rules">
          <Card variant="interactive" className="p-6 h-full">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <Gavel className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Rules Management</h3>
                <p className="text-slate-400 text-sm">Configure and manage game rules</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/test-game">
          <Card variant="interactive" className="p-6 h-full">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-cyan-500/20 rounded-lg">
                <TestTube className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Test Game Environment</h3>
                <p className="text-slate-400 text-sm">Preview game screens without starting a real game</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/analytics">
          <Card variant="interactive" className="p-6 h-full">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-500/20 rounded-lg">
                <BarChart3 className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Analytics</h3>
                <p className="text-slate-400 text-sm">View detailed analytics and reports</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card className="p-6 mt-8">
        <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
        
        <div className="space-y-4">
          <motion.div
            className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">New user registration</p>
                <p className="text-slate-400 text-sm">user@example.com joined the platform</p>
              </div>
            </div>
            <span className="text-slate-400 text-sm">2 minutes ago</span>
          </motion.div>

          <motion.div
            className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium">New scenario created</p>
                <p className="text-slate-400 text-sm">"Space Station Crisis" by admin</p>
              </div>
            </div>
            <span className="text-slate-400 text-sm">15 minutes ago</span>
          </motion.div>

          <motion.div
            className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <GamepadIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium">Game completed</p>
                <p className="text-slate-400 text-sm">Prison Break scenario finished with 6 players</p>
              </div>
            </div>
            <span className="text-slate-400 text-sm">1 hour ago</span>
          </motion.div>
        </div>
      </Card>
    </div>
  );
};

export default AdminPage;