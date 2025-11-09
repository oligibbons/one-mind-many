// src/components/lobby/CreateLobbyModal.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Select } from '../ui/Select'; // Assuming you have a Select component
import { Switch } from '../ui/Switch';
import { Label } from '../ui/Label'; // Assuming you have a Label component
import { api } from '../../lib/api';
import { X, Plus, AlertTriangle, Lock, Globe } from 'lucide-react';
import { Scenario } from '../../types/game'; // Import Scenario type
import { useToast } from '../../hooks/useToast';

interface CreateLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLobbyCreated: (lobbyId: string) => void;
}

export const CreateLobbyModal: React.FC<CreateLobbyModalProps> = ({
  isOpen,
  onClose,
  onLobbyCreated,
}) => {
  const { toast } = useToast();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- NEW: Fetch published scenarios when modal opens ---
  useEffect(() => {
    if (isOpen) {
      setIsLoadingScenarios(true);
      setError(null);
      
      const fetchScenarios = async () => {
        try {
          // This endpoint should return published scenarios
          const response = await api.get('/scenarios/published');
          setScenarios(response.data);
          // Default to the first scenario in the list
          if (response.data.length > 0) {
            setSelectedScenario(response.data[0].id);
          } else {
            setError('No published scenarios are available.');
          }
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to fetch scenarios.');
        } finally {
          setIsLoadingScenarios(false);
        }
      };
      
      fetchScenarios();
    }
  }, [isOpen]);

  // --- NEW: Handle form submission ---
  const handleSubmit = async () => {
    if (!selectedScenario) {
      setError('You must select a scenario.');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await api.post('/lobbies', {
        scenarioId: selectedScenario,
        isPublic: isPublic,
      });
      
      // Pass the new lobby ID back to the LobbyListPage
      onLobbyCreated(response.data.lobbyId);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create lobby.';
      setError(errorMessage);
      toast({ title: 'Error Creating Lobby', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="game-card w-full max-w-lg m-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl text-white">Create New Mission</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isCreating}>
            <X className="h-6 w-6" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingScenarios ? (
            <div className="flex justify-center h-32">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center text-red-400">
              <AlertTriangle className="mx-auto h-8 w-8" />
              <p className="mt-2">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Scenario Selection */}
              <div className="space-y-2">
                <Label htmlFor="scenario" className="text-lg font-semibold text-white">
                  Scenario
                </Label>
                <Select
                  id="scenario"
                  value={selectedScenario}
                  onValueChange={setSelectedScenario}
                  disabled={isCreating}
                >
                  {scenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </option>
                  ))}
                </Select>
                <p className="text-sm text-gray-400">
                  {scenarios.find(s => s.id === selectedScenario)?.description}
                </p>
              </div>

              {/* Public/Private Toggle */}
              <div className="flex items-center justify-between rounded-lg bg-gray-800/60 p-4">
                <Label htmlFor="is-public" className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isPublic ? <Globe className="h-5 w-5 text-green-400" /> : <Lock className="h-5 w-5 text-red-400" />}
                    <span className="text-lg font-semibold text-white">
                      {isPublic ? 'Public Lobby' : 'Private Lobby'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {isPublic ? 'Anyone can join from the lobby list.' : 'Only joinable via invite or lobby code.'}
                  </p>
                </Label>
                <Switch
                  id="is-public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  disabled={isCreating}
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isCreating || !selectedScenario}
                className="w-full game-button text-lg"
              >
                {isCreating ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    Create Lobby
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};