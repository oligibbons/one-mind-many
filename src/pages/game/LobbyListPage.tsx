// src/pages/game/LobbyListPage.tsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { CreateLobbyModal } from '../../components/lobby/CreateLobbyModal';
import { Plus, RefreshCw, AlertTriangle, Users, ArrowRight } from 'lucide-react';
import { Lobby } from '../../types/game'; // Assuming this type is defined

// --- NEW: Define Lobby type based on schema/API ---
interface PublicLobby {
  id: string; // lobbyId
  host_username: string;
  scenario_name: string;
  player_count: number;
  max_players: number;
  lobby_code: string;
}

export const LobbyListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lobbies, setLobbies] = useState<PublicLobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- NEW: Function to fetch lobbies ---
  const fetchLobbies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This endpoint 'lobbies/public' needs to exist on your server
      // It should return an array of public lobbies with player counts.
      const response = await api.get('/lobbies/public');
      setLobbies(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch lobbies.');
      console.error('Failed to fetch lobbies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW: Fetch lobbies on component mount ---
  useEffect(() => {
    fetchLobbies();
  }, []);

  const handleLobbyCreated = (lobbyId: string) => {
    setIsModalOpen(false);
    navigate(`/lobby/${lobbyId}`);
  };

  const handleJoinLobby = (lobbyId: string) => {
    // In a real scenario, you might need to check if the lobby is full
    // or if a code is needed, but for public lobbies this is fine.
    navigate(`/lobby/${lobbyId}`);
  };

  // --- NEW: Render loading state ---
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-lg">Fetching active lobbies...</p>
    </div>
  );

  // --- NEW: Render error state ---
  const renderError = () => (
    <Card className="game-card bg-red-900/30 border-red-700 text-red-300 p-6 text-center">
      <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
      <h3 className="mt-4 text-2xl font-bold">Error Fetching Lobbies</h3>
      <p className="mt-2">{error}</p>
      <Button variant="outline" onClick={fetchLobbies} className="mt-4 btn-outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </Card>
  );

  // --- NEW: Render empty state ---
  const renderEmptyState = () => (
    <div className="text-center h-64 flex flex-col items-center justify-center">
      <Users className="h-16 w-16 text-gray-600" />
      <h3 className="mt-4 text-2xl font-bold text-white">No Public Lobbies</h3>
      <p className="mt-2 text-gray-400">
        There are no public lobbies currently active.
      </p>
      <p className="text-gray-400">
        Why not create one?
      </p>
    </div>
  );

  // --- NEW: Render lobby list ---
  const renderLobbyList = () => (
    <div className="space-y-4">
      {lobbies.length === 0 ? renderEmptyState() : (
        lobbies.map((lobby) => (
          <Card 
            key={lobby.id} 
            className="game-card flex flex-col sm:flex-row items-center justify-between p-4 transition-all hover:border-orange-400"
          >
            <div className="mb-4 sm:mb-0">
              <CardTitle className="text-xl text-white">
                {lobby.host_username}'s Game
              </CardTitle>
              <p className="text-sm text-gray-400">
                Scenario: {lobby.scenario_name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center text-gray-300">
                <Users className="mr-2 h-5 w-5" />
                <span className="font-bold">{lobby.player_count}</span>
                <span className="text-gray-400">/{lobby.max_players}</span>
              </div>
              <Button 
                variant="game" 
                onClick={() => handleJoinLobby(lobby.id)}
                className="game-button"
              >
                Join
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-5xl font-bold game-title mb-4 sm:mb-0">
          Public Lobbies
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLobbies} className="btn-outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="game-button">
            <Plus className="mr-2 h-4 w-4" />
            Create Lobby
          </Button>
        </div>
      </div>

      <Card className="game-card bg-gray-900/50 p-6">
        {isLoading ? renderLoading() : error ? renderError() : renderLobbyList()}
      </Card>

      <CreateLobbyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLobbyCreated={handleLobbyCreated}
      />
    </div>
  );
};

export default LobbyListPage;