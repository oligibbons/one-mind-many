import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MessageSquare, AlertTriangle } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface GameState {
  turn: number;
  resources: Record<string, number>;
  environment: Record<string, any>;
  events: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

interface Player {
  id: string;
  username: string;
  role: string;
  is_alive: boolean;
  avatar_url?: string;
}

const GamePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const response = await fetch(`/api/game/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) throw new Error('Failed to fetch game state');
        
        const data = await response.json();
        setGameState(data.current_state);
        setPlayers(data.players);
        setLoading(false);
      } catch (error) {
        setError('Failed to load game state');
        setLoading(false);
      }
    };
    
    fetchGameState();
    
    // Socket event listeners
    if (socket) {
      socket.emit('join:game', id);
      
      socket.on('game:update', (data) => {
        setGameState(data.state);
        if (data.players) setPlayers(data.players);
      });
      
      socket.on('chat:message', (message) => {
        setChatMessages((prev) => [...prev, message]);
      });
      
      return () => {
        socket.emit('leave:game', id);
        socket.off('game:update');
        socket.off('chat:message');
      };
    }
  }, [id, socket]);
  
  const handleAction = async (actionType: string) => {
    try {
      const response = await fetch(`/api/game/${id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action_type: actionType,
          action_data: {},
        }),
      });
      
      if (!response.ok) throw new Error('Failed to submit action');
      
      setSelectedAction(null);
    } catch (error) {
      setError('Failed to submit action');
    }
  };
  
  const handleSendMessage = (message: string) => {
    if (socket && message.trim()) {
      socket.emit('chat:message', {
        roomId: `game:${id}`,
        message,
      });
    }
  };
  
  if (loading) {
    return <LoadingSpinner fullScreen text="Loading game..." />;
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Card className="p-6">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button onClick={() => navigate('/game')}>Return to Menu</Button>
        </Card>
      </div>
    );
  }
  
  if (!gameState) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-white mb-2">Game Not Found</h2>
          <p className="text-slate-400 mb-4">This game session may have ended or been cancelled.</p>
          <Button onClick={() => navigate('/game')}>Return to Menu</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Game State and Actions */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Game Status</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Turn</p>
                  <p className="text-2xl font-bold text-white">{gameState.turn}</p>
                </div>
                {Object.entries(gameState.resources).map(([resource, amount]) => (
                  <div key={resource} className="bg-slate-800 rounded-lg p-4">
                    <p className="text-slate-400 text-sm capitalize">{resource}</p>
                    <p className="text-2xl font-bold text-white">{amount}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Available Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Button
                  onClick={() => handleAction('move')}
                  disabled={selectedAction === 'move'}
                >
                  Move
                </Button>
                <Button
                  onClick={() => handleAction('search')}
                  disabled={selectedAction === 'search'}
                >
                  Search
                </Button>
                <Button
                  onClick={() => handleAction('interact')}
                  disabled={selectedAction === 'interact'}
                >
                  Interact
                </Button>
              </div>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Event Log</h2>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {gameState.events.map((event, index) => (
                  <div
                    key={index}
                    className="bg-slate-800 rounded-lg p-4"
                  >
                    <p className="text-slate-300">{event.description}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
        
        {/* Players and Chat */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Players</h2>
                <Users size={24} className="text-slate-400" />
              </div>
              <div className="space-y-4">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      player.is_alive
                        ? 'bg-slate-800'
                        : 'bg-red-900/50'
                    }`}
                  >
                    <div className="flex items-center">
                      {player.avatar_url ? (
                        <img
                          src={player.avatar_url}
                          alt={player.username}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                          <span className="text-sm font-bold">
                            {player.username[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="ml-3 font-medium text-white">
                        {player.username}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        player.is_alive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {player.is_alive ? 'Alive' : 'Dead'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Chat</h2>
                <MessageSquare size={24} className="text-slate-400" />
              </div>
              <div className="h-60 overflow-y-auto mb-4 space-y-4">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.userId === user?.id
                        ? 'bg-orange-500/20 ml-8'
                        : 'bg-slate-800 mr-8'
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-300">
                      {message.username}
                    </p>
                    <p className="text-white">{message.message}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    const input = document.querySelector('input');
                    if (input) {
                      handleSendMessage(input.value);
                      input.value = '';
                    }
                  }}
                >
                  Send
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;