import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Save, RotateCcw, Shield, Users, Zap, Settings, AlertTriangle, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface Rule {
  id: string;
  type: 'global' | 'role' | 'action' | 'movement';
  name: string;
  description: string;
  category: string;
  parameters: Record<string, any>;
  roles?: string[];
  actions?: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const RulesManagementPage = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [testGameState, setTestGameState] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);

  const [editorData, setEditorData] = useState({
    id: '',
    type: 'global' as const,
    name: '',
    description: '',
    category: '',
    parameters: '{}',
    roles: [] as string[],
    actions: [] as string[],
    active: true
  });

  const categories = [
    'programming', 'resolution', 'action', 'intention', 'movement', 'validation'
  ];

  const ruleTypes = [
    'global', 'role', 'action', 'movement'
  ];

  const availableRoles = [
    'collaborator', 'rogue', 'saboteur'
  ];

  const availableActions = [
    'move', 'interact', 'search', 'sabotage', 'help', 'hide'
  ];

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/rules', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch rules');

      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = () => {
    setEditorData({
      id: '',
      type: 'global',
      name: '',
      description: '',
      category: '',
      parameters: '{}',
      roles: [],
      actions: [],
      active: true
    });
    setSelectedRule(null);
    setShowEditor(true);
  };

  const handleEditRule = (rule: Rule) => {
    setEditorData({
      id: rule.id,
      type: rule.type,
      name: rule.name,
      description: rule.description,
      category: rule.category,
      parameters: JSON.stringify(rule.parameters, null, 2),
      roles: rule.roles || [],
      actions: rule.actions || [],
      active: rule.active
    });
    setSelectedRule(rule);
    setShowEditor(true);
  };

  const handleSaveRule = async () => {
    try {
      let parameters;
      try {
        parameters = JSON.parse(editorData.parameters);
      } catch (error) {
        alert('Invalid JSON in parameters field');
        return;
      }

      const ruleData = {
        ...editorData,
        parameters,
        roles: editorData.roles.length > 0 ? editorData.roles : undefined,
        actions: editorData.actions.length > 0 ? editorData.actions : undefined
      };

      const url = selectedRule 
        ? `/api/rules/${selectedRule.id}`
        : '/api/rules';
      
      const method = selectedRule ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(ruleData)
      });

      if (!response.ok) throw new Error('Failed to save rule');

      await fetchRules();
      setShowEditor(false);
    } catch (error) {
      console.error('Error saving rule:', error);
      alert('Failed to save rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const response = await fetch(`/api/rules/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete rule');

      setRules(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('Failed to delete rule');
    }
  };

  const handleToggleRule = async (id: string, active: boolean) => {
    try {
      const response = await fetch(`/api/rules/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ active })
      });

      if (!response.ok) throw new Error('Failed to toggle rule');

      setRules(prev => prev.map(r => 
        r.id === id ? { ...r, active } : r
      ));
    } catch (error) {
      console.error('Error toggling rule:', error);
      alert('Failed to toggle rule');
    }
  };

  const handleTestRules = async () => {
    if (!testGameState) {
      alert('Please provide a test game state');
      return;
    }

    try {
      let gameState;
      try {
        gameState = JSON.parse(testGameState);
      } catch (error) {
        alert('Invalid JSON in test game state');
        return;
      }

      const response = await fetch('/api/rules/validate-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ gameState })
      });

      if (!response.ok) throw new Error('Failed to test rules');

      const results = await response.json();
      setTestResults(results);
    } catch (error) {
      console.error('Error testing rules:', error);
      alert('Failed to test rules');
    }
  };

  const filteredRules = rules.filter(rule => {
    const categoryMatch = filterCategory === 'all' || rule.category === filterCategory;
    const typeMatch = filterType === 'all' || rule.type === filterType;
    return categoryMatch && typeMatch;
  });

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'global': return <Shield className="w-5 h-5 text-blue-500" />;
      case 'role': return <Users className="w-5 h-5 text-green-500" />;
      case 'action': return <Zap className="w-5 h-5 text-orange-500" />;
      case 'movement': return <RotateCcw className="w-5 h-5 text-purple-500" />;
      default: return <Settings className="w-5 h-5 text-slate-500" />;
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading rules..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Rules Management</h1>
          <p className="text-slate-400 mt-2">Configure and manage game rules</p>
        </div>
        
        <Button
          onClick={handleCreateRule}
          leftIcon={<Plus size={18} />}
        >
          Create Rule
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
            >
              <option value="all">All Types</option>
              {ruleTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="text-sm text-slate-400">
              {filteredRules.length} of {rules.length} rules
            </div>
          </div>
        </div>
      </Card>

      {/* Rules List */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        {filteredRules.map((rule) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="mt-1">
                    {getRuleIcon(rule.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{rule.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rule.active 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {rule.active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                        {rule.type}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                        {rule.category}
                      </span>
                    </div>
                    
                    <p className="text-slate-400 mb-3">{rule.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      {rule.roles && rule.roles.length > 0 && (
                        <div>
                          <span className="text-slate-400">Roles:</span>
                          <span className="ml-2 text-white">{rule.roles.join(', ')}</span>
                        </div>
                      )}
                      
                      {rule.actions && rule.actions.length > 0 && (
                        <div>
                          <span className="text-slate-400">Actions:</span>
                          <span className="ml-2 text-white">{rule.actions.join(', ')}</span>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-slate-400">Updated:</span>
                        <span className="ml-2 text-white">
                          {new Date(rule.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleRule(rule.id, !rule.active)}
                  >
                    {rule.active ? 'Disable' : 'Enable'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRule(rule)}
                    leftIcon={<Edit size={16} />}
                  >
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
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

      {/* Rule Testing */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Test Rules</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Test Game State (JSON)
            </label>
            <textarea
              value={testGameState || ''}
              onChange={(e) => setTestGameState(e.target.value)}
              placeholder="Enter game state JSON to test rules..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-32 font-mono text-sm"
            />
          </div>
          
          <Button
            onClick={handleTestRules}
            disabled={!testGameState}
            leftIcon={<CheckCircle size={18} />}
          >
            Test Rules
          </Button>
          
          {testResults && (
            <div className={`p-4 rounded-lg border ${
              testResults.valid 
                ? 'bg-green-500/10 border-green-500' 
                : 'bg-red-500/10 border-red-500'
            }`}>
              <div className="flex items-center mb-2">
                {testResults.valid ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                )}
                <span className={`font-medium ${
                  testResults.valid ? 'text-green-400' : 'text-red-400'
                }`}>
                  {testResults.valid ? 'All rules passed' : 'Rule violations found'}
                </span>
              </div>
              
              {testResults.errors && testResults.errors.length > 0 && (
                <div className="space-y-1">
                  {testResults.errors.map((error: string, index: number) => (
                    <p key={index} className="text-red-400 text-sm">• {error}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Rule Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">
                {selectedRule ? 'Edit Rule' : 'Create Rule'}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Rule ID"
                  value={editorData.id}
                  onChange={(e) => setEditorData(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="unique-rule-id"
                  disabled={!!selectedRule}
                />
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                  <select
                    value={editorData.type}
                    onChange={(e) => setEditorData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                  >
                    {ruleTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <Input
                label="Name"
                value={editorData.name}
                onChange={(e) => setEditorData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Rule name"
              />
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={editorData.description}
                  onChange={(e) => setEditorData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this rule does..."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={editorData.category}
                  onChange={(e) => setEditorData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Applicable Roles</label>
                  <div className="space-y-2">
                    {availableRoles.map(role => (
                      <label key={role} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editorData.roles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditorData(prev => ({ ...prev, roles: [...prev.roles, role] }));
                            } else {
                              setEditorData(prev => ({ ...prev, roles: prev.roles.filter(r => r !== role) }));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-slate-300 capitalize">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Applicable Actions</label>
                  <div className="space-y-2">
                    {availableActions.map(action => (
                      <label key={action} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editorData.actions.includes(action)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditorData(prev => ({ ...prev, actions: [...prev.actions, action] }));
                            } else {
                              setEditorData(prev => ({ ...prev, actions: prev.actions.filter(a => a !== action) }));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-slate-300 capitalize">{action}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Parameters (JSON)</label>
                <textarea
                  value={editorData.parameters}
                  onChange={(e) => setEditorData(prev => ({ ...prev, parameters: e.target.value }))}
                  placeholder='{"key": "value"}'
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-32 font-mono text-sm"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editorData.active}
                  onChange={(e) => setEditorData(prev => ({ ...prev, active: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-slate-300">Active</span>
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
                onClick={handleSaveRule}
                leftIcon={<Save size={18} />}
              >
                {selectedRule ? 'Update' : 'Create'} Rule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RulesManagementPage;