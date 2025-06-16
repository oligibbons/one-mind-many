import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MessageSquare, AlertTriangle, Settings, Pause, Play, 
  Send, Eye, EyeOff, Target, Zap, Shield, Search, Clock,
  ChevronUp, ChevronDown, RotateCcw, Volume2, VolumeX, Menu, X
} from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { api } from '../../lib/api';

interface GameState {
  turn: number;
  round: number;
  phase: 'planning' | 'action' | 'resolution' | 'ended';
  resources: Record<string, number>;
  environment: Record<string, any>;
  events: Array<{
    id: string;
    type: 'narrative' | 'action' | 'system';
    content: string;
    timestamp: string;
    visible_to?: string[];
  }>;
}

interface Player {
  id: string;
  username: string;
  role: string;
  is_alive: boolean;
  avatar_url?: string;
  status: 'ready' | 'waiting' | 'disconnected';
}

interface TurnOrderPrediction {
  [playerId: string]: number; // position in turn order (1-based)
}

interface GameAction {
  type: string;
  target?: string;
  intention?: string;
  data?: any;
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
  const [narrativeLog, setNarrativeLog] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [pauseRequested, setPauseRequested] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [turnOrderPrediction, setTurnOrderPrediction] = useState<TurnOrderPrediction>({});
  const [selectedAction, setSelectedAction] = useState<GameAction>({ type: '' });
  const [showNarrativeExpanded, setShowNarrativeExpanded] = useState(false);
  const [mobileActivePanel, setMobileActivePanel] = useState<'narrative' | 'action' | 'players'>('action');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [gameSettings, setGameSettings] = useState({
    soundEnabled: true,
    musicEnabled: true,
    volume: 80,
    autoScroll: true,
    showTimestamps: true,
    compactMode: false
  });

  // Mock environment images
  const environmentImages = [
    'https://images.pexels.com/photos/2694344/pexels-photo-2694344.jpeg', // Prison corridor
    'https://images.pexels.com/photos/2693212/pexels-photo-2693212.jpeg', // Dark hallway
    'https://images.pexels.com/photos/1108701/pexels-photo-1108701.jpeg', // Industrial facility
  ];

  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const response = await api.get(`/api/game/${id}`);
        
        if (!response.ok) throw new Error('Failed to fetch game state');
        
        const data = await response.json();
        setGameState(data.current_state);
        setPlayers(data.players);
        setNarrativeLog(data.narrative_log || []);
        
        // Initialize turn order prediction
        const initialPrediction: TurnOrderPrediction = {};
        data.players.forEach((player: Player, index: number) => {
          if (player.id !== user?.id) {
            initialPrediction[player.id] = index + 1;
          }
        });
        setTurnOrderPrediction(initialPrediction);
        
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
        if (data.narrative) setNarrativeLog(prev => [...prev, data.narrative]);
      });
      
      socket.on('chat:message', (message) => {
        setChatMessages((prev) => [...prev, message]);
      });

      socket.on('pause:requested', (data) => {
        setPauseCount(data.count);
      });
      
      return () => {
        socket.emit('leave:game', id);
        socket.off('game:update');
        socket.off('chat:message');
        socket.off('pause:requested');
      };
    }
  }, [id, socket, user?.id]);

  const handleSubmitAction = async () => {
    if (!selectedAction.type) return;

    try {
      const response = await api.post(`/api/game/${id}/action`, {
        action_type: selectedAction.type,
        action_data: selectedAction,
      });
      
      if (!response.ok) throw new Error('Failed to submit action');
      
      setSelectedAction({ type: '' });
    } catch (error) {
      setError('Failed to submit action');
    }
  };
  
  const handleSendMessage = () => {
    if (socket && chatInput.trim()) {
      socket.emit('chat:message', {
        roomId: `game:${id}`,
        message: chatInput,
      });
      setChatInput('');
    }
  };

  const handlePauseRequest = () => {
    if (socket) {
      socket.emit('pause:request', { gameId: id });
      setPauseRequested(true);
    }
  };

  const updateTurnOrderPrediction = (playerId: string, position: number) => {
    setTurnOrderPrediction(prev => ({
      ...prev,
      [playerId]: position
    }));
  };

  const calculateCurrentTurnOrder = () => {
    if (!gameState || !players.length) return [];
    
    const currentRound = gameState.round || 1;
    const rotationOffset = (currentRound - 1) % players.length;
    
    return players.map((_, index) => {
      const adjustedIndex = (index + rotationOffset) % players.length;
      return players[adjustedIndex];
    });
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

  const currentTurnOrder = calculateCurrentTurnOrder();

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Game Header */}
      <div className="bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 p-3 md:p-4 paper-texture-dark">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 md:space-x-6">
            <div className="text-white">
              <span className="text-xs md:text-sm text-slate-400 custom-font">Round</span>
              <span className="ml-1 md:ml-2 text-lg md:text-xl font-bold custom-font">{gameState.round || 1}</span>
            </div>
            <div className="text-white">
              <span className="text-xs md:text-sm text-slate-400 custom-font">Turn</span>
              <span className="ml-1 md:ml-2 text-lg md:text-xl font-bold custom-font">{gameState.turn}</span>
            </div>
            <div className="text-white">
              <span className="text-xs md:text-sm text-slate-400 custom-font">Phase</span>
              <span className="ml-1 md:ml-2 text-sm md:text-lg font-medium capitalize custom-font">{gameState.phase}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            {pauseCount > 0 && (
              <div className="text-orange-400 text-xs md:text-sm custom-font">
                {pauseCount}/{players.length} pause
              </div>
            )}
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            {/* Desktop Controls */}
            <div className="hidden md:flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseRequest}
                disabled={pauseRequested}
                leftIcon={<Pause size={16} />}
                className="game-button"
              >
                {pauseRequested ? 'Pause Requested' : 'Pause'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                leftIcon={<Settings size={16} />}
                className="game-button"
              >
                Settings
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              className="md:hidden mt-3 pt-3 border-t border-slate-700"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePauseRequest}
                  disabled={pauseRequested}
                  leftIcon={<Pause size={16} />}
                  className="flex-1 game-button"
                >
                  {pauseRequested ? 'Pause Requested' : 'Pause'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  leftIcon={<Settings size={16} />}
                  className="flex-1 game-button"
                >
                  Settings
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Panel Selector */}
      <div className="md:hidden bg-slate-800/50 border-b border-slate-700 paper-texture-dark">
        <div className="flex">
          <button
            onClick={() => setMobileActivePanel('narrative')}
            className={`flex-1 py-3 px-4 text-sm font-medium custom-font transition-colors ${
              mobileActivePanel === 'narrative'
                ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-500/10'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Narrative
          </button>
          <button
            onClick={() => setMobileActivePanel('action')}
            className={`flex-1 py-3 px-4 text-sm font-medium custom-font transition-colors ${
              mobileActivePanel === 'action'
                ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-500/10'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Actions
          </button>
          <button
            onClick={() => setMobileActivePanel('players')}
            className={`flex-1 py-3 px-4 text-sm font-medium custom-font transition-colors ${
              mobileActivePanel === 'players'
                ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-500/10'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Players
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Layout */}
        <div className="hidden md:flex flex-1">
          {/* Left Panel - Narrative & Environment */}
          <div className="w-1/3 flex flex-col border-r border-slate-800">
            {/* Environment Images */}
            <div className="h-48 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50 z-10" />
              <img
                src={environmentImages[0]}
                alt="Game Environment"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 text-white z-20">
                <h3 className="text-lg font-bold custom-font">Prison Corridor</h3>
                <p className="text-sm text-slate-300 body-font">Level B-2</p>
              </div>
            </div>

            {/* Narrative Log */}
            <div className="flex-1 flex flex-col game-card">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white custom-font">Narrative Log</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNarrativeExpanded(!showNarrativeExpanded)}
                  leftIcon={showNarrativeExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                >
                  {showNarrativeExpanded ? 'Collapse' : 'Expand'}
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {narrativeLog.map((entry, index) => (
                  <motion.div
                    key={entry.id || index}
                    className={`p-3 rounded-lg game-card ${
                      entry.type === 'narrative' 
                        ? 'bg-blue-900/30 border-l-4 border-blue-500' 
                        : entry.type === 'action'
                        ? 'bg-orange-900/30 border-l-4 border-orange-500'
                        : 'bg-slate-800/50 border-l-4 border-slate-600'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-slate-200 text-sm leading-relaxed body-font">{entry.content}</p>
                    {gameSettings.showTimestamps && (
                      <p className="text-xs text-slate-500 mt-2 body-font">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </motion.div>
                ))}
                
                {narrativeLog.length === 0 && (
                  <div className="text-center text-slate-400 py-8">
                    <Eye size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="body-font">Waiting for the story to begin...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center Panel - Actions & Turn Order */}
          <div className="flex-1 flex flex-col">
            {/* Turn Order Predictor */}
            <div className="p-4 border-b border-slate-800 game-card">
              <h3 className="text-lg font-bold text-white mb-4 custom-font">Turn Order Prediction</h3>
              <div className="grid grid-cols-4 gap-2">
                {currentTurnOrder.map((player, index) => (
                  <div key={player.id} className="text-center">
                    <div className="text-xs text-slate-400 mb-1 body-font">Position {index + 1}</div>
                    <div className="bg-slate-800 rounded-lg p-2 game-card">
                      <div className="text-sm font-medium text-white truncate custom-font">
                        {player.username}
                      </div>
                      {player.id !== user?.id && (
                        <select
                          value={turnOrderPrediction[player.id] || index + 1}
                          onChange={(e) => updateTurnOrderPrediction(player.id, parseInt(e.target.value))}
                          className="w-full mt-1 bg-slate-700 text-white text-xs rounded px-1 py-0.5 body-font"
                        >
                          {players.map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Panel */}
            <div className="flex-1 p-4 game-card">
              <h3 className="text-lg font-bold text-white mb-4 custom-font">Action Selection</h3>
              
              <div className="space-y-4">
                {/* Action Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 custom-font">Action Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['move', 'search', 'interact', 'hide', 'sabotage', 'help'].map((action) => (
                      <button
                        key={action}
                        onClick={() => setSelectedAction(prev => ({ ...prev, type: action }))}
                        className={`p-3 rounded-lg border transition-all duration-200 game-button ${
                          selectedAction.type === action
                            ? 'bg-orange-500 border-orange-500 text-white shadow-glow-orange'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-sm font-medium capitalize custom-font">{action}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Selection */}
                {selectedAction.type && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 custom-font">Target</label>
                    <select
                      value={selectedAction.target || ''}
                      onChange={(e) => setSelectedAction(prev => ({ ...prev, target: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 body-font focus:border-orange-500 focus:ring-orange-500/20 transition-colors"
                    >
                      <option value="">Select Target</option>
                      <option value="environment">Environment</option>
                      {players.filter(p => p.id !== user?.id && p.is_alive).map(player => (
                        <option key={player.id} value={player.id}>{player.username}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Intention Tags */}
                {selectedAction.type && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 custom-font">Intention</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['cooperative', 'suspicious', 'defensive', 'aggressive'].map((intention) => (
                        <button
                          key={intention}
                          onClick={() => setSelectedAction(prev => ({ ...prev, intention }))}
                          className={`p-2 rounded-lg border text-sm transition-all duration-200 game-button ${
                            selectedAction.intention === intention
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <span className="custom-font">{intention}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <Button
                  onClick={handleSubmitAction}
                  disabled={!selectedAction.type}
                  className="w-full game-button"
                  leftIcon={<Zap size={18} />}
                >
                  Submit Action
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Players & Chat */}
          <div className="w-1/3 flex flex-col border-l border-slate-800">
            {/* Players List */}
            <div className="p-4 border-b border-slate-800 game-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white custom-font">Players</h3>
                <div className="flex items-center text-slate-400">
                  <Users size={18} className="mr-2" />
                  <span className="body-font">{players.filter(p => p.is_alive).length}/{players.length}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded-lg transition-colors game-card ${
                      player.is_alive ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-900/30'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium custom-font">{player.username[0].toUpperCase()}</span>
                      </div>
                      <div className="ml-2">
                        <p className="text-white text-sm font-medium custom-font">{player.username}</p>
                        <p className="text-xs text-slate-400 body-font">{player.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          player.is_alive ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      {turnOrderPrediction[player.id] && (
                        <span className="text-xs text-slate-400 body-font">
                          #{turnOrderPrediction[player.id]}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat */}
            <div className="flex-1 flex flex-col game-card">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center custom-font">
                  <MessageSquare size={18} className="mr-2" />
                  Game Chat
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg game-card ${
                      message.userId === user?.id
                        ? 'bg-orange-500/20 ml-8'
                        : 'bg-slate-800 mr-8'
                    }`}
                  >
                    <p className="text-xs font-medium text-slate-300 mb-1 custom-font">
                      {message.username}
                    </p>
                    <p className="text-white text-sm body-font">{message.message}</p>
                    <p className="text-xs text-slate-500 mt-1 body-font">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-slate-800">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim()}
                    leftIcon={<Send size={16} />}
                    className="game-button"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex-1 flex flex-col">
          {/* Environment Image - Mobile */}
          <div className="h-32 relative overflow-hidden">
            <img
              src={environmentImages[0]}
              alt="Game Environment"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 text-white">
              <h3 className="text-sm font-bold custom-font">Prison Corridor</h3>
              <p className="text-xs text-slate-300 body-font">Level B-2</p>
            </div>
          </div>

          {/* Mobile Panel Content */}
          <div className="flex-1 overflow-hidden">
            {mobileActivePanel === 'narrative' && (
              <div className="h-full flex flex-col game-card">
                <div className="p-3 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-white custom-font">Narrative Log</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {narrativeLog.map((entry, index) => (
                    <motion.div
                      key={entry.id || index}
                      className={`p-3 rounded-lg game-card ${
                        entry.type === 'narrative' 
                          ? 'bg-blue-900/30 border-l-4 border-blue-500' 
                          : entry.type === 'action'
                          ? 'bg-orange-900/30 border-l-4 border-orange-500'
                          : 'bg-slate-800/50 border-l-4 border-slate-600'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-slate-200 text-sm leading-relaxed body-font">{entry.content}</p>
                      {gameSettings.showTimestamps && (
                        <p className="text-xs text-slate-500 mt-2 body-font">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </p>
                      )}
                    </motion.div>
                  ))}
                  
                  {narrativeLog.length === 0 && (
                    <div className="text-center text-slate-400 py-8">
                      <Eye size={32} className="mx-auto mb-4 opacity-50" />
                      <p className="text-sm body-font">Waiting for the story to begin...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {mobileActivePanel === 'action' && (
              <div className="h-full flex flex-col p-3 game-card">
                {/* Turn Order - Mobile */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-3 custom-font">Turn Order</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {currentTurnOrder.slice(0, 4).map((player, index) => (
                      <div key={player.id} className="text-center">
                        <div className="text-xs text-slate-400 mb-1 body-font">#{index + 1}</div>
                        <div className="bg-slate-800 rounded-lg p-2 game-card">
                          <div className="text-xs font-medium text-white truncate custom-font">
                            {player.username}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Selection - Mobile */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <h3 className="text-lg font-bold text-white mb-3 custom-font">Actions</h3>
                  
                  <div className="space-y-4">
                    {/* Action Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2 custom-font">Action Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['move', 'search', 'interact', 'hide', 'sabotage', 'help'].map((action) => (
                          <button
                            key={action}
                            onClick={() => setSelectedAction(prev => ({ ...prev, type: action }))}
                            className={`p-2 rounded-lg border transition-all duration-200 game-button ${
                              selectedAction.type === action
                                ? 'bg-orange-500 border-orange-500 text-white shadow-glow-orange'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            <div className="text-xs font-medium capitalize custom-font">{action}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Target Selection */}
                    {selectedAction.type && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2 custom-font">Target</label>
                        <select
                          value={selectedAction.target || ''}
                          onChange={(e) => setSelectedAction(prev => ({ ...prev, target: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm body-font focus:border-orange-500 focus:ring-orange-500/20"
                        >
                          <option value="">Select Target</option>
                          <option value="environment">Environment</option>
                          {players.filter(p => p.id !== user?.id && p.is_alive).map(player => (
                            <option key={player.id} value={player.id}>{player.username}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Intention Tags */}
                    {selectedAction.type && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2 custom-font">Intention</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['cooperative', 'suspicious', 'defensive', 'aggressive'].map((intention) => (
                            <button
                              key={intention}
                              onClick={() => setSelectedAction(prev => ({ ...prev, intention }))}
                              className={`p-2 rounded-lg border text-xs transition-all duration-200 game-button ${
                                selectedAction.intention === intention
                                  ? 'bg-blue-500 border-blue-500 text-white'
                                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              <span className="custom-font">{intention}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submit Action */}
                    <Button
                      onClick={handleSubmitAction}
                      disabled={!selectedAction.type}
                      className="w-full game-button"
                      leftIcon={<Zap size={18} />}
                    >
                      Submit Action
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {mobileActivePanel === 'players' && (
              <div className="h-full flex flex-col game-card">
                {/* Players List - Mobile */}
                <div className="p-3 border-b border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white custom-font">Players</h3>
                    <div className="flex items-center text-slate-400">
                      <Users size={16} className="mr-1" />
                      <span className="text-sm body-font">{players.filter(p => p.is_alive).length}/{players.length}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-[30vh] overflow-y-auto custom-scrollbar">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors game-card ${
                          player.is_alive ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-900/30'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs custom-font">{player.username[0].toUpperCase()}</span>
                          </div>
                          <div className="ml-2">
                            <p className="text-white text-sm font-medium custom-font">{player.username}</p>
                            <p className="text-xs text-slate-400 body-font">{player.status}</p>
                          </div>
                        </div>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            player.is_alive ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat - Mobile */}
                <div className="flex-1 flex flex-col">
                  <div className="p-3 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white flex items-center custom-font">
                      <MessageSquare size={16} className="mr-2" />
                      Chat
                    </h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded-lg game-card ${
                          message.userId === user?.id
                            ? 'bg-orange-500/20'
                            : 'bg-slate-800'
                        }`}
                      >
                        <p className="text-xs font-medium text-slate-300 mb-1 custom-font">
                          {message.username}
                        </p>
                        <p className="text-white text-sm body-font">{message.message}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-3 border-t border-slate-800">
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type a message..."
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 text-sm"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim()}
                        leftIcon={<Send size={14} />}
                        size="sm"
                        className="game-button"
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-md game-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white custom-font">Game Settings</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 custom-font">Sound Effects</span>
                  <button
                    onClick={() => setGameSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                    className={`p-2 rounded-lg transition-colors ${gameSettings.soundEnabled ? 'text-orange-500' : 'text-slate-500'}`}
                  >
                    {gameSettings.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 custom-font">Auto-scroll Narrative</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gameSettings.autoScroll}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, autoScroll: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 custom-font">Show Timestamps</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gameSettings.showTimestamps}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, showTimestamps: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 custom-font">
                    Volume: {gameSettings.volume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={gameSettings.volume}
                    onChange={(e) => setGameSettings(prev => ({ ...prev, volume: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-700 flex justify-end gap-4">
                <Button variant="outline" onClick={() => setShowSettings(false)} className="game-button">
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GamePage;