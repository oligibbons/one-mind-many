import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye, Lock, Code, Upload } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';

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
  is_featured: boolean;
  image_url?: string;
  content: any;
  created_at: string;
}

const ScenarioManagementPage = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showInkEditor, setShowInkEditor] = useState(false);
  const [inkScript, setInkScript] = useState('');
  const [editorData, setEditorData] = useState({
    title: '',
    description: '',
    difficulty: 'medium' as const,
    min_players: 4,
    max_players: 8,
    is_public: true,
    is_featured: false,
    image_url: '',
    content: {
      setting: '',
      objective: '',
      initial_resources: {},
      events: [],
      characters: [],
      locations: [],
      ink_story_json: ''
    }
  });
  const { user, isAdmin } = useAuth();
  
  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await fetch('/api/admin/scenarios', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch scenarios');

      const data = await response.json();
      setScenarios(data);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      // Mock data for development
      setScenarios([
        {
          id: '1',
          title: 'Prison Break',
          description: 'Escape from a maximum security prison facility',
          difficulty: 'hard',
          min_players: 4,
          max_players: 8,
          creator: { id: '1', username: 'admin' },
          is_public: true,
          is_featured: true,
          image_url: 'https://images.pexels.com/photos/2694344/pexels-photo-2694344.jpeg',
          content: {
            setting: 'A maximum security prison',
            objective: 'Escape without being detected',
            initial_resources: { tools: 0, keys: 0 },
            events: [],
            characters: [],
            locations: [],
            ink_story_json: '{"inkVersion":20,"root":[[{"->":"start"}],"done",{"start":[["^You wake up in a cold, damp cell. The sound of dripping water echoes through the prison block.","\n","^Your cellmate is still asleep in the bunk above you.","\n","ev","str","^Look around the cell","/str","/ev",{"*":".^.c-0","flg":20},"ev","str","^Check under your mattress","/str","/ev",{"*":".^.c-1","flg":20},"ev","str","^Wake up your cellmate","/str","/ev",{"*":".^.c-2","flg":20},{"c-0":["\n","^The cell is small and sparse. There\'s a toilet in the corner, a small sink, and a barred window too high to reach without standing on something.","\n",{"->":"cell_options"},null],"c-1":["\n","^You lift your thin mattress and find a small metal shiv hidden there. You quickly pocket it before anyone notices.","\n",{"#":"EXTERNAL add_to_inventory(\"shiv\")"},{"->":"cell_options"},null],"c-2":["\n","^You reach up and shake your cellmate\'s shoulder. He groans and turns over, clearly not wanting to be disturbed.","\n","^\"Leave me alone,\" he mutters. \"Guard rotation isn\'t for another hour.\"","\n",{"->":"cell_options"},null]}],"cell_options":[["^What will you do next?","\n","ev","str","^Examine the cell door","/str","/ev",{"*":".^.c-0","flg":20},"ev","str","^Look out the window","/str","/ev",{"*":".^.c-1","flg":20},{"c-0":["\n","^The cell door is solid steel with a small window at eye level. The lock looks sophisticated - you won\'t be picking it with conventional means.","\n",{"->":"guard_approaches"},null],"c-1":["\n","^Standing on your tiptoes, you can just barely see out the window. The prison yard is visible, with guards patrolling the perimeter. Beyond that, freedom...","\n",{"->":"guard_approaches"},null]}],"guard_approaches":[["^You hear footsteps approaching your cell. A guard stops outside the door.","\n","ev","str","^Hide the shiv (if you have it)","/str","str","^hide_shiv","/str","/ev",{"*":".^.c-0","flg":20},"ev","str","^Stand at attention","/str","/ev",{"*":".^.c-1","flg":20},"ev","str","^Pretend to be asleep","/str","/ev",{"*":".^.c-2","flg":20},{"c-0":[{"#":"EXTERNAL has_item(\"shiv\")"},"\n","^You quickly hide the shiv in your prison uniform just as the guard looks in.","\n","^\"Breakfast in 10 minutes, prisoner,\" he announces before moving on.","\n",{"->":"breakfast_time"},null],"c-1":["\n","^You stand at attention as the guard approaches. He seems mildly surprised by your compliance.","\n","^\"At ease, prisoner. Breakfast in 10 minutes,\" he says, almost respectfully, before moving on.","\n",{"->":"breakfast_time"},null],"c-2":["\n","^You dive back onto your bunk and pretend to be asleep. The guard bangs his baton on the door.","\n","^\"Rise and shine, lazy! Breakfast in 10 minutes, and I better not have to come back for you!\"","\n",{"->":"breakfast_time"},null]}],"breakfast_time":[["^Your cellmate finally gets up and stretches.","\n","^\"Another day in paradise,\" he mutters sarcastically. \"Ready for breakfast?\"","\n","ev","str","^\"What\'s for breakfast today?\"","/str","/ev",{"*":".^.c-0","flg":20},"ev","str","^\"Do you know any way out of here?\"","/str","/ev",{"*":".^.c-1","flg":20},"ev","str","^Remain silent","/str","/ev",{"*":".^.c-2","flg":20},{"c-0":["\n","^\"Same slop as yesterday, and the day before that,\" he replies with a grimace. \"But it\'s better than starving.\"","\n",{"->":"doors_open"},null],"c-1":["\n","^He looks at you sharply, then glances around to make sure no one is listening.","\n","^\"Not so loud,\" he whispers. \"Maybe. Find me during yard time.\"","\n",{"->":"doors_open"},null],"c-2":["\n","^You say nothing. Your cellmate shrugs, used to the silent treatment.","\n",{"->":"doors_open"},null]}],"doors_open":[["^The cell doors slide open with a loud clang. It\'s time for breakfast.","\n","^The end... for now.","\n",["end",["done",{"#f":5,"#n":"g-0"}],null],"done",null]}]}]}'
          },
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
          play_count: 1247,
          rating: 4.7
        },
        {
          id: '2',
          title: 'Research Facility',
          description: 'Investigate a mysterious research facility',
          difficulty: 'medium',
          min_players: 3,
          max_players: 6,
          creator: { id: '2', username: 'creator1' },
          is_public: true,
          is_featured: false,
          content: {
            setting: 'An abandoned research facility',
            objective: 'Discover what happened to the missing scientists',
            initial_resources: { flashlights: 1, batteries: 2 },
            events: [],
            characters: [],
            locations: [],
            ink_story_json: ''
          },
          created_at: '2024-01-14T15:45:00Z',
          updated_at: '2024-01-14T15:45:00Z',
          play_count: 892,
          rating: 4.3
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScenario = () => {
    setEditorData({
      title: '',
      description: '',
      difficulty: 'medium',
      min_players: 4,
      max_players: 8,
      is_public: true,
      is_featured: false,
      image_url: '',
      content: {
        setting: '',
        objective: '',
        initial_resources: {},
        events: [],
        characters: [],
        locations: [],
        ink_story_json: ''
      }
    });
    setInkScript('');
    setSelectedScenario(null);
    setShowEditor(true);
    setShowInkEditor(false);
  };

  const handleEditScenario = (scenario: Scenario) => {
    setEditorData({
      title: scenario.title,
      description: scenario.description,
      difficulty: scenario.difficulty,
      min_players: scenario.min_players,
      max_players: scenario.max_players,
      is_public: scenario.is_public,
      is_featured: scenario.is_featured,
      image_url: scenario.image_url || '',
      content: scenario.content
    });
    
    // Extract Ink script if available
    if (scenario.content.ink_story_json) {
      try {
        const inkJson = JSON.parse(scenario.content.ink_story_json);
        // This is just a placeholder - in a real implementation, you'd convert JSON back to Ink
        setInkScript(JSON.stringify(inkJson, null, 2));
      } catch (error) {
        console.error('Error parsing Ink JSON:', error);
        setInkScript('');
      }
    } else {
      setInkScript('');
    }
    
    setSelectedScenario(scenario);
    setShowEditor(true);
    setShowInkEditor(false);
  };

  const handleEditInkScript = () => {
    setShowInkEditor(true);
  };

  const handleSaveInkScript = () => {
    try {
      // In a real implementation, you'd compile the Ink script to JSON here
      // For now, we'll just assume the script is valid JSON
      const inkJson = inkScript;
      
      setEditorData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          ink_story_json: inkJson
        }
      }));
      
      setShowInkEditor(false);
    } catch (error) {
      console.error('Error saving Ink script:', error);
      alert('Failed to save Ink script. Please check for errors.');
    }
  };

  const handleSaveScenario = async () => {
    try {
      const url = selectedScenario 
        ? `/api/admin/scenarios/${selectedScenario.id}`
        : '/api/admin/scenarios';
      
      const method = selectedScenario ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editorData)
      });

      if (!response.ok) throw new Error('Failed to save scenario');

      await fetchScenarios();
      setShowEditor(false);
    } catch (error) {
      console.error('Error saving scenario:', error);
    }
  };

  const handleDeleteScenario = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scenario?')) return;

    try {
      const response = await fetch(`/api/admin/scenarios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete scenario');

      setScenarios(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting scenario:', error);
    }
  };

  const handleToggleFeatured = async (id: string, featured: boolean) => {
    try {
      const response = await fetch(`/api/admin/scenarios/${id}/featured`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ featured })
      });

      if (!response.ok) throw new Error('Failed to update featured status');

      setScenarios(prev => prev.map(s => 
        s.id === id ? { ...s, is_featured: featured } : s
      ));
    } catch (error) {
      console.error('Error updating featured status:', error);
    }
  };

  const filteredScenarios = scenarios.filter(scenario => {
    const matchesSearch = scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scenario.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || scenario.difficulty === filterDifficulty;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'public' && scenario.is_public) ||
                         (filterStatus === 'private' && !scenario.is_public) ||
                         (filterStatus === 'featured' && scenario.is_featured);
    
    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'hard': return 'bg-orange-500/20 text-orange-400';
      case 'expert': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading scenarios..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Scenario Management</h1>
          <p className="text-slate-400 mt-2">Create, edit, and manage game scenarios</p>
        </div>
        
        <div className="flex gap-4">
          <Button
            variant="outline"
            leftIcon={<Upload size={18} />}
          >
            Import
          </Button>
          <Button
            onClick={handleCreateScenario}
            leftIcon={<Plus size={18} />}
          >
            Create Scenario
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search scenarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={18} />}
          />
          
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="featured">Featured</option>
          </select>
          
          <div className="text-sm text-slate-400 flex items-center">
            <Search size={16} className="mr-2" />
            {filteredScenarios.length} of {scenarios.length} scenarios
          </div>
        </div>
      </Card>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredScenarios.map((scenario) => (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card variant="interactive" className="overflow-hidden h-full">
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
                
                <div className="absolute top-2 left-2 flex gap-2">
                  {scenario.is_featured && (
                    <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Featured
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(scenario.difficulty)}`}>
                    {scenario.difficulty}
                  </span>
                </div>
                
                <div className="absolute top-2 right-2">
                  {scenario.is_public ? (
                    <Eye size={20} className="text-green-400" />
                  ) : (
                    <Lock size={20} className="text-orange-400" />
                  )}
                </div>
                
                {scenario.content.ink_story_json && (
                  <div className="absolute bottom-2 right-2">
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-medium flex items-center">
                      <Code size={12} className="mr-1" />
                      Ink Script
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{scenario.title}</h3>
                <p className="text-slate-400 mb-4 line-clamp-2">{scenario.description}</p>
                
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Players:</span>
                    <span className="text-white">{scenario.min_players}-{scenario.max_players}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Creator:</span>
                    <span className="text-white">{scenario.creator.username}</span>
                  </div>
                  {scenario.play_count !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Plays:</span>
                      <span className="text-white">{scenario.play_count?.toLocaleString() || 0}</span>
                    </div>
                  )}
                  {scenario.rating !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rating:</span>
                      <span className="text-white">{scenario.rating?.toFixed(1) || 'N/A'} ⭐</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditScenario(scenario)}
                    leftIcon={<Edit size={16} />}
                  >
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleFeatured(scenario.id, !scenario.is_featured)}
                    className={scenario.is_featured ? 'bg-orange-500/20' : ''}
                  >
                    {scenario.is_featured ? 'Unfeature' : 'Feature'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteScenario(scenario.id)}
                    leftIcon={<Trash2 size={16} />}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Scenario Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">
                {selectedScenario ? 'Edit Scenario' : 'Create Scenario'}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Title"
                  value={editorData.title}
                  onChange={(e) => setEditorData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter scenario title"
                />
                
                <Input
                  label="Image URL"
                  value={editorData.image_url}
                  onChange={(e) => setEditorData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={editorData.description}
                  onChange={(e) => setEditorData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter scenario description"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
                  <select
                    value={editorData.difficulty}
                    onChange={(e) => setEditorData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                
                <Input
                  label="Min Players"
                  type="number"
                  min="1"
                  max="20"
                  value={editorData.min_players}
                  onChange={(e) => setEditorData(prev => ({ ...prev, min_players: parseInt(e.target.value) }))}
                />
                
                <Input
                  label="Max Players"
                  type="number"
                  min="1"
                  max="20"
                  value={editorData.max_players}
                  onChange={(e) => setEditorData(prev => ({ ...prev, max_players: parseInt(e.target.value) }))}
                />
                
                <div className="flex flex-col gap-2 pt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editorData.is_public}
                      onChange={(e) => setEditorData(prev => ({ ...prev, is_public: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-slate-300">Public</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editorData.is_featured}
                      onChange={(e) => setEditorData(prev => ({ ...prev, is_featured: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-slate-300">Featured</span>
                  </label>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300">Scenario Content</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditInkScript}
                    leftIcon={<Code size={16} />}
                  >
                    Edit Ink Script
                  </Button>
                </div>
                <textarea
                  value={JSON.stringify(editorData.content, null, 2)}
                  onChange={(e) => {
                    try {
                      const content = JSON.parse(e.target.value);
                      setEditorData(prev => ({ ...prev, content }));
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                  placeholder="Enter scenario content as JSON"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-48 font-mono text-sm"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-700 flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setShowEditor(false)}
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleSaveScenario}
                leftIcon={<Plus size={18} />}
              >
                {selectedScenario ? 'Update' : 'Create'} Scenario
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ink Script Editor Modal */}
      {showInkEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Code className="w-6 h-6 mr-2 text-blue-400" />
                Edit Ink Script
              </h2>
            </div>
            
            <div className="p-6">
              <p className="text-slate-400 mb-4">
                Edit the Ink script for this scenario. This will be compiled to JSON and used to drive the interactive narrative.
              </p>
              <textarea
                value={inkScript}
                onChange={(e) => setInkScript(e.target.value)}
                placeholder="Enter Ink script here..."
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-96 font-mono text-sm"
              />
            </div>
            
            <div className="p-6 border-t border-slate-700 flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setShowInkEditor(false)}
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleSaveInkScript}
                leftIcon={<Code size={18} />}
              >
                Save Ink Script
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioManagementPage;