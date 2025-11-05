// src/pages/admin/ScenarioManagementPage.tsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ArrowLeft, Edit, Plus, Eye, EyeOff } from 'lucide-react';
import { Scenario } from '../../types/game'; // Make sure this is imported

type ScenarioListItem = Pick<Scenario, 'id' | 'name' | 'is_published' | 'created_at'>;

export const ScenarioManagementPage: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // --- Socket Listeners ---
    const onScenarioList = (list: ScenarioListItem[]) => {
      setScenarios(list);
      setLoading(false);
    };

    const onListUpdated = () => {
      setLoading(true);
      socket.emit('admin:get_scenario_list');
    };

    socket.on('admin:scenario_list', onScenarioList);
    socket.on('admin:scenario_list_updated', onListUpdated); // Real-time update

    // --- Initial Fetch ---
    socket.emit('admin:get_scenario_list');

    return () => {
      socket.off('admin:scenario_list', onScenarioList);
      socket.off('admin:scenario_list_updated', onListUpdated);
    };
  }, [socket, isConnected]);

  return (
    <div className="mx-auto w-full max-w-4xl p-8">
      <Button as={Link} to="/admin" variant="outline" className="mb-6">
        <ArrowLeft size={16} className="mr-2" />
        Back to Admin
      </Button>

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-white">Scenario Management</h1>
        <Button as={Link} to="/admin/scenario/new">
          <Plus size={16} className="mr-2" />
          Create New Scenario
        </Button>
      </div>
      
      <Card className="border-gray-700 bg-gray-800 text-gray-200">
        <CardHeader>
          <CardTitle className="text-orange-400">All Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <LoadingSpinner />}
          {!loading && (
            <div className="space-y-3">
              {scenarios.length === 0 && <p>No scenarios found.</p>}
              {scenarios.map((scenario) => (
                <div 
                  key={scenario.id} 
                  className="flex items-center justify-between rounded-lg bg-gray-700/50 p-3"
                >
                  <div className="flex items-center">
                    {scenario.is_published ? (
                      <Eye size={18} className="mr-3 text-green-400" title="Published" />
                    ) : (
                      <EyeOff size={18} className="mr-3 text-gray-500" title="Draft" />
                    )}
                    <div>
                      <p className="font-bold text-gray-100">{scenario.name}</p>
                      <p className="text-xs text-gray-400">ID: {scenario.id}</p>
                    </div>
                  </div>
                  <Button as={Link} to={`/admin/scenario/${scenario.id}`} variant="secondary" size="sm">
                    <Edit size={14} className="mr-2" />
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};