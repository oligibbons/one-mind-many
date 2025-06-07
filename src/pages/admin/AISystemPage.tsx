import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Settings, Play, Save, Upload, Download, Zap, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
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
  const [testPrompt, setTestPrompt] = useState('You are trapped in a dark research facility. What do you do?');
  const [testResult, setTestResult] = useState<string>('');
  const [testLoading, setTestLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [trainLoading, setTrainLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [masterModelConfig, setMasterModelConfig] = useState({
    baseModel: 'meta-llama/Llama-3.1-8B-Instruct',
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
          huggingFaceModel: 'meta-llama/Llama-3.1-8B-Instruct'
        },
        {
          id: '2',
          name: 'Character Behavior AI',
          type: 'character',
          status: 'ready',
          accuracy: 72.3,
          lastTrained: '2024-01-14T15:45:00Z',
          huggingFaceModel: 'microsoft/DialoGPT-medium'
        },
        {
          id: '3',
          name: 'Scenario Generator AI',
          type: 'scenario',
          status: 'ready',
          accuracy: 91.2,
          lastTrained: '2024-01-16T09:15:00Z',
          huggingFaceModel: 'meta-llama/Llama-3.1-8B-Instruct'
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
    if (!huggingFaceKey.trim()) {
      setError('Please enter your Hugging Face API key');
      return;
    }

    setCreateLoading(true);
    setError('');
    setSuccess('');

    try {
      // Test the API key by making a simple request
      const testResponse = await fetch('https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${huggingFaceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: 'Test connection',
          parameters: {
            max_new_tokens: 10,
            temperature: 0.7
          }
        })
      });

      if (!testResponse.ok) {
        if (testResponse.status === 401) {
          throw new Error('Invalid Hugging Face API key. Please check your token.');
        } else if (testResponse.status === 403) {
          throw new Error('Access denied. Make sure you have access to the Llama model.');
        } else {
          throw new Error(`API Error: ${testResponse.status}`);
        }
      }

      // Store the API key securely (in a real app, this would be encrypted)
      localStorage.setItem('hf_api_key', huggingFaceKey);

      // Create a new model entry
      const newModel: AIModel = {
        id: Date.now().toString(),
        name: 'Custom Llama Model',
        type: 'narrative',
        status: 'ready',
        accuracy: 0,
        lastTrained: new Date().toISOString(),
        huggingFaceModel: masterModelConfig.baseModel
      };

      setModels(prev => [...prev, newModel]);
      setSuccess('Master AI model created successfully! You can now test it.');
      setHuggingFaceKey(''); // Clear the input for security
    } catch (error: any) {
      console.error('Error creating master AI:', error);
      setError(error.message || 'Failed to create master AI model');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleTrainModel = async (modelId: string) => {
    setTrainLoading(modelId);
    setError('');
    setSuccess('');

    try {
      // Simulate training process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update model status
      setModels(prev => prev.map(model => 
        model.id === modelId 
          ? { ...model, status: 'ready' as const, accuracy: Math.random() * 20 + 80 }
          : model
      ));
      
      setSuccess('Model training completed successfully!');
    } catch (error) {
      console.error('Error training model:', error);
      setError('Failed to train model');
    } finally {
      setTrainLoading(null);
    }
  };

  const handleTestModel = async (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;

    const apiKey = localStorage.getItem('hf_api_key');
    if (!apiKey) {
      setError('No API key found. Please create a master AI model first.');
      return;
    }

    setTestLoading(true);
    setError('');
    setTestResult('');

    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${model.huggingFaceModel}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: testPrompt,
          parameters: {
            max_new_tokens: masterModelConfig.maxLength,
            temperature: masterModelConfig.temperature,
            top_p: masterModelConfig.topP,
            repetition_penalty: masterModelConfig.repetitionPenalty,
            return_full_text: false
          }
        })
      });

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Model is loading. Please try again in a few moments.');
        } else if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Hugging Face token.');
        } else {
          throw new Error(`API Error: ${response.status}`);
        }
      }

      const result = await response.json();
      
      if (Array.isArray(result) && result[0]?.generated_text) {
        setTestResult(result[0].generated_text);
        setSuccess('Model test completed successfully!');
      } else if (result.error) {
        throw new Error(result.error);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error: any) {
      console.error('Error testing model:', error);
      setError(error.message || 'Failed to test model');
    } finally {
      setTestLoading(false);
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
        <h2 className="text-xl font-bold text-white mb-6">Hugging Face AI Configuration</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Input
              label="Hugging Face API Key"
              type="password"
              value={huggingFaceKey}
              onChange={(e) => setHuggingFaceKey(e.target.value)}
              placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            
            <Input
              label="Model Name"
              value={masterModelConfig.baseModel}
              onChange={(e) => setMasterModelConfig(prev => ({ ...prev, baseModel: e.target.value }))}
              placeholder="meta-llama/Llama-3.1-8B-Instruct"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Max Tokens"
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
                disabled={!huggingFaceKey || createLoading}
                leftIcon={createLoading ? <Loader2 size={18} className="animate-spin" /> : <Brain size={18} />}
                className="w-full"
              >
                {createLoading ? 'Creating...' : 'Create Master AI Model'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Test Interface */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-6">Test AI Model</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Test Prompt</label>
            <textarea
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Enter a prompt to test the AI model..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24"
            />
          </div>
          
          {testResult && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">AI Response</label>
              <div className="bg-slate-800 border border-slate-700 rounded-md p-4">
                <p className="text-white whitespace-pre-wrap">{testResult}</p>
              </div>
            </div>
          )}
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
                    disabled={trainLoading === model.id}
                    leftIcon={trainLoading === model.id ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                  >
                    {trainLoading === model.id ? 'Training...' : 'Train'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestModel(model.id)}
                    disabled={model.status !== 'ready' || testLoading}
                    leftIcon={testLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  >
                    {testLoading ? 'Testing...' : 'Test'}
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
                  <span className="ml-2 text-white font-medium">{model.accuracy.toFixed(1)}%</span>
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
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-6 mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Setup Instructions</h2>
        <div className="space-y-4 text-slate-300">
          <div>
            <h3 className="font-semibold text-white mb-2">1. Get Hugging Face API Key</h3>
            <p>Visit <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">huggingface.co/settings/tokens</a> and create a new token with "Read" permissions.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-2">2. Access Llama Model</h3>
            <p>Visit <a href="https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">the Llama model page</a> and accept the license agreement if required.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-2">3. Configure Model</h3>
            <p>Enter your API key above and click "Create Master AI Model" to set up the integration.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-2">4. Test the Model</h3>
            <p>Use the test interface to verify the model is working correctly with your prompts.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AISystemPage;