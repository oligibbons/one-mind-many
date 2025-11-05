// src/pages/game/MainMenuPage.tsx

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth';

export const MainMenuPage: React.FC = () => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { user, profile } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  // --- NEW: Listen for lobby creation success ---
  useEffect(() => {
    if (!socket) return;

    // Fired when the server confirms we've created/joined a lobby
    const onLobbyJoined = (data: { gameId: string }) => {
      console.log('Lobby joined, navigating to:', data.gameId);
      setIsCreating(false);
      // We got the new game ID, now navigate to the lobby page
      navigate(`/lobby/${data.gameId}`);
    };

    // Listen for the event from the server
    socket.on('lobby:joined', onLobbyJoined);

    // Cleanup
    return () => {
      socket.off('lobby:joined', onLobbyJoined);
    };
  }, [socket, navigate]);

  // --- NEW: Handle Create Lobby Button ---
  const handleCreateLobby = () => {
    if (!socket || !user || !profile || isCreating) return;

    setIsCreating(true);
    console.log('Emitting lobby:create...');

    // Send the "create lobby" request to the server
    socket.emit('lobby:create', {
      userId: user.id,
      username: profile.username || 'BOZO',
      // TODO: This scenarioId needs to be a real UUID from your 'scenarios' table
      // You'll need to manually insert the scenario in Supabase and get its ID.
      scenarioId: '00000000-0000-0000-0000-000000000001', // <-- REPLACE THIS
    });
  };

  const buttonDisabled = !isConnected || isCreating;

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <Logo className="mb-8 h-24 w-auto text-orange-500" />

        <div className="space-y-4">
          <Button
            onClick={handleCreateLobby}
            className="w-full text-lg"
            disabled={buttonDisabled}
          >
            {isCreating
              ? 'Creating Lobby...'
              : !isConnected
              ? 'Connecting...'
              : 'Host New Game'}
          </Button>

          <Button
            as={Link}
            to="/lobbies" // <-- NEW LINK
            className="w-full"
            variant="secondary"
          >
            Find Game
          </Button>

          <Button
            as={Link}
            to="/how-to-play"
            className="w-full"
            variant="secondary"
          >
            How To Play
          </Button>

          <Button
            as={Link}
            to="/friends"
            className="w-full"
            variant="secondary"
          >
            Friends
          </Button>

          <Button
            as={Link}
            to="/settings"
            className="w-full"
            variant="secondary"
          >
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
};