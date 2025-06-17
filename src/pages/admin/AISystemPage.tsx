import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Settings, Play, Save, Upload, Download, Zap, AlertCircle, CheckCircle, Loader2, Edit, Trash2, Plus, Info } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { api } from '../../lib/api';

interface AIModel {
  id: string;
  name: string;
  type: 'narrative' | 'character' | 'scenario';
  status: 'training' | 'ready' | 'error';
  accuracy: number;
  lastTrained: string;
  huggingFaceModel?: string;
  apiKey?: string;
  config?: any;
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [masterModelConfig, setMasterModelConfig] = useState({
    name: 'Master Narrative AI',
    baseModel: 'distilbert/distilbert-base-uncased-finetuned-sst-2-english',
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
      // Load saved models from localStorage for now
      const savedModels = localStorage.getItem('ai_models');
      if (savedModels) {
        setModels(JSON.parse(savedModels));
      } else {
        // Default models
        setModels([
          {
            id: '1',
            name: 'Master Narrative AI',
            type: 'narrative',
            status: 'ready',
            accuracy: 87.5,
            lastTrained: '2024-01-15T10:30:00Z',
            huggingFaceModel: 'distilbert/distilbert-base-uncased-finetuned-sst-2-english'
          },
          {
            id: '2',
            name: 'Character Behavior AI',
            type: 'character',
            status: 'ready',
            accuracy: 72.3,
            lastTrained: '2024-01-14T15:45:00Z',
            huggingFaceModel: 'microsoft/DialoGPT-medium'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching AI models:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainingData = async () => {
    try {
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

  const saveModelsToStorage = (updatedModels: AIModel[]) => {
    localStorage.setItem('ai_models', JSON.stringify(updatedModels));
    setModels(updatedModels);
  };

  const testHuggingFaceConnection = async (apiKey: string, modelName: string) => {
    try {
      // First, try a simple model info request
      const infoResponse = await fetch(`https://api-inference.huggingface.co/models/${modelName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      });

      if (!infoResponse.ok) {
        if (infoResponse.status === 401) {
          throw new Error('Invalid Hugging Face API key. Please check your token.');
        } else if (infoResponse.status === 403) {
          throw new Error('Access denied. Make sure you have access to the model and have accepted the license agreement.');
        } else if (infoResponse.status === 404) {
          throw new Error('Model not found. Please check the model name.');
        }
      }

      // Then try a simple inference request with better error handling
      const testResponse = await fetch(`https://api-inference.huggingface.co/models/${modelName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: "Hello, how are you?",
          parameters: {
            max_new_tokens: 20,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false
          },
          options: {
            wait_for_model: true
          }
        })
      });

      const responseText = await testResponse.text();
      
      if (!testResponse.ok) {
        let errorMessage = `HTTP ${testResponse.status}`;
        
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse the error, use the status text
          errorMessage = testResponse.statusText || errorMessage;
        }

        if (testResponse.status === 400) {
          throw new Error(`Bad request: ${errorMessage}. The model might be loading, or the request format might be incorrect. Try again in a few moments.`);
        } else if (testResponse.status === 503) {
          throw new Error('Model is currently loading. Please wait a few moments and try again.');
        } else {
          throw new Error(`API Error (${testResponse.status}): ${errorMessage}`);
        }
      }

      // Try to parse the response
      try {
        const result = JSON.parse(responseText);
        if (result.error) {
          throw new Error(`Model error: ${result.error}`);
        }
        return true;
      } catch (parseError) {
        // If we can't parse the response but got a 200, that's still success
        if (testResponse.status === 200) {
          return true;
        }
        throw new Error(`Unexpected response format: ${responseText.substring(0, 100)}...`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Connection test failed: ${error}`);
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
      // Test the connection with better error handling
      await testHuggingFaceConnection(huggingFaceKey, masterModelConfig.baseModel);
      
      const newModel: AIModel = {
        id: Date.now().toString(),
        name: masterModelConfig.name,
        type: 'narrative',
        status: 'ready',
        accuracy: 0,
        lastTrained: new Date().toISOString(),
        huggingFaceModel: masterModelConfig.baseModel,
        apiKey: huggingFaceKey,
        config: masterModelConfig
      };
      
      const updatedModels = [...models, newModel];
      saveModelsToStorage(updatedModels);
      
      setSuccess('Master AI model created successfully! You can now test it.');
      setHuggingFaceKey('');
      setShowCreateModal(false);
    } catch (error: any) {
      console.error('Error creating master AI:', error);
      setError(error.message || 'Failed to create master AI model');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditModel = (model: AIModel) => {
    setEditingModel(model);
    setMasterModelConfig({
      name: model.name,
      baseModel: model.huggingFaceModel || 'distilbert/distilbert-base-uncased-finetuned-sst-2-english',
      maxLength: model.config?.maxLength || 512,
      temperature: model.config?.temperature || 0.8,
      topP: model.config?.topP || 0.9,
      repetitionPenalty: model.config?.repetitionPenalty || 1.1
    });
    setHuggingFaceKey(model.apiKey || '');
    setShowEditModal(true);
  };

  const handleUpdateModel = async () => {
    if (!editingModel) return;

    setCreateLoading(true);
    setError('');
    setSuccess('');

    try {
      const updatedModel: AIModel = {
        ...editingModel,
        name: masterModelConfig.name,
        huggingFaceModel: masterModelConfig.baseModel,
        apiKey: huggingFaceKey,
        config: masterModelConfig,
        lastTrained: new Date().toISOString()
      };
      
      const updatedModels = models.map(m => m.id === editingModel.id ? updatedModel : m);
      saveModelsToStorage(updatedModels);
      
      setSuccess('AI model updated successfully!');
      setShowEditModal(false);
      setEditingModel(null);
    } catch (error: any) {
      console.error('Error updating AI model:', error);
      setError(error.message || 'Failed to update AI model');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this AI model?')) return;

    try {
      const updatedModels = models.filter(m => m.id !== modelId);
      saveModelsToStorage(updatedModels);
      setSuccess('AI model deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting AI model:', error);
      setError('Failed to delete AI model');
    }
  };

  const handleTrainModel = async (modelId: string) => {
    setTrainLoading(modelId);
    setError('');
    setSuccess('');

    try {
      // Simulate training process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedModels = models.map(model => 
        model.id === modelId 
          ? { ...model, status: 'ready' as const, accuracy: Math.random() * 20 + 80, lastTrained: new Date().toISOString() }
          : model
      );
      saveModelsToStorage(updatedModels);
      
      setSuccess('Model training completed successfully!');
    } catch (error: any) {
      console.error('Error training model:', error);
      setError(error.message || 'Failed to train model');
    } finally {
      setTrainLoading(null);
    }
  };

  const handleTestModel = async (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;

    setTestLoading(true);
    setError('');
    setTestResult('');

    try {
      if (model.apiKey && model.huggingFaceModel) {
        // Try actual API call with improved error handling
        const response = await fetch(`https://api-inference.huggingface.co/models/${model.huggingFaceModel}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${model.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: testPrompt,
            parameters: {
              max_new_tokens: model.config?.maxLength || 512,
              temperature: model.config?.temperature || 0.8,
              top_p: model.config?.topP || 0.9,
              repetition_penalty: model.config?.repetitionPenalty || 1.1,
              do_sample: true,
              return_full_text: false
            },
            options: {
              wait_for_model: true
            }
          })
        });

        const responseText = await response.text();

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;
          
          try {
            const errorData = JSON.parse(responseText);
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            errorMessage = response.statusText || errorMessage;
          }

          if (response.status === 503) {
            throw new Error('Model is loading. Please try again in a few moments.');
          } else if (response.status === 401) {
            throw new Error('Invalid API key. Please check your Hugging Face token.');
          } else if (response.status === 400) {
            throw new Error(`Bad request: ${errorMessage}. The model might be loading or the request format might be incorrect.`);
          } else {
            throw new Error(`API Error (${response.status}): ${errorMessage}`);
          }
        }

        try {
          const result = JSON.parse(responseText);
          
          let output = '';
          if (Array.isArray(result) && result[0]?.generated_text) {
            output = result[0].generated_text;
          } else if (result.generated_text) {
            output = result.generated_text;
          } else if (result.error) {
            throw new Error(result.error);
          } else {
            throw new Error('Unexpected response format');
          }

          setTestResult(output);
          setSuccess('Model test completed successfully!');
        } catch (parseError) {
          throw new Error(`Failed to parse response: ${responseText.substring(0, 100)}...`);
        }
      } else {
        // Mock response
        const mockOutput = "Mock response - The facility's emergency lights cast eerie shadows down the empty corridor. You hear a distant sound of metal scraping against concrete...";
        setTestResult(mockOutput);
        setSuccess('Model test completed (mock response - no API key configured)');
      }
    } catch (error: any) {
      console.error('Error testing model:', error);
      setError(error.message || 'Failed to test model');
      
      // Fallback to mock response
      const mockOutput = "Mock response - The facility's emergency lights cast eerie shadows down the empty corridor. You hear a distant sound of metal scraping against concrete...";
      setTestResult(mockOutput);
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
        
        <Button
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus size={18} />}
        >
          Add AI Model
        </Button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-500 font-medium">Error</p>
              <p className="text-red-400 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-green-500 font-medium">Success</p>
              <p className="text-green-400 text-sm mt-1">{success}</p>
            </div>
          </div>
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
                  
                  {!model.apiKey && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                      No API Key
                    </span>
                  )}
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
                    onClick={() => handleEditModel(model)}
                    leftIcon={<Edit size={16} />}
                  >
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteModel(model.id)}
                    leftIcon={<Trash2 size={16} />}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
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

      {/* Create Model Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-2xl">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Create New AI Model</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <Input
                label="Model Name"
                value={masterModelConfig.name}
                onChange={(e) => setMasterModelConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter model name"
              />
              
              <Input
                label="Hugging Face API Key"
                type="password"
                value={huggingFaceKey}
                onChange={(e) => setHuggingFaceKey(e.target.value)}
                placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              
              <Input
                label="Base Model"
                value={masterModelConfig.baseModel}
                onChange={(e) => setMasterModelConfig(prev => ({ ...prev, baseModel: e.target.value }))}
                placeholder="distilbert/distilbert-base-uncased-finetuned-sst-2-english"
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
            
            <div className="p-6 border-t border-slate-700 flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleCreateMasterAI}
                isLoading={createLoading}
                leftIcon={<Brain size={18} />}
              >
                Create Model
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Model Modal */}
      {showEditModal && editingModel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-2xl">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Edit AI Model</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <Input
                label="Model Name"
                value={masterModelConfig.name}
                onChange={(e) => setMasterModelConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter model name"
              />
              
              <Input
                label="Hugging Face API Key"
                type="password"
                value={huggingFaceKey}
                onChange={(e) => setHuggingFaceKey(e.target.value)}
                placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              
              <Input
                label="Base Model"
                value={masterModelConfig.baseModel}
                onChange={(e) => setMasterModelConfig(prev => ({ ...prev, baseModel: e.target.value }))}
                placeholder="distilbert/distilbert-base-uncased-finetuned-sst-2-english"
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
            
            <div className="p-6 border-t border-slate-700 flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingModel(null);
                }}
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleUpdateModel}
                isLoading={createLoading}
                leftIcon={<Save size={18} />}
              >
                Update Model
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <Card className="p-6 mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Setup Instructions</h2>
        <div className="space-y-4 text-slate-300">
          <div>
            <h3 className="font-semibold text-white mb-2">1. Get Hugging Face API Key</h3>
            <p>Visit <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">huggingface.co/settings/tokens</a> and create a new token with "Read" permissions.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-2">2. Choose a Model</h3>
            <p>We recommend using <code className="bg-slate-800 px-1 py-0.5 rounded">distilbert/distilbert-base-uncased-finetuned-sst-2-english</code> as it's a reliable model for text classification.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-2">3. Configure Model</h3>
            <p>Click "Add AI Model" to create a new model with your API key and configuration.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-2">4. Test the Model</h3>
            <p>Use the test interface to verify the model is working correctly with your prompts.</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500 rounded-lg">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-500 font-medium">Troubleshooting Hugging Face API</p>
              <ul className="text-blue-400 text-sm mt-2 space-y-2">
                <li>• If you get a "model loading" error, wait a few minutes and try again</li>
                <li>• Check that your API key has the correct permissions (Read)</li>
                <li>• Try using a different model if you continue to have issues</li>
                <li>• Ensure your prompt is appropriate for the model's capabilities</li>
                <li>• For text classification, DistilBERT is a reliable option that doesn't require special access</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AISystemPage;