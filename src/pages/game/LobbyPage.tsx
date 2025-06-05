import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Settings, Play, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';

// Mock data - replace with API calls
const MOCK_LOBBY = {
  id: '1',
  name: 'Prison Break Scenario',
  host: {
    id: '1',
    username: 'GameMaster42'
  },
  scenario: {
    id: '1',
    title: 'Prison Break',
    description: 'Work together to escape a high-security prison facility.',
    minPlayers: 4,
    maxPlayers: 8
  },
  settings: {
    timeLimit: 30,
    difficultyLevel: 'medium'
  },
  status: 'waiting',
  players: [
    { id: '1', username: 'GameMaster42', role: 'host', status: 'ready' },
    { id: '2', username: 'Player2', role: 'player', status: 'not_ready' },
    { id: '3', username: 'Player3', role: 'player', status: 'ready' }
  ]
};

const LobbyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  
  const [lobby, setLobby] = useState(MOCK_LOBBY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const isHost = user?.id === lobby.host.id;
  
  useEffect(() => {
    // Fetch lobby data
    const fetchLobby = async () => {
      setLoading(true);
      try {
        // In a real implementation, this would be an API call
        setTimeout(() => {
          setLobby(MOCK_LOBBY);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load lobby data');
        setLoading(false);
      }
    };
    
    fetchLobby();
  }, [id]);
  
  useEffect(() => {
    if (socket && connected) {
      // Join lobby room
      socket.emit('join:lobby', id);
      
      // Listen for lobby updates
      socket.on('lobby:update', (updatedLobby) => {
        setLobby(updatedLobby);
      });
      
      // Listen for game start
      socket.on('game:start', (gameId) => {
        navigate(`/game/active/${gameId}`);
      });
      
      return () => {
        socket.emit('leave:lobby', id);
        socket.off('lobby:update');
        socket.off('game:start');
      };
    }
  }, [socket, connected, id, navigate]);
  
  const handleStartGame = async () => {
    try {
      // In a real implementation, this would be an API call
      console.log('Starting game...');
      navigate(`/game/active/${id}`);
    } catch (err) {
      setError('Failed to start game');
    }
  };
  
  const handleLeaveLobby = async () => {
    try {
      // In a real implementation, this would be an API call
      console.log('Leaving lobby...');
      navigate('/game/play');
    } catch (err) {
      setError('Failed to leave lobby');
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <LoadingSpinner size="lg\" text="Loading lobby..." />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/game/play')}
            leftIcon={<ArrowLeft size={18} />}
            className="mb-2"
          >
            Back to Lobbies
          </Button>
          <h1 className="text-3xl font-bold text-white">{lobby.name}</h1>
          <p className="text-slate-400">Hosted by {lobby.host.username}</p>
        </div>
        
        <div className="flex gap-4">
          {isHost ? (
            <>
              <Button
                onClick={() => setShowSettings(!showSettings)}
                leftIcon={<Settings size={18} />}
                variant="outline"
              >
                Settings
              </Button>
              <Button
                onClick={handleStartGame}
                leftIcon={<Play size={18} />}
                disabled={lobby.players.length < lobby.scenario.minPlayers}
              >
                Start Game
              </Button>
            </>
          ) : (
            <Button
              onClick={handleLeaveLobby}
              variant="outline"
            >
              Leave Lobby
            </Button>
          )}
        </div>
      </motion.div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scenario Information */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Scenario</h2>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">{lobby.scenario.title}</h3>
              <p className="text-slate-400">{lobby.scenario.description}</p>
              <div className="flex flex-wrap gap-4">
                <div className="bg-slate-800 rounded-lg px-4 py-2">
                  <span className="text-sm text-slate-400">Min Players</span>
                  <p className="text-white font-semibold">{lobby.scenario.minPlayers}</p>
                </div>
                <div className="bg-slate-800 rounded-lg px-4 py-2">
                  <span className="text-sm text-slate-400">Max Players</span>
                  <p className="text-white font-semibold">{lobby.scenario.maxPlayers}</p>
                </div>
                <div className="bg-slate-800 rounded-lg px-4 py-2">
                  <span className="text-sm text-slate-400">Difficulty</span>
                  <p className="text-white font-semibold capitalize">{lobby.settings.difficultyLevel}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Players List */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Players</h2>
              <div className="flex items-center text-slate-400">
                <Users size={18} className="mr-2" />
                <span>{lobby.players.length}/{lobby.scenario.maxPlayers}</span>
              </div>
            </div>
            <div className="space-y-3">
              {lobby.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                      {player.username[0].toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <p className="text-white font-medium">{player.username}</p>
                      <p className="text-sm text-slate-400 capitalize">{player.role}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    player.status === 'ready' 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {player.status === 'ready' ? 'Ready' : 'Not Ready'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LobbyPage;