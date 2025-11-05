// src/components/lobby/ScenarioSelectionModal.tsx

import React, { useEffect, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { supabase } from '../../lib/supabaseClient'; // Use your existing Supabase client
import { Scenario } from '../../types/game';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { AlertCircle, Check, Shield } from 'lucide-react';
import clsx from 'clsx';

type ScenarioData = Pick<Scenario, 'id' | 'name' | 'description'>;

interface ScenarioSelectionModalProps {
  gameId: string;
  currentScenarioId: string;
  onClose: () => void;
}

export const ScenarioSelectionModal: React.FC<ScenarioSelectionModalProps> = ({
  gameId,
  currentScenarioId,
  onClose,
}) => {
  const [scenarios, setScenarios] = useState<ScenarioData[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(currentScenarioId);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchScenarios = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('scenarios')
        .select('id, name, description')
        .eq('is_published', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching scenarios:', error);
        setError('Failed to load scenarios.');
      } else {
        setScenarios(data as ScenarioData[]);
      }
      setIsLoading(false);
    };

    fetchScenarios();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || isSubmitting || selectedScenarioId === currentScenarioId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    socket.emit(
      'lobby:set_scenario',
      { gameId, scenarioId: selectedScenarioId },
      (response: { status: 'ok' } | { status: 'error'; message: string }) => {
        setIsSubmitting(false);
        if (response.status === 'ok') {
          onClose(); // Success! Close the modal
        } else {
          setError(response.message);
        }
      },
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-red-400">
          <AlertCircle className="h-8 w-8" />
          <p>{error}</p>
        </div>
      );
    }

    return (
      <div className="max-h-96 space-y-3 overflow-y-auto custom-scrollbar pr-2">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            onClick={() => setSelectedScenarioId(scenario.id)}
            className={clsx(
              'rounded-lg border-2 p-4 cursor-pointer transition-all',
              selectedScenarioId === scenario.id
                ? 'border-brand-orange bg-brand-orange/10'
                : 'border-gray-700 bg-brand-navy/30 hover:bg-brand-navy/60',
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-brand-cream">{scenario.name}</h3>
              {selectedScenarioId === scenario.id && (
                <Check className="h-6 w-6 text-brand-orange" />
              )}
            </div>
            <p className="text-sm text-gray-400">{scenario.description}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <Card
        className="game-card deep-shadow w-full max-w-2xl slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-3xl game-title">Select Scenario</CardTitle>
            <CardDescription className="text-gray-300">
              Choose the game mode for this lobby.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              className="btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="game-button min-w-[120px]"
              disabled={isSubmitting || isLoading || selectedScenarioId === currentScenarioId}
            >
              {isSubmitting ? <div className="spinner-small" /> : 'Confirm'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};