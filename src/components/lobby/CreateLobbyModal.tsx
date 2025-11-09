// src/components/lobby/CreateLobbyModal.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
// --- FIX: Import your Radix-based Select components ---
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select';
// --- END FIX ---
import { Switch } from '../ui/Switch';
import { Label } from '../ui/Label';
import { api } from '../../lib/api';
import { X, Plus, AlertTriangle, Lock, Globe } from 'lucide-react';
import { Scenario } from '../../types/game';
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

  useEffect(() => {
    if (isOpen) {
      setIsLoadingScenarios(true);
      setError(null);
      
      const fetchScenarios = async () => {
        try {
          const response = await api.get('/scenarios/published');
          setScenarios(response.data);
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
              
              {/* --- FIX: Use Radix Select component --- */}
              <div className="space-y-2">
                <Label htmlFor="scenario" className="text-lg font-semibold text-white">
                  Scenario
                </Label>
                <Select
                  value={selectedScenario}
                  onValueChange={setSelectedScenario}
                  disabled={isCreating}
                >
                  <SelectTrigger id="scenario" className="w-full text-lg h-12">
                    <SelectValue placeholder="Select a scenario..." />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarios.map((scenario) => (
                      <SelectItem key={scenario.id} value={scenario.id} className="text-lg">
                        {scenario.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-400 pt-1">
                  {scenarios.find(s => s.id === selectedScenario)?.description}
                </p>
              </div>
              {/* --- END FIX --- */}

              {/* Public/Private Toggle */}
              <div className="flex items-center justify-between rounded-lg bg-gray-800/60 p-4">
                <Label htmlFor="is-public" className="space-y-1 pr-4">
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