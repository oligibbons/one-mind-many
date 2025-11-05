// src/pages/game/LobbyListPage.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Users } from 'lucide-react';

// Define the shape of a lobby object we expect from the server
interface LobbyPlayer {
  user_id: string;
  username: string;
}
interface Lobby {
  id: string;
  host_id: string;
  scenario_id: string;
  game_players: LobbyPlayer[];
}

export const LobbyListPage: React.FC = () => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { user, profile } = useAuth();
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Socket Listeners ---
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Fired when the server sends us the list of lobbies
    const onLobbyList = (lobbyList: Lobby[]) => {
      setLobbies(lobbyList);
      setIsLoading(false);
    };

    // Fired when we successfully join a lobby
    const onLobbyJoined = (data: { gameId: string }) => {
      // Navigate to the lobby page
      navigate(`/lobby/${data.gameId}`);
    };

    socket.on('lobby:list', onLobbyList);
    socket.on('lobby:joined', onLobbyJoined);

    // --- Initial Fetch ---
    // Ask the server for the list of lobbies when component mounts
    socket.emit('lobby:get_list');

    // Cleanup
    return () => {
      socket.off('lobby:list', onLobbyList);
      socket.off('lobby:joined', onLobbyJoined);
    };
  }, [socket, isConnected, navigate]);

  const handleJoinLobby = (gameId: string) => {
    if (!socket || !user || !profile) return;

    socket.emit('lobby:join', {
      gameId,
      userId: user.id,
      username: profile.username || 'BOZO',
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-gray-400">
          <LoadingSpinner />
          <p className="mt-2">Searching for open games...</p>
        </div>
      );
    }

    if (lobbies.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-gray-400">
          <p>No open lobbies found.</p>
          <p className="text-sm">Why not host your own?</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {lobbies.map((lobby) => (
          <Card key={lobby.id} className="border-gray-700 bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-orange-400">
                <span>
                  Lobby #{lobby.id.substring(0, 6)}...
                </span>
                <span className="flex items-center text-sm text-gray-300">
                  <Users size={16} className="mr-2" />
                  {lobby.game_players.length} / 6
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Host</p>
                <p className="text-gray-200">
                  {lobby.game_players.find(p => p.user_id === lobby.host_id)?.username || 'Unknown'}
                </p>
              </div>
              <Button onClick={() => handleJoinLobby(lobby.id)}>
                Join
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-2xl p-8">
      <h1 className="mb-6 text-3xl font-bold text-white">Find a Game</h1>
      <Button
        onClick={() => socket?.emit('lobby:get_list')}
        variant="secondary"
        className="mb-4"
      >
        Refresh List
      </Button>
      {renderContent()}
    </div>
  );
};