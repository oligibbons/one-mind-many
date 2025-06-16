import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, RotateCcw, Eye, Users, Clock, Trophy, Menu, X, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { api } from '../../lib/api';

interface TestGameState {
  game: any;
  current_state: any;
  players: any[];
  actions: any[];
  your_role: string;
  is_host: boolean;
  narrative_log: any[];
}

interface PostGameState {
  game: any;
  results: any;
  players: any[];
  timeline: any[];
  statistics: any;
}

const TestGameViewPage = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<TestGameState | null>(null);
  const [postGameState, setPostGameState] = useState<PostGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'game' | 'postgame'>('game');
  const [mobileActivePanel, setMobileActivePanel] = useState<'narrative' | 'action' | 'players'>('action');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    fetchTestGameState();
  }, []);

  const fetchTestGameState = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/test-game-state');

      if (!response.ok) throw new Error('Failed to fetch test game state');

      const data = await response.json();
      setGameState(data);
    } catch (error) {
      console.error('Error fetching test game state:', error);
      setError('Failed to load test game state');
    } finally {
      setLoading(false);
    }
  };

  const fetchPostGameState = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/test-postgame-state');

      if (!response.ok) throw new Error('Failed to fetch test post-game state');

      const data = await response.json();
      setPostGameState(data);
      setViewMode('postgame');
    } catch (error) {
      console.error('Error fetching test post-game state:', error);
      setError('Failed to load test post-game state');
    } finally {
      setLoading(false);
    }
  };

  const switchToGameView = () => {
    setViewMode('game');
    setError('');
  };

  const switchToPostGameView = () => {
    if (!postGameState) {
      fetchPostGameState();
    } else {
      setViewMode('postgame');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading test environment..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            leftIcon={<ArrowLeft size={18} />}
            className="mr-4"
          >
            Back to Admin
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Test Game Environment</h1>
            <p className="text-slate-400 mt-2">Preview game screens without starting a real game</p>
          </div>
        </div>
        
        <div className="flex gap-2 md:gap-4">
          <Button
            variant={viewMode === 'game' ? 'primary' : 'outline'}
            onClick={switchToGameView}
            leftIcon={<Play size={18} />}
            size="sm"
          >
            Game View
          </Button>
          <Button
            variant={viewMode === 'postgame' ? 'primary' : 'outline'}
            onClick={switchToPostGameView}
            leftIcon={<Trophy size={18} />}
            size="sm"
          >
            Post-Game View
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {viewMode === 'game' && gameState && (
        <TestGameInterface gameState={gameState} mobileActivePanel={mobileActivePanel} setMobileActivePanel={setMobileActivePanel} showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />
      )}

      {viewMode === 'postgame' && postGameState && (
        <TestPostGameInterface postGameState={postGameState} />
      )}
    </div>
  );
};

// Test Game Interface Component
const TestGameInterface = ({ 
  gameState, 
  mobileActivePanel, 
  setMobileActivePanel, 
  showMobileMenu, 
  setShowMobileMenu 
}: { 
  gameState: TestGameState;
  mobileActivePanel: 'narrative' | 'action' | 'players';
  setMobileActivePanel: (panel: 'narrative' | 'action' | 'players') => void;
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
}) => {
  const [selectedAction, setSelectedAction] = useState({ type: '', target: '', intention: '' });
  const [chatInput, setChatInput] = useState('');

  return (
    <div className="h-[80vh] flex flex-col bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
      {/* Game Header */}
      <div className="bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 md:space-x-6">
            <div className="text-white">
              <span className="text-xs md:text-sm text-slate-400">Round</span>
              <span className="ml-1 md:ml-2 text-lg md:text-xl font-bold">{gameState.current_state.round}</span>
            </div>
            <div className="text-white">
              <span className="text-xs md:text-sm text-slate-400">Turn</span>
              <span className="ml-1 md:ml-2 text-lg md:text-xl font-bold">{gameState.current_state.turn}</span>
            </div>
            <div className="text-white">
              <span className="text-xs md:text-sm text-slate-400">Phase</span>
              <span className="ml-1 md:ml-2 text-sm md:text-lg font-medium capitalize">{gameState.current_state.phase}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="text-orange-400 text-xs md:text-sm">
              TEST MODE
            </div>
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-slate-300 hover:text-white"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Panel Selector */}
      <div className="md:hidden bg-slate-800/50 border-b border-slate-700">
        <div className="flex">
          <button
            onClick={() => setMobileActivePanel('narrative')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              mobileActivePanel === 'narrative'
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-slate-400'
            }`}
          >
            Narrative
          </button>
          <button
            onClick={() => setMobileActivePanel('action')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              mobileActivePanel === 'action'
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-slate-400'
            }`}
          >
            Actions
          </button>
          <button
            onClick={() => setMobileActivePanel('players')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              mobileActivePanel === 'players'
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-slate-400'
            }`}
          >
            Players
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Layout */}
        <div className="hidden md:flex flex-1">
          {/* Left Panel - Narrative */}
          <div className="w-1/3 flex flex-col border-r border-slate-800">
            <div className="h-48 relative overflow-hidden">
              <img
                src="https://images.pexels.com/photos/2694344/pexels-photo-2694344.jpeg"
                alt="Game Environment"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 text-white z-20">
                <h3 className="text-lg font-bold">Prison Corridor</h3>
                <p className="text-sm text-slate-300">Level B-2</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white">Narrative Log</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {gameState.narrative_log.map((entry, index) => (
                  <motion.div
                    key={index}
                    className={`p-3 rounded-lg ${
                      entry.type === 'narrative' 
                        ? 'bg-blue-900/30 border-l-4 border-blue-500' 
                        : 'bg-orange-900/30 border-l-4 border-orange-500'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-slate-200 text-sm leading-relaxed">{entry.content}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Turn {entry.turn_number}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Panel - Actions */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Action Selection</h3>
            </div>

            <div className="flex-1 p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Action Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['move', 'search', 'interact', 'hide', 'sabotage', 'help'].map((action) => (
                      <button
                        key={action}
                        onClick={() => setSelectedAction(prev => ({ ...prev, type: action }))}
                        className={`p-3 rounded-lg border transition-colors ${
                          selectedAction.type === action
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <div className="text-sm font-medium capitalize">{action}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedAction.type && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Target</label>
                    <select
                      value={selectedAction.target}
                      onChange={(e) => setSelectedAction(prev => ({ ...prev, target: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                    >
                      <option value="">Select Target</option>
                      <option value="environment">Environment</option>
                      <option value="guard_station">Guard Station</option>
                      <option value="common_area">Common Area</option>
                    </select>
                  </div>
                )}

                <Button
                  disabled={!selectedAction.type}
                  className="w-full"
                  leftIcon={<Play size={18} />}
                >
                  Submit Action (Test Mode)
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Players */}
          <div className="w-1/3 flex flex-col border-l border-slate-800">
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Players</h3>
                <div className="flex items-center text-slate-400">
                  <Users size={18} className="mr-2" />
                  <span>{gameState.players.filter(p => p.is_alive).length}/{gameState.players.length}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {gameState.players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      player.is_alive ? 'bg-slate-800' : 'bg-red-900/30'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                        {player.user.username[0].toUpperCase()}
                      </div>
                      <div className="ml-2">
                        <p className="text-white text-sm font-medium">{player.user.username}</p>
                        <p className="text-xs text-slate-400">{player.role}</p>
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

            <div className="flex-1 p-4">
              <h3 className="text-lg font-bold text-white mb-4">Your Role</h3>
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2 capitalize">{gameState.your_role}</h4>
                  <p className="text-slate-400 text-sm">
                    {gameState.your_role === 'collaborator' && 'Work with the team to achieve objectives'}
                    {gameState.your_role === 'saboteur' && 'Secretly undermine the group\'s efforts'}
                    {gameState.your_role === 'rogue' && 'Look out for yourself above all else'}
                  </p>
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
              src="https://images.pexels.com/photos/2694344/pexels-photo-2694344.jpeg"
              alt="Game Environment"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 text-white">
              <h3 className="text-sm font-bold">Prison Corridor</h3>
              <p className="text-xs text-slate-300">Level B-2</p>
            </div>
          </div>

          {/* Mobile Panel Content */}
          <div className="flex-1 overflow-hidden">
            {mobileActivePanel === 'narrative' && (
              <div className="h-full flex flex-col">
                <div className="p-3 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-white">Narrative Log</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {gameState.narrative_log.map((entry, index) => (
                    <motion.div
                      key={index}
                      className={`p-3 rounded-lg ${
                        entry.type === 'narrative' 
                          ? 'bg-blue-900/30 border-l-4 border-blue-500' 
                          : 'bg-orange-900/30 border-l-4 border-orange-500'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-slate-200 text-sm leading-relaxed">{entry.content}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        Turn {entry.turn_number}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {mobileActivePanel === 'action' && (
              <div className="h-full flex flex-col p-3">
                <h3 className="text-lg font-bold text-white mb-3">Action Selection</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Action Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['move', 'search', 'interact', 'hide', 'sabotage', 'help'].map((action) => (
                        <button
                          key={action}
                          onClick={() => setSelectedAction(prev => ({ ...prev, type: action }))}
                          className={`p-2 rounded-lg border transition-colors ${
                            selectedAction.type === action
                              ? 'bg-orange-500 border-orange-500 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <div className="text-xs font-medium capitalize">{action}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedAction.type && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Target</label>
                      <select
                        value={selectedAction.target}
                        onChange={(e) => setSelectedAction(prev => ({ ...prev, target: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
                      >
                        <option value="">Select Target</option>
                        <option value="environment">Environment</option>
                        <option value="guard_station">Guard Station</option>
                        <option value="common_area">Common Area</option>
                      </select>
                    </div>
                  )}

                  <Button
                    disabled={!selectedAction.type}
                    className="w-full"
                    leftIcon={<Play size={18} />}
                  >
                    Submit Action (Test Mode)
                  </Button>
                </div>
              </div>
            )}

            {mobileActivePanel === 'players' && (
              <div className="h-full flex flex-col">
                <div className="p-3 border-b border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white">Players</h3>
                    <div className="flex items-center text-slate-400">
                      <Users size={16} className="mr-1" />
                      <span className="text-sm">{gameState.players.filter(p => p.is_alive).length}/{gameState.players.length}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {gameState.players.map((player) => (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          player.is_alive ? 'bg-slate-800' : 'bg-red-900/30'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
                            <span className="text-xs">{player.user.username[0].toUpperCase()}</span>
                          </div>
                          <div className="ml-2">
                            <p className="text-white text-sm font-medium">{player.user.username}</p>
                            <p className="text-xs text-slate-400">{player.role}</p>
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

                <div className="flex-1 p-3">
                  <h3 className="text-lg font-bold text-white mb-3">Your Role</h3>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Users className="w-6 h-6 text-blue-400" />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2 capitalize">{gameState.your_role}</h4>
                      <p className="text-slate-400 text-xs">
                        {gameState.your_role === 'collaborator' && 'Work with the team to achieve objectives'}
                        {gameState.your_role === 'saboteur' && 'Secretly undermine the group\'s efforts'}
                        {gameState.your_role === 'rogue' && 'Look out for yourself above all else'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Test Post-Game Interface Component
const TestPostGameInterface = ({ postGameState }: { postGameState: PostGameState }) => {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Game Results Header */}
      <Card className="p-6 md:p-8 text-center">
        <div className="mb-6">
          <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${
            postGameState.results.outcome === 'success' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            <Trophy className="w-8 h-8 md:w-12 md:h-12" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
            {postGameState.results.outcome === 'success' ? 'Mission Accomplished!' : 'Mission Failed'}
          </h1>
          <p className="text-lg md:text-xl text-slate-300">
            {postGameState.results.winner === 'collaborators' && 'The Collaborators achieved their objectives'}
            {postGameState.results.winner === 'saboteurs' && 'The Saboteurs successfully disrupted the mission'}
            {postGameState.results.winner === 'rogues' && 'The Rogues survived and thrived'}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white">{postGameState.results.duration}m</div>
            <div className="text-slate-400 text-sm">Duration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white">{postGameState.results.turns_completed}</div>
            <div className="text-slate-400 text-sm">Turns</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white">
              {postGameState.results.objectives_completed}/{postGameState.results.objectives_total}
            </div>
            <div className="text-slate-400 text-sm">Objectives</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white">{postGameState.players.length}</div>
            <div className="text-slate-400 text-sm">Players</div>
          </div>
        </div>
      </Card>

      {/* Player Results */}
      <Card className="p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Player Performance</h2>
        <div className="space-y-3 md:space-y-4">
          {postGameState.players.map((player, index) => (
            <motion.div
              key={player.id}
              className="bg-slate-800/50 rounded-lg p-3 md:p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-700 rounded-full flex items-center justify-center mr-3 md:mr-4">
                    {player.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-white">{player.username}</h3>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-slate-400">
                      <span className="capitalize">{player.role}</span>
                      <span>{player.is_alive ? 'Survived' : 'Eliminated'}</span>
                      <span>{player.points} points</span>
                    </div>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <div className="text-base md:text-lg font-bold text-white">{player.successful_actions}/{player.actions_taken}</div>
                  <div className="text-xs md:text-sm text-slate-400">Success Rate</div>
                </div>
              </div>
              
              {player.achievements.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1 md:gap-2">
                  {player.achievements.map((achievement, i) => (
                    <span key={i} className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">
                      {achievement}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Game Timeline */}
      <Card className="p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Game Timeline</h2>
        <div className="space-y-3 md:space-y-4">
          {postGameState.timeline.map((event, index) => (
            <div key={index} className="flex items-start">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3 md:mr-4 mt-1">
                <span className="text-white text-xs md:text-sm font-bold">{event.turn}</span>
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm md:text-base">{event.event}</h4>
                <p className="text-slate-400 text-xs md:text-sm">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Statistics */}
      <Card className="p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Game Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">Performance</h3>
            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Most Active Player:</span>
                <span className="text-white text-sm">{postGameState.statistics.most_active_player}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Most Successful Player:</span>
                <span className="text-white text-sm">{postGameState.statistics.most_successful_player}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Total Actions:</span>
                <span className="text-white text-sm">{postGameState.statistics.total_actions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Successful Actions:</span>
                <span className="text-white text-sm">{postGameState.statistics.successful_actions}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">Game Events</h3>
            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Sabotage Attempts:</span>
                <span className="text-white text-sm">{postGameState.statistics.sabotage_attempts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Objectives Failed:</span>
                <span className="text-white text-sm">{postGameState.statistics.objectives_failed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Success Rate:</span>
                <span className="text-white text-sm">
                  {Math.round((postGameState.statistics.successful_actions / postGameState.statistics.total_actions) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TestGameViewPage;