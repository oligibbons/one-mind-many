// src/pages/game/LobbyListPage.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { CreateLobbyModal } from '../../components/lobby/CreateLobbyModal';
import { Users, Lock, LogIn } from 'lucide-react';
import { Label } from '../../components/ui/Switch'; // Added missing Label import

// Define the shape of a lobby object we expect from the server
interface LobbyPlayer {
  user_id: string;
  username: string;
}
interface Lobby {
  id: string;
  name: string;
  host_id: string;
  scenario_name: string;
  game_players: LobbyPlayer[];
}

const LobbyListPage: React.FC = () => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth(); // FIX: Removed 'profile' from here
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [lobbyCode, setLobbyCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  // --- Socket Listeners ---
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Fired when the server sends us the list of lobbies
    const onLobbyList = (lobbyList: Lobby[]) => {
      setLobbies(lobbyList);
      setIsLoading(false);
    };

    // Fired when we successfully join ANY lobby
    const onLobbyJoined = (data: { gameId: string }) => {
      // Navigate to the lobby page
      navigate(`/app/lobby/${data.gameId}`);
    };
    
    const onLobbyError = (data: { message: string }) => {
      setJoinError(data.message);
      setIsLoading(false);
    };

    socket.on('lobby:list', onLobbyList);
    socket.on('lobby:joined', onLobbyJoined);
    socket.on('error:lobby', onLobbyError);

    // --- Initial Fetch ---
    socket.emit('lobby:get_list');

    // Cleanup
    return () => {
      socket.off('lobby:list', onLobbyList);
      socket.off('lobby:joined', onLobbyJoined);
      socket.off('error:lobby', onLobbyError);
    };
  }, [socket, isConnected, navigate]);

  const handleJoinLobby = (gameId: string) => {
    if (!socket || !user || !user.profile) return; // FIX: Check user.profile
    setJoinError(null);
    socket.emit('lobby:join', {
      gameId,
      userId: user.id,
      username: user.profile.username || 'AnonPlayer', // FIX: Use user.profile
    });
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !user || !user.profile || !lobbyCode) return; // FIX: Check user.profile
    
    setJoinError(null);
    setIsLoading(true);
    
    socket.emit('lobby:join_private', {
      lobbyCode: lobbyCode.toUpperCase(),
      userId: user.id,
      username: user.profile.username || 'AnonPlayer', // FIX: Use user.profile
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
          <Card key={lobby.id} className="game-card flex flex-row items-center justify-between p-4">
            <div className="flex-1">
              <CardTitle className="text-xl text-orange-400">
                {lobby.name}
              </CardTitle>
              <div className="text-sm text-gray-300">
                Host: {lobby.game_players.find(p => p.user_id === lobby.host_id)?.username || 'Unknown'}
              </div>
              <div className="text-sm text-gray-400">
                Scenario: {lobby.scenario_name}
              </div>
            </div>
            <div className="flex flex-shrink-0 flex-col items-end gap-2 pl-4">
               <div className="flex items-center text-lg text-gray-300">
                  <Users size={18} className="mr-2" />
                  {lobby.game_players.length} / 6
                </div>
              <Button className="game-button" onClick={() => handleJoinLobby(lobby.id)}>
                Join
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <>
      {isCreateModalOpen && (
        <CreateLobbyModal onClose={() => setIsCreateModalOpen(false)} />
      )}

      <div className="mx-auto w-full max-w-4xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-5xl font-bold game-title">Find a Game</h1>
          <Button
            className="game-button btn-lg"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Host New Game
          </Button>
        </div>

        <Card className="game-card mb-8">
          <CardContent className="p-4">
            <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row gap-4">
              <Label htmlFor="lobby-code" className="sr-only">Lobby Code</Label>
              <Input
                id="lobby-code"
                value={lobbyCode}
                onChange={(e) => {
                  setLobbyCode(e.target.value);
                  setJoinError(null);
                }}
                placeholder="Enter 6-digit lobby code..."
                maxLength={6}
                className="flex-1 text-lg tracking-widest"
                style={{ textTransform: 'uppercase' }}
              />
              <Button type="submit" className="btn-secondary min-w-[150px]">
                <LogIn size={18} className="mr-2" />
                Join by Code
              </Button>
            </form>
            {joinError && (
              <p className="mt-3 text-red-400">{joinError}</p>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-white">Public Lobbies</h2>
          <Button
            onClick={() => {
              setIsLoading(true);
              socket?.emit('lobby:get_list');
            }}
            variant="outline"
            className="btn-outline"
          >
            Refresh List
          </Button>
        </div>
        {renderContent()}
      </div>
    </>
  );
};

export default LobbyListPage;