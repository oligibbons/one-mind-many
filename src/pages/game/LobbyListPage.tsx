// src/pages/game/LobbyListPage.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input'; // <-- NEW IMPORT
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { CreateLobbyModal } from '../../components/lobby/CreateLobbyModal'; // <-- NEW IMPORT
import { Users, Lock, LogIn } from 'lucide-react'; // <-- NEW ICONS

// Define the shape of a lobby object we expect from the server
interface LobbyPlayer {
  user_id: string;
  username: string;
}
interface Lobby {
  id: string;
  name: string; // <-- NEW
  host_id: string;
  scenario_name: string; // <-- NEW
  game_players: LobbyPlayer[];
}

const LobbyListPage: React.FC = () => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { user, profile } = useAuth();
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // <-- NEW
  const [lobbyCode, setLobbyCode] = useState(''); // <-- NEW
  const [joinError, setJoinError] = useState<string | null>(null); // <-- NEW

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
    
    // --- NEW: Handle errors from server ---
    const onLobbyError = (data: { message: string }) => {
      setJoinError(data.message);
      setIsLoading(false);
    };

    socket.on('lobby:list', onLobbyList);
    socket.on('lobby:joined', onLobbyJoined);
    socket.on('error:lobby', onLobbyError); // <-- NEW

    // --- Initial Fetch ---
    // Ask the server for the list of lobbies when component mounts
    socket.emit('lobby:get_list');

    // Cleanup
    return () => {
      socket.off('lobby:list', onLobbyList);
      socket.off('lobby:joined', onLobbyJoined);
      socket.off('error:lobby', onLobbyError); // <-- NEW
    };
  }, [socket, isConnected, navigate]);

  const handleJoinLobby = (gameId: string) => {
    if (!socket || !user || !profile) return;
    setJoinError(null);
    socket.emit('lobby:join', {
      gameId,
      userId: user.id,
      username: profile.username || 'AnonPlayer',
    });
  };

  // --- NEW: Handle joining a private lobby by code ---
  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !user || !profile || !lobbyCode) return;
    
    setJoinError(null);
    setIsLoading(true);
    
    socket.emit('lobby:join_private', {
      lobbyCode: lobbyCode.toUpperCase(),
      userId: user.id,
      username: profile.username || 'AnonPlayer',
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
      {/* --- NEW: Create Lobby Modal --- */}
      {isCreateModalOpen && (
        <CreateLobbyModal onClose={() => setIsCreateModalOpen(false)} />
      )}

      <div className="mx-auto w-full max-w-4xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-5xl font-bold game-title">Find a Game</h1>
          <Button
            className="game-button btn-lg"
            onClick={() => setIsCreateModalOpen(true)} // <-- NEW
          >
            Host New Game
          </Button>
        </div>

        {/* --- NEW: Join by Code --- */}
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

        {/* --- Public Lobby List --- */}
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