// src/components/lobby/CreateLobbyModal.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Switch, Label } from '../ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { X, AlertCircle } from 'lucide-react';

interface Scenario {
  id: string;
  name: string;
}

export const CreateLobbyModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth(); // FIX: Changed from 'profile'
  
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  
  const [lobbyName, setLobbyName] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [isPublic, setIsPublic] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available scenarios on mount
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        setLoadingScenarios(true);
        // This endpoint should return a list of *published* scenarios
        const response = await api.get('/lobbies/scenarios'); 
        setScenarios(response.data);
        if (response.data.length > 0) {
          // Default to the first scenario in the list
          setSelectedScenario(response.data[0].id);
        }
      } catch (err: any) {
        setError('Failed to load scenarios.');
      }
      setLoadingScenarios(false);
    };
    fetchScenarios();
  }, []);

  // Set default lobby name
  useEffect(() => {
    // FIX: Check for user.profile
    if (user?.profile && !lobbyName) {
      setLobbyName(`${user.profile.username}'s Game`);
    }
  }, [user, lobbyName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !user || !user.profile || !selectedScenario || !lobbyName) { // FIX: Check for user.profile
      setError('Missing required information.');
      return;
    }
    
    setIsCreating(true);
    setError(null);

    // Listen for the 'lobby:joined' event one time
    socket.once('lobby:joined', (data: { gameId: string }) => {
      setIsCreating(false);
      onClose();
      navigate(`/app/lobby/${data.gameId}`);
    });

    socket.once('error:lobby', (data: { message: string }) => {
      setIsCreating(false);
      setError(data.message);
    });

    // Emit the create lobby event
    socket.emit('lobby:create', {
      hostId: user.id,
      hostUsername: user.profile.username, // FIX: Use user.profile
      lobbyName: lobbyName,
      scenarioId: selectedScenario,
      isPublic: isPublic,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold game-title">Host a New Game</h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isCreating}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-red-700 bg-red-900/30 p-3 text-red-300">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          <div>
            <Label htmlFor="lobbyName" className="text-lg font-semibold text-gray-300">
              Lobby Name
            </Label>
            <Input
              id="lobbyName"
              type="text"
              value={lobbyName}
              onChange={(e) => setLobbyName(e.target.value)}
              required
              className="mt-2 text-lg"
              disabled={isCreating}
            />
          </div>

          <div>
            <Label htmlFor="scenario" className="text-lg font-semibold text-gray-300">
              Scenario
            </Label>
            {loadingScenarios ? (
              <LoadingSpinner />
            ) : (
              <Select
                value={selectedScenario}
                onValueChange={setSelectedScenario}
                disabled={isCreating}
              >
                <SelectTrigger id="scenario" className="mt-2 text-lg">
                  <SelectValue placeholder="Select a scenario..." />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
            <div>
              <Label htmlFor="isPublic" className="text-lg font-semibold text-gray-200">
                Public Lobby
              </Label>
              <p className="text-sm text-gray-400">
                If off, your lobby will only be joinable with a code.
              </p>
            </div>
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={isCreating}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              className="btn-outline"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="game-button btn-lg"
              disabled={isCreating || loadingScenarios || !lobbyName || !selectedScenario}
            >
              {isCreating ? <LoadingSpinner /> : 'Create Lobby'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};