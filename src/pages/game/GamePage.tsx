// src/pages/game/GamePage.tsx

import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth';
import { useGameStore } from '../../stores/useGameStore';
import { GameState, PrivatePlayerState, BoardSpace } from '../../types/game';

// --- Import our REAL UI Components ---
import { GameBoard } from '../../components/game/GameBoard';
import { PlayerHand } from '../../components/game/PlayerHand';
import { PriorityTrack } from '../../components/game/PriorityTrack';
import { ComplicationTrack } from '../../components/game/ComplicationTrack';
import { PrivateDashboard } from '../../components/game/PrivateDashboard';
import { ChatBox } from '../../components/game/ChatBox';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { MovementOverlay } from '../../components/game/MovementOverlay';

export const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  // Get state and actions from our Zustand store
  const {
    publicState,
    privateState,
    setFullGameData,
    updatePublicState,
    updatePrivateState, // <-- NEW
    updatePlayerSubmitted,
    updatePlayerDisconnect, // <-- NEW
    setAwaitingMove, // <-- NEW
    setError,
    clearGame,
  } = useGameStore();

  // --- Main Effect for Socket Listeners and Joining ---
  useEffect(() => {
    if (!socket || !isConnected || !gameId || !user) {
      return;
    }

    // --- 1. Register Socket Event Listeners ---
    
    const onFullState = (data: {
      publicState: GameState;
      privateState: PrivatePlayerState;
    }) => {
      console.log('Received game:full_state', data);
      setFullGameData(data);
    };

    const onStateUpdate = (newPublicState: GameState) => {
      console.log('Received game:state_update', newPublicState);
      updatePublicState(newPublicState);
      // Clear move overlay on any state update
      useGameStore.getState().clearAwaitingMove();
    };

    // NEW: For when server sends just our private state (e.g., new hand)
    const onPrivateUpdate = (newPrivateState: PrivatePlayerState) => {
      console.log('Received game:private_update', newPrivateState);
      updatePrivateState(newPrivateState);
    };

    const onPlayerSubmitted = (data: { userId: string }) => {
      console.log('Received game:player_submitted', data.userId);
      updatePlayerSubmitted(data.userId);
    };
    
    // --- NEW: Handle player join/left for disconnect status ---
    const onPlayerJoined = (data: { userId: string, username: string }) => {
        console.log('Received game:player_joined', data.username);
        if (data.userId) { // Ensure userId is present
            updatePlayerDisconnect(data.userId, false);
        }
    };
    
    const onPlayerLeft = (data: { userId: string, username: string }) => {
        console.log('Received game:player_left', data.username);
        if (data.userId) { // Ensure userId is present
            updatePlayerDisconnect(data.userId, true);
        }
    };

    // NEW: Server is asking for movement input
    const onAwaitingMove = (data: {
      playerId: string;
      validMoves: BoardSpace[];
    }) => {
      console.log('Received game:await_move');
      setAwaitingMove(data);
    };
    
    const onGameError = (data: { message: string }) => {
      console.error('Received error:game', data.message);
      setError(data.message);
    };

    socket.on('game:full_state', onFullState);
    socket.on('game:state_update', onStateUpdate);
    socket.on('game:private_update', onPrivateUpdate); // <-- NEW
    socket.on('game:player_submitted', onPlayerSubmitted);
    socket.on('game:player_joined', onPlayerJoined); // <-- NEW
    socket.on('game:player_left', onPlayerLeft); // <-- NEW
    socket.on('game:await_move', onAwaitingMove); // <-- NEW
    socket.on('error:game', onGameError);

    // --- 2. Emit "join" event to the server ---
    console.log(`Emitting game:join for game ${gameId}`);
    socket.emit('game:join', { gameId, userId: user.id });

    // --- 3. Cleanup ---
    return () => {
      console.log('Cleaning up GamePage listeners');
      socket.off('game:full_state', onFullState);
      socket.off('game:state_update', onStateUpdate);
      socket.off('game:private_update', onPrivateUpdate); // <-- NEW
      socket.off('game:player_submitted', onPlayerSubmitted);
      socket.off('game:player_joined', onPlayerJoined); // <-- NEW
      socket.off('game:player_left', onPlayerLeft); // <-- NEW
      socket.off('game:await_move', onAwaitingMove); // <-- NEW
      socket.off('error:game', onGameError);
      
      clearGame();
    };
  }, [
    socket,
    isConnected,
    gameId,
    user,
    setFullGameData,
    updatePublicState,
    updatePrivateState, // <-- NEW
    updatePlayerSubmitted,
    updatePlayerDisconnect, // <-- NEW
    setAwaitingMove, // <-- NEW
    setError,
    clearGame,
  ]);

  if (!publicState || !privateState || !gameId) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
        <LoadingSpinner />
        <p className="ml-4 text-xl">Joining game: {gameId}...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-gray-950 text-gray-200">
      {/* Top Bar: Tracks and Info */}
      <header className="flex w-full items-center justify-between border-b border-gray-700 p-2">
        <div className="font-bold">
          One Mind, Many (Round {publicState.currentRound})
        </div>
        <div className="flex items-center space-x-4">
          <PriorityTrack
            players={publicState.players}
            track={publicState.priorityTrack}
          />
        </div>
        <div>
          <ComplicationTrack />
        </div>
      </header>

      {/* Main Content: Board and Chat */}
      <main className="flex flex-1 overflow-hidden">
        {/* Game Board (Relative container) */}
        <div className="relative flex-1 p-4"> {/* <-- MODIFIED */}
          <GameBoard />
          <MovementOverlay /> {/* <-- NEW */}
        </div>

        {/* Side Panel: Chat and Private Info */}
        <aside className="flex w-80 flex-col border-l border-gray-700 bg-gray-900">
          <div className="flex-1 p-2">
            <ChatBox gameId={gameId} />
          </div>
          <div className="border-t border-gray-700 p-2">
            <PrivateDashboard />
          </div>
        </aside>
      </main>

      {/* Bottom Bar: Player Hand */}
      <footer className="w-full border-t border-gray-700 p-4">
        <PlayerHand gameId={gameId} />
      </footer>
    </div>
  );
};