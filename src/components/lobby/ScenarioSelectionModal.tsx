// src/components/lobby/ScenarioSelectionModal.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { api } from '../../lib/api';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import { Scenario } from '../../types/game';
import clsx from 'clsx';

interface ScenarioSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenarioId: string) => void;
  currentScenarioId: string;
}

export const ScenarioSelectionModal: React.FC<ScenarioSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
  currentScenarioId,
}) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- NEW: Fetch scenarios when modal opens ---
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      
      const fetchScenarios = async () => {
        try {
          const response = await api.get('/scenarios/published');
          setScenarios(response.data);
          if (response.data.length === 0) {
            setError('No published scenarios are available.');
          }
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to fetch scenarios.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchScenarios();
    }
  }, [isOpen]);

  const handleSelect = (scenarioId: string) => {
    // The onSelectScenario prop is passed from LobbyPage
    // and handles emitting the socket event
    onSelectScenario(scenarioId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="game-card w-full max-w-2xl m-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl text-white">Change Scenario</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center h-48">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center text-red-400">
              <AlertTriangle className="mx-auto h-8 w-8" />
              <p className="mt-2">{error}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {scenarios.map((scenario) => {
                const isCurrent = scenario.id === currentScenarioId;
                return (
                  <Button
                    key={scenario.id}
                    variant="outline"
                    className={clsx(
                      "w-full text-left h-auto p-4 flex justify-between items-start btn-outline",
                      isCurrent && "border-orange-400 bg-orange-900/30"
                    )}
                    onClick={() => handleSelect(scenario.id)}
                    disabled={isCurrent}
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{scenario.name}</h3>
                      <p className="text-sm text-gray-400 whitespace-normal">{scenario.description}</p>
                    </div>
                    {isCurrent && (
                      <div className="flex items-center text-orange-400 ml-4">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span>Current</span>
                      </div>
                    )}
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};