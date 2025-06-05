import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Zap, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Mock data - will be replaced with API calls
const MOCK_LOBBIES = [
  {
    id: '1',
    name: 'Prison Break Scenario',
    host: 'GameMaster42',
    players: 3,
    maxPlayers: 8,
    scenario: 'Prison Break',
    status: 'waiting',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Research Facility',
    host: 'MysteryPlayer',
    players: 5,
    maxPlayers: 6,
    scenario: 'Research Facility',
    status: 'waiting',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Haunted Mansion',
    host: 'GhostHunter',
    players: 4,
    maxPlayers: 8,
    scenario: 'Haunted Mansion',
    status: 'waiting',
    createdAt: new Date().toISOString(),
  }
];

const PlayPage = () => {
  const [lobbies, setLobbies] = useState(MOCK_LOBBIES);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    // Simulate API call
    const fetchLobbies = async () => {
      setLoading(true);
      // In a real implementation, this would be an API call
      setTimeout(() => {
        setLobbies(MOCK_LOBBIES);
        setLoading(false);
      }, 1000);
    };
    
    fetchLobbies();
  }, []);
  
  const handleCreateLobby = () => {
    // This would open a modal or navigate to create lobby page
    navigate('/game/lobby/new');
  };
  
  const handleQuickJoin = () => {
    // Find the first available lobby and join it
    const availableLobby = lobbies.find(lobby => 
      lobby.players < lobby.maxPlayers && lobby.status === 'waiting'
    );
    
    if (availableLobby) {
      navigate(`/game/lobby/${availableLobby.id}`);
    } else {
      // Show a message that no lobbies are available
      alert('No available lobbies found. Try creating your own!');
    }
  };
  
  const handleJoinLobby = (lobbyId: string) => {
    navigate(`/game/lobby/${lobbyId}`);
  };
  
  const filteredLobbies = lobbies.filter(lobby => 
    lobby.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lobby.scenario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lobby.host.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Game Lobbies</h1>
          <p className="text-slate-400">Join an existing game or create your own</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
          <Button
            onClick={handleCreateLobby}
            leftIcon={<Plus size={18} />}
            variant="primary"
          >
            Create Lobby
          </Button>
          
          <Button
            onClick={handleQuickJoin}
            leftIcon={<Zap size={18} />}
            variant="secondary"
          >
            Quick Join
          </Button>
        </div>
      </motion.div>
      
      <div className="mb-6">
        <Input
          placeholder="Search lobbies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search size={18} />}
        />
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading lobbies..." />
        </div>
      ) : filteredLobbies.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {filteredLobbies.map(lobby => (
            <Card key={lobby.id} variant="interactive" className="overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white">{lobby.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {lobby.status === 'waiting' ? 'Open' : 'In Progress'}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-slate-300">
                    <span className="font-semibold">Scenario:</span> {lobby.scenario}
                  </p>
                  <p className="text-slate-300">
                    <span className="font-semibold">Host:</span> {lobby.host}
                  </p>
                  <p className="text-slate-300 flex items-center">
                    <Users size={16} className="mr-1" />
                    <span className="font-semibold">{lobby.players}/{lobby.maxPlayers}</span> Players
                  </p>
                </div>
                
                <Button
                  onClick={() => handleJoinLobby(lobby.id)}
                  className="w-full"
                  disabled={lobby.players >= lobby.maxPlayers}
                >
                  {lobby.players >= lobby.maxPlayers ? 'Full' : 'Join Game'}
                </Button>
              </div>
            </Card>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-slate-800">
          <p className="text-xl text-slate-300">No lobbies found matching your search.</p>
          <p className="text-slate-400 mt-2">Try adjusting your search or create a new lobby.</p>
          <Button
            onClick={handleCreateLobby}
            leftIcon={<Plus size={18} />}
            className="mt-4"
          >
            Create Lobby
          </Button>
        </div>
      )}
    </div>
  );
};

export default PlayPage;