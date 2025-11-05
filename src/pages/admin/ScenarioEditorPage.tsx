// src/pages/admin/ScenarioEditorPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { api } from '../../lib/api';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Scenario } from '../../types/game';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

// A simple JSON editor (for a real app, use a library like react-json-editor-ajrm)
const JsonEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  height?: string;
}> = ({ value, onChange, height = '400px' }) => {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    try {
      JSON.parse(newValue);
      setError(null);
    } catch (err: any) {
      setError(`Invalid JSON: ${err.message}`);
    }
  };

  return (
    <div>
      <textarea
        value={value}
        onChange={handleChange}
        className={`w-full p-4 font-mono text-sm bg-brand-navy border rounded-md custom-scrollbar ${
          error ? 'border-red-500' : 'border-brand-purple'
        }`}
        style={{ height }}
        spellCheck="false"
      />
      {error && (
        <p className="mt-2 text-sm text-red-400">
          <AlertCircle className="inline h-4 w-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

export const ScenarioEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<Partial<Scenario> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScenario = async () => {
      if (!id || id === 'new') {
        // Initialize a new scenario with default structure
        setScenario({
          name: '',
          description: '',
          board_size_x: 12,
          board_size_y: 12,
          is_published: false,
          locations: [],
          main_prophecy: {},
          doomsday_condition: {},
          global_fail_condition: {},
          complication_effects: {},
          object_effects: {},
          npc_effects: {},
          opportunist_goals: [],
          sub_role_definitions: [],
        });
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await api.get(`/admin/scenario/${id}`);
        setScenario(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load scenario.');
      }
      setLoading(false);
    };
    fetchScenario();
  }, [id]);

  const handleSave = async () => {
    if (!scenario) return;

    // Basic validation
    if (!scenario.name) {
      setError('Scenario name is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (id === 'new') {
        // Create new scenario
        const response = await api.post('/admin/scenario', scenario);
        navigate(`/admin/scenarios/edit/${response.data.id}`); // Navigate to edit page of new scenario
      } else {
        // Update existing scenario
        await api.put(`/admin/scenario/${id}`, scenario);
      }
      setSaving(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save scenario.');
      setSaving(false);
    }
  };

  const handleJsonChange = (field: keyof Scenario, value: string) => {
    try {
      const parsed = JSON.parse(value);
      setScenario((prev) => (prev ? { ...prev, [field]: parsed } : null));
    } catch (e) {
      // If JSON is invalid, we don't update the state, but the editor shows the error
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: string | number | boolean = value;
    
    if (type === 'number') {
      processedValue = parseInt(value, 10) || 0;
    }

    setScenario((prev) => (prev ? { ...prev, [name]: processedValue } : null));
  };


  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <p className="p-8 text-red-400">{error}</p>;
  }

  if (!scenario) {
    return <p className="p-8 text-gray-400">No scenario data.</p>;
  }

  // Helper to safely stringify JSON fields
  const safeStringify = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return '{}';
    }
  };

  return (
    <div className="p-8">
      <Button
        variant="outline"
        className="btn-outline mb-6"
        onClick={() => navigate('/admin/scenarios')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Scenarios
      </Button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="game-title text-4xl">
          {id === 'new' ? 'Create New Scenario' : 'Edit Scenario'}
        </h1>
        <Button className="game-button" onClick={handleSave} disabled={saving}>
          {saving ? <LoadingSpinner /> : <Save className="h-4 w-4 mr-2" />}
          Save Scenario
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-700 bg-red-900/30 p-3 text-red-300">
          <AlertCircle className="h-5 w-5 inline mr-2" />
          {error}
        </div>
      )}

      <Card className="game-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Scenario Name</label>
                <Input
                  name="name"
                  value={scenario.name || ''}
                  onChange={handleInputChange}
                  className="mt-1 text-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Description</label>
                <textarea
                  name="description"
                  value={scenario.description || ''}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 font-mono text-sm bg-brand-navy border rounded-md custom-scrollbar border-brand-purple"
                  rows={5}
                />
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Board X</label>
                  <Input
                    name="board_size_x"
                    type="number"
                    value={scenario.board_size_x || 12}
                    onChange={handleInputChange}
                    className="mt-1 text-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Board Y</label>
                  <Input
                    name="board_size_y"
                    type="number"
                    value={scenario.board_size_y || 12}
                    onChange={handleInputChange}
                    className="mt-1 text-lg"
                  />
                </div>
              </div>
            </div>
            
            {/* JSON Editors */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Locations (JSON)</label>
                <JsonEditor
                  value={safeStringify(scenario.locations)}
                  onChange={(val) => handleJsonChange('locations' as keyof Scenario, val)}
                  height="200px"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Main Prophecy (JSON)</label>
                <JsonEditor
                  value={safeStringify(scenario.main_prophecy)}
                  onChange={(val) => handleJsonChange('main_prophecy' as keyof Scenario, val)}
                  height="150px"
                />
              </div>
            </div>
          </div>
          
          {/* Full-width JSON Editors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="text-sm font-medium text-gray-300">Doomsday Condition (JSON)</label>
              <JsonEditor
                value={safeStringify(scenario.doomsday_condition)}
                onChange={(val) => handleJsonChange('doomsday_condition' as keyof Scenario, val)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Global Fail Condition (JSON)</label>
              <JsonEditor
                value={safeStringify(scenario.global_fail_condition)}
                onChange={(val) => handleJsonChange('global_fail_condition' as keyof Scenario, val)}
              />
            </div>
             <div>
              <label className="text-sm font-medium text-gray-300">Complication Effects (JSON)</label>
              <JsonEditor
                value={safeStringify(scenario.complication_effects)}
                onChange={(val) => handleJsonChange('complication_effects' as keyof Scenario, val)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Object Effects (JSON)</label>
              <JsonEditor
                value={safeStringify(scenario.object_effects)}
                onChange={(val) => handleJsonChange('object_effects' as keyof Scenario, val)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">NPC Effects (JSON)</label>
              <JsonEditor
                value={safeStringify(scenario.npc_effects)}
                onChange={(val) => handleJsonChange('npc_effects' as keyof Scenario, val)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Opportunist Goals (JSON)</label>
              <JsonEditor
                value={safeStringify(scenario.opportunist_goals)}
                onChange={(val) => handleJsonChange('opportunist_goals' as keyof Scenario, val)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Sub-Role Definitions (JSON)</label>
              <JsonEditor
                value={safeStringify(scenario.sub_role_definitions)}
                onChange={(val) => handleJsonChange('sub_role_definitions' as keyof Scenario, val)}
              />
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};