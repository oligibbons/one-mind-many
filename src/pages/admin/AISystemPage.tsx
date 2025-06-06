import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Settings, Play, Save, Upload, Download, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface AIModel {
  id: string;
  name: string;
  type: 'narrative' | 'character' | 'scenario';
  status: 'training' | 'ready' | 'error';
  accuracy: number;
  lastTrained: string;
  huggingFaceModel?: string;
}

interface TrainingData {
  scenarios: number;
  narratives: number;
  characters: number;
  totalTokens: number;
}

const AISystemPage = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [trainingData, setTrainingData] = useState<TrainingData>({
    scenarios: 0,
    narratives: 0,
    characters: 0,
    totalTokens: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [huggingFaceKey, setHuggingFaceKey] = useState('');
  const [masterModelConfig, setMasterModelConfig] = useState({
    baseModel: 'microsoft/DialoGPT-medium',
    maxLength: 512,
    temperature: 0.8,
    topP: 0.9,
    repetitionPenalty: 1.1
  });

  useEffect(() => {
    fetchAIModels();
    fetchTrainingData();
  }, []);

  const fetchAIModels = async () => {
    try {
      // Mock data - replace with actual API call
      setModels([
        {
          id: '1',
          name: 'Master Narrative AI',
          type: 'narrative',
          status: 'ready',
          accuracy: 87.5,
          lastTrained: '2024-01-15T10:30:00Z',
          huggingFaceModel: 'microsoft/DialoGPT-medium'
        },
        {
          id: '2',
          name: 'Character Behavior AI',
          type: 'character',
          status: 'training',
          accuracy: 72.3,
          lastTrained: '2024-01-14T15:45:00Z'
        },
        {
          id: '3',
          name: 'Scenario Generator AI',
          type: 'scenario',
          status: 'ready',
          accuracy: 91.2,
          lastTrained: '2024-01-16T09:15:00Z'
        }
      ]);
    } catch (error) {
      console.error('Error fetching AI models:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainingData = async () => {
    try {
      // Mock data - replace with actual API call
      setTrainingData({
        scenarios: 156,
        narratives: 2847,
        characters: 1203,
        totalTokens: 1250000
      });
    } catch (error) {
      console.error('Error fetching training data:', error);
    }
  };

  const handleCreateMasterAI = async () => {
    try {
      setLoading(true);
      
      // Create master AI model using Hugging Face API
      const response = await fetch('/api/admin/ai/create-master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          huggingFaceKey,
          config: masterModelConfig
        })
      });

      if (!response.ok) throw new Error('Failed to create master AI');

      await fetchAIModels();
    } catch (error) {
      console.error('Error creating master AI:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModel = async (modelId: string) => {
    try {
      const response = await fetch(`/api/admin/ai/train/${modelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to start training');

      // Update model status
      setModels(prev => prev.map(model => 
        model.id === modelId 
          ? { ...model, status: 'training' as const }
          : model
      ));
    } catch (error) {
      console.error('Error training model:', error);
    }
  };

  const handleTestModel = async (modelId: string) => {
    try {
      const response = await fetch(`/api/admin/ai/test/${modelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to test model');

      const result = await response.json();
      alert(`Test Result: ${result.output}`);
    } catch (error) {
      console.error('Error testing model:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'training': return <Zap className="w-5 h-5 text-orange-500 animate-pulse" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Brain className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-500/20 text-green-400';
      case 'training': return 'bg-orange-500/20 text-orange-400';
      case 'error': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading AI System..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Narrative System</h1>
          <p className="text-slate-400 mt-2">Configure and train AI models for dynamic storytelling</p>
        </div>
      </div>

      {/* Training Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Scenarios</p>
              <p className="text-3xl font-bold text-white">{trainingData.scenarios}</p>
            </div>
            <Brain className="w-12 h-12 text-blue-500 opacity-50" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Narratives</p>
              <p className="text-3xl font-bold text-white">{trainingData.narratives.toLocaleString()}</p>
            </div>
            <Brain className="w-12 h-12 text-green-500 opacity-50" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Characters</p>
              <p className="text-3xl font-bold text-white">{trainingData.characters.toLocaleString()}</p>
            </div>
            <Brain className="w-12 h-12 text-purple-500 opacity-50" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Tokens</p>
              <p className="text-3xl font-bold text-white">{(trainingData.totalTokens / 1000000).toFixed(1)}M</p>
            </div>
            <Brain className="w-12 h-12 text-orange-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Master AI Configuration */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-6">Master AI Configuration</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Input
              label="Hugging Face API Key"
              type="password"
              value={huggingFaceKey}
              onChange={(e) => setHuggingFaceKey(e.target.value)}
              placeholder="Enter your Hugging Face API key"
            />
            
            <Input
              label="Base Model"
              value={masterModelConfig.baseModel}
              onChange={(e) => setMasterModelConfig(prev => ({ ...prev, baseModel: e.target.value }))}
              placeholder="microsoft/DialoGPT-medium"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Max Length"
                type="number"
                value={masterModelConfig.maxLength}
                onChange={(e) => setMasterModelConfig(prev => ({ ...prev, maxLength: parseInt(e.target.value) }))}
              />
              
              <Input
                label="Temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={masterModelConfig.temperature}
                onChange={(e) => setMasterModelConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Top P"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={masterModelConfig.topP}
                onChange={(e) => setMasterModelConfig(prev => ({ ...prev, topP: parseFloat(e.target.value) }))}
              />
              
              <Input
                label="Repetition Penalty"
                type="number"
                step="0.1"
                min="1"
                max="2"
                value={masterModelConfig.repetitionPenalty}
                onChange={(e) => setMasterModelConfig(prev => ({ ...prev, repetitionPenalty: parseFloat(e.target.value) }))}
              />
            </div>
            
            <div className="pt-4">
              <Button
                onClick={handleCreateMasterAI}
                disabled={!huggingFaceKey}
                leftIcon={<Brain size={18} />}
                className="w-full"
              >
                Create Master AI Model
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* AI Models */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-white mb-6">AI Models</h2>
        
        <div className="space-y-4">
          {models.map((model) => (
            <motion.div
              key={model.id}
              className="bg-slate-800/50 rounded-lg p-6 border border-slate-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(model.status)}
                    <h3 className="text-lg font-semibold text-white">{model.name}</h3>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(model.status)}`}>
                    {model.status}
                  </span>
                  
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                    {model.type}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTrainModel(model.id)}
                    disabled={model.status === 'training'}
                    leftIcon={<Zap size={16} />}
                  >
                    {model.status === 'training' ? 'Training...' : 'Train'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestModel(model.id)}
                    disabled={model.status !== 'ready'}
                    leftIcon={<Play size={16} />}
                  >
                    Test
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Settings size={16} />}
                  >
                    Configure
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Accuracy:</span>
                  <span className="ml-2 text-white font-medium">{model.accuracy}%</span>
                </div>
                
                <div>
                  <span className="text-slate-400">Last Trained:</span>
                  <span className="ml-2 text-white font-medium">
                    {new Date(model.lastTrained).toLocaleDateString()}
                  </span>
                </div>
                
                {model.huggingFaceModel && (
                  <div>
                    <span className="text-slate-400">HF Model:</span>
                    <span className="ml-2 text-white font-medium">{model.huggingFaceModel}</span>
                  </div>
                )}
              </div>
              
              {model.status === 'training' && (
                <div className="mt-4">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full animate-pulse" style={{ width: '45%' }}></div>
                  </div>
                  <p className="text-sm text-slate-400 mt-2">Training in progress... 45% complete</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AISystemPage;