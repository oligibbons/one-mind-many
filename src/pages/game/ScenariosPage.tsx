import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye, Lock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  min_players: number;
  max_players: number;
  creator: {
    id: string;
    username: string;
  };
  is_public: boolean;
  image_url?: string;
  created_at: string;
}

const ScenariosPage = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, isAdmin } = useAuth();
  
  useEffect(() => {
    // Fetch scenarios from API
    const fetchScenarios = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/scenarios', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) throw new Error('Failed to fetch scenarios');
        
        const data = await response.json();
        setScenarios(data);
      } catch (error) {
        console.error('Error fetching scenarios:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchScenarios();
  }, []);
  
  const handleCreateScenario = () => {
    // Navigate to scenario creation page or open modal
    console.log('Create scenario');
  };
  
  const handleEditScenario = (id: string) => {
    console.log('Edit scenario:', id);
  };
  
  const handleDeleteScenario = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scenario?')) return;
    
    try {
      const response = await fetch(`/api/scenarios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to delete scenario');
      
      setScenarios(scenarios.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting scenario:', error);
    }
  };
  
  const filteredScenarios = scenarios.filter(scenario =>
    scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scenario.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scenario.creator.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Game Scenarios</h1>
          <p className="text-slate-400">Browse and manage available game scenarios</p>
        </div>
        
        {(isAdmin || user?.role === 'creator') && (
          <Button
            onClick={handleCreateScenario}
            leftIcon={<Plus size={18} />}
            className="mt-4 md:mt-0"
          >
            Create Scenario
          </Button>
        )}
      </motion.div>
      
      <div className="mb-6">
        <Input
          placeholder="Search scenarios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search size={18} />}
        />
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading scenarios..." />
        </div>
      ) : filteredScenarios.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {filteredScenarios.map(scenario => (
            <Card key={scenario.id} variant="interactive" className="overflow-hidden">
              <div className="relative">
                {scenario.image_url ? (
                  <img
                    src={scenario.image_url}
                    alt={scenario.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-slate-800 flex items-center justify-center">
                    <Eye size={48} className="text-slate-600" />
                  </div>
                )}
                {!scenario.is_public && (
                  <div className="absolute top-2 right-2">
                    <Lock size={20} className="text-orange-500" />
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white">{scenario.title}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(scenario.difficulty)}`}>
                    {scenario.difficulty}
                  </span>
                </div>
                
                <p className="text-slate-400 mb-4 line-clamp-2">{scenario.description}</p>
                
                <div className="space-y-2 mb-4">
                  <p className="text-slate-300 text-sm">
                    <span className="font-semibold">Players:</span> {scenario.min_players}-{scenario.max_players}
                  </p>
                  <p className="text-slate-300 text-sm">
                    <span className="font-semibold">Creator:</span> {scenario.creator.username}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {(isAdmin || scenario.creator.id === user?.id) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Edit size={16} />}
                        onClick={() => handleEditScenario(scenario.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Trash2 size={16} />}
                        onClick={() => handleDeleteScenario(scenario.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-slate-800">
          <p className="text-xl text-slate-300">No scenarios found matching your search.</p>
          {(isAdmin || user?.role === 'creator') && (
            <>
              <p className="text-slate-400 mt-2">Create a new scenario to get started.</p>
              <Button
                onClick={handleCreateScenario}
                leftIcon={<Plus size={18} />}
                className="mt-4"
              >
                Create Scenario
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ScenariosPage;