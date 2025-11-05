// src/pages/admin/ScenarioManagementPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { AlertCircle, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

interface Scenario {
  id: string;
  name: string;
  description: string;
  is_published: boolean;
  created_at: string;
}

export const ScenarioManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScenarios = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/scenarios');
      setScenarios(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load scenarios.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  const handleTogglePublish = async (scenario: Scenario) => {
    try {
      await api.patch(`/admin/scenario/${scenario.id}/publish`, {
        is_published: !scenario.is_published,
      });
      // Refresh list to show change
      fetchScenarios();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleDelete = async (scenarioId: string, scenarioName: string) => {
    if (window.confirm(`Are you sure you want to delete "${scenarioName}"? This is permanent.`)) {
      try {
        await api.delete(`/admin/scenario/${scenarioId}`);
        fetchScenarios();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete scenario.');
      }
    }
  };

  const handleCreate = async () => {
    // This will be built in the next batch. For now, it just navigates.
    navigate('/admin/scenario/new');
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-5xl font-bold game-title">Scenario Management</h1>
        <Button className="game-button" onClick={handleCreate}>
          <Plus className="h-5 w-5 mr-2" />
          New Scenario
        </Button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-red-700 bg-red-900/30 p-3 text-red-300">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card className="game-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-brand-navy/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-400">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : scenarios.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-400">
                      No scenarios found.
                    </td>
                  </tr>
                ) : (
                  scenarios.map((scenario) => (
                    <tr key={scenario.id} className="hover:bg-brand-navy/20">
                      <td className="px-6 py-4">
                        <div className="font-medium text-brand-cream">{scenario.name}</div>
                        <div className="text-sm text-gray-400 max-w-md truncate">
                          {scenario.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {scenario.is_published ? (
                          <span className="inline-flex items-center rounded-full bg-green-900/50 px-3 py-1 text-sm font-medium text-green-300">
                            <Eye className="h-4 w-4 mr-1.5" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-700 px-3 py-1 text-sm font-medium text-gray-300">
                            <EyeOff className="h-4 w-4 mr-1.5" />
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {format(new Date(scenario.created_at), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublish(scenario)}
                          title={scenario.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {scenario.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          as={Link}
                          to={`/admin/scenario/edit/${scenario.id}`}
                          variant="ghost"
                          size="sm"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(scenario.id, scenario.name)}
                          title="Delete"
                          className="text-red-400 hover:bg-red-900/50 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};