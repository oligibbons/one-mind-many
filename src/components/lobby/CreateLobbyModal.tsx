// src/components/lobby/CreateLobbyModal.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Switch, Label } from '../ui/Switch';
import { AlertCircle } from 'lucide-react';

interface CreateLobbyModalProps {
  onClose: () => void;
}

export const CreateLobbyModal: React.FC<CreateLobbyModalProps> = ({ onClose }) => {
  const [lobbyName, setLobbyName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { socket } = useSocket();
  const navigate = useNavigate();

  const handleCreateLobby = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || isLoading || !lobbyName) {
      if (!lobbyName) setError('Lobby name is required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Emit 'lobby:create' and wait for a callback from the server
    socket.emit(
      'lobby:create',
      { name: lobbyName, isPublic },
      (response: { status: 'ok'; lobbyId: string } | { status: 'error'; message: string }) => {
        setIsLoading(false);
        if (response.status === 'ok') {
          onClose(); // Close the modal
          navigate(`/app/lobby/${response.lobbyId}`); // Navigate to the new lobby
        } else {
          setError(response.message);
        }
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <Card
        className="game-card deep-shadow w-full max-w-md slide-in-up"
        onClick={(e) => e.stopPropagation()} // Prevent modal close when clicking inside
      >
        <form onSubmit={handleCreateLobby}>
          <CardHeader>
            <CardTitle className="text-3xl game-title">Create New Lobby</CardTitle>
            <CardDescription className="text-gray-300">
              Configure and launch your new game.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="lobby-name" className="text-lg">Lobby Name</Label>
              <Input
                id="lobby-name"
                value={lobbyName}
                onChange={(e) => setLobbyName(e.target.value)}
                placeholder="e.g., 'The Heretic's Folly'"
                maxLength={50}
                className="text-lg"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-700 p-4">
              <div className="space-y-1">
                <Label htmlFor="public-toggle" className="text-lg">
                  Public Lobby
                </Label>
                <p className="text-sm text-gray-400">
                  {isPublic
                    ? 'Visible to all players in the lobby list.'
                    : 'Only joinable via invite or lobby code.'}
                </p>
              </div>
              <Switch
                id="public-toggle"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                aria-label="Toggle lobby visibility"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-red-700 bg-red-900/30 p-3 text-red-300">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              className="btn-outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="game-button min-w-[120px]"
              disabled={isLoading || !lobbyName}
            >
              {isLoading ? <div className="spinner-small" /> : 'Create'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      {/* Add spinner animation to your global CSS if you don't have one */}
      <style>{`
        @keyframes spinner {
          to { transform: rotate(360deg); }
        }
        .spinner-small {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid rgba(245, 229, 195, 0.3);
          border-top-color: #F5E5C3;
          animation: spinner 0.6s linear infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        .slide-in-up { animation: slideInUp 0.3s ease-out; }
      `}</style>
    </div>
  );
};