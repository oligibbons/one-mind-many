import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GamepadIcon, Search, Filter, Eye, Trash2, Users, Clock, 
  Play, Pause, Square, MoreVertical, ChevronLeft, ChevronRight,
  Activity, TrendingUp, Calendar, AlertTriangle, CheckCircle
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface Game {
  id: string;
  scenario: {
    id: string;
    title: string;
    difficulty: string;
  };
  status: 'in_progress' | 'completed' | 'abandoned';
  players: Array<{
    id: string;
    username: string;
    role: string;
    is_alive: boolean;
  }>;
  current_turn: number;
  started_at: string;
  ended_at?: string;
  duration?: number;
  host: {
    id: string;
    username: string;
  };
}

interface GameStats {
  totalGames: number;
  activeGames: number;
  completedGames: number;
  averageDuration: number;
  totalPlayers: number;
}

const GameManagementPage = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<GameStats>({
    totalGames: 0,
    activeGames: 0,
    completedGames: 0,
    averageDuration: 0,
    totalPlayers: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const gamesPerPage = 10;

  useEffect(() => {
    fetchGames();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter, difficultyFilter]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: gamesPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(difficultyFilter !== 'all' && { difficulty: difficultyFilter })
      });

      const response = await fetch(`/api/admin/games?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch games');

      const data = await response.json();
      setGames(data.games);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching games:', error);
      setError('Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/games/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleForceEndGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to force end this game? This action cannot be undone.')) return;

    setActionLoading(gameId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/games/${gameId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to end game');

      setGames(prev => prev.map(game => 
        game.id === gameId ? { ...game, status: 'abandoned' as const, ended_at: new Date().toISOString() } : game
      ));
      setSuccess('Game ended successfully');
    } catch (error) {
      console.error('Error ending game:', error);
      setError('Failed to end game');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game? This will remove all game data permanently.')) return;

    setActionLoading(gameId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete game');

      setGames(prev => prev.filter(game => game.id !== gameId));
      setSuccess('Game deleted successfully');
    } catch (error) {
      console.error('Error deleting game:', error);
      setError('Failed to delete game');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return <Play className="w-4 h-4 text-green-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'abandoned': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Square className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-green-500/20 text-green-400';
      case 'completed': return 'bg-blue-500/20 text-blue-400';
      case 'abandoned': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'hard': return 'bg-orange-500/20 text-orange-400';
      case 'expert': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const calculateDuration = (startedAt: string, endedAt?: string) => {
    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : new Date();
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Game Management</h1>
          <p className="text-slate-400 mt-2">Monitor active games and game history</p>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded-lg">
          <p className="text-green-500">{success}</p>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Games</p>
              <p className="text-3xl font-bold text-white">{stats.totalGames.toLocaleString()}</p>
            </div>
            <GamepadIcon className="w-12 h-12 text-blue-500 opacity-50" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Active Games</p>
              <p className="text-3xl font-bold text-white">{stats.activeGames}</p>
            </div>
            <Activity className="w-12 h-12 text-green-500 opacity-50" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Completed</p>
              <p className="text-3xl font-bold text-white">{stats.completedGames.toLocaleString()}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-purple-500 opacity-50" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Avg Duration</p>
              <p className="text-3xl font-bold text-white">{formatDuration(stats.averageDuration)}</p>
            </div>
            <Clock className="w-12 h-12 text-orange-500 opacity-50" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Players</p>
              <p className="text-3xl font-bold text-white">{stats.totalPlayers.toLocaleString()}</p>
            </div>
            <Users className="w-12 h-12 text-cyan-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={18} />}
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="abandoned">Abandoned</option>
          </select>
          
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>
          
          <div className="text-sm text-slate-400 flex items-center">
            <Filter size={16} className="mr-2" />
            {games.length} games found
          </div>
        </div>
      </Card>

      {/* Games Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading games..." />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Game
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Players
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Turn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Host
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {games.map((game) => (
                  <motion.tr
                    key={game.id}
                    className="hover:bg-slate-800/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{game.scenario.title}</div>
                        <div className="flex items-center mt-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(game.scenario.difficulty)}`}>
                            {game.scenario.difficulty}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(game.status)}
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(game.status)}`}>
                          {game.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-slate-400 mr-1" />
                        <span className="text-sm text-slate-300">
                          {game.players.filter(p => p.is_alive).length}/{game.players.length}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      Turn {game.current_turn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {formatDuration(calculateDuration(game.started_at, game.ended_at))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {game.host.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedGame(game);
                            setShowGameModal(true);
                          }}
                          leftIcon={<Eye size={14} />}
                        >
                          View
                        </Button>
                        
                        {game.status === 'in_progress' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleForceEndGame(game.id)}
                            disabled={actionLoading === game.id}
                            leftIcon={<Square size={14} />}
                            className="text-orange-400 hover:text-orange-300"
                          >
                            End
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteGame(game.id)}
                          disabled={actionLoading === game.id}
                          leftIcon={<Trash2 size={14} />}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  leftIcon={<ChevronLeft size={16} />}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  rightIcon={<ChevronRight size={16} />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Game Details Modal */}
      {showGameModal && selectedGame && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">Game Details</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Game Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-400">Scenario:</span>
                      <span className="ml-2 text-white">{selectedGame.scenario.title}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedGame.status)}`}>
                        {selectedGame.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Current Turn:</span>
                      <span className="ml-2 text-white">{selectedGame.current_turn}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Started:</span>
                      <span className="ml-2 text-white">{new Date(selectedGame.started_at).toLocaleString()}</span>
                    </div>
                    {selectedGame.ended_at && (
                      <div>
                        <span className="text-slate-400">Ended:</span>
                        <span className="ml-2 text-white">{new Date(selectedGame.ended_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Players</h3>
                  <div className="space-y-2">
                    {selectedGame.players.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${player.is_alive ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-white">{player.username}</span>
                        </div>
                        <span className="text-slate-400 text-sm">{player.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-700 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowGameModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameManagementPage;