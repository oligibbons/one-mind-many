// src/pages/game/GamePage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth';
import { useGameStore } from '../../stores/useGameStore';
import {
  GameState,
  PrivatePlayerState,
  BoardSpace,
  GameResults,
} from '../../types/game';

// --- Import UI Components ---
import { GameBoard } from '../../components/game/GameBoard';
import { PlayerHand } from '../../components/game/PlayerHand';
import { PriorityTrack } from '../../components/game/PriorityTrack';
import { ComplicationTrack } from '../../components/game/ComplicationTrack';
import { PrivateDashboard } from '../../components/game/PrivateDashboard';
import { ChatBox } from '../../components/game/ChatBox';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { MovementOverlay } from '../../components/game/MovementOverlay';
import { GameEndModal } from '../../components/game/GameEndModal';
import { InGameMenuModal } from '../../components/game/InGameMenuModal';
import { Button } from '../../components/ui/Button';
import { Menu } from 'lucide-react';

export const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    publicState,
    privateState,
    gameResults,
    setFullGameData,
    updatePublicState,
    updatePrivateState,
    updatePlayerSubmitted,
    updatePlayerDisconnect,
    setGameResults,
    setAwaitingMove,
    setError,
    clearGame,
  } = useGameStore();

  // --- Main Effect for Socket Listeners and Joining ---
  useEffect(() => {
    if (!socket || !isConnected || !gameId || !user) {
      return;
    }

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
      useGameStore.getState().clearAwaitingMove();
    };
    const onPrivateUpdate = (newPrivateState: PrivatePlayerState) => {
      console.log('Received game:private_update', newPrivateState);
      updatePrivateState(newPrivateState);
    };
    const onPlayerSubmitted = (data: { userId: string }) => {
      console.log('Received game:player_submitted', data.userId);
      updatePlayerSubmitted(data.userId);
    };
    const onPlayerJoined = (data: { userId: string; username: string }) => {
      console.log('Received game:player_joined', data.username);
      if (data.userId) {
        updatePlayerDisconnect(data.userId, false);
      }
    };
    const onPlayerLeft = (data: { userId: string; username: string }) => {
      console.log('Received game:player_left', data.username);
      if (data.userId) {
        updatePlayerDisconnect(data.userId, true);
      }
    };
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
    const onGameResults = (results: GameResults) => {
      console.log('Game over, results received:', results);
      setGameResults(results);
    };
    const onLobbyKicked = () => {
      alert('You have been kicked from the lobby.');
      clearGame();
      navigate('/app/lobbies');
    };
    const onLobbyClosed = () => {
      alert('The lobby has been closed by the host.');
      clearGame();
      navigate('/app/lobbies');
    };
    const onLobbyRedirect = (data: { lobbyId: string }) => {
      navigate(`/app/lobby/${data.lobbyId}`);
    };

    socket.on('game:full_state', onFullState);
    socket.on('game:state_update', onStateUpdate);
    socket.on('game:private_update', onPrivateUpdate);
    socket.on('game:player_submitted', onPlayerSubmitted);
    socket.on('game:player_joined', onPlayerJoined);
    socket.on('game:player_left', onPlayerLeft);
    socket.on('game:await_move', onAwaitingMove);
    socket.on('error:game', onGameError);
    socket.on('game:results', onGameResults);
    socket.on('lobby:kicked', onLobbyKicked);
    socket.on('lobby:closed', onLobbyClosed);
    socket.on('lobby:redirect', onLobbyRedirect);

    console.log(`Emitting game:join for game ${gameId}`);
    socket.emit('game:join', { gameId, userId: user.id });

    return () => {
      console.log('Cleaning up GamePage listeners');
      socket.off('game:full_state', onFullState);
      socket.off('game:state_update', onStateUpdate);
      socket.off('game:private_update', onPrivateUpdate);
      socket.off('game:player_submitted', onPlayerSubmitted);
      socket.off('game:player_joined', onPlayerJoined);
      socket.off('game:player_left', onPlayerLeft);
      socket.off('game:await_move', onAwaitingMove);
      socket.off('error:game', onGameError);
      socket.off('game:results', onGameResults);
      socket.off('lobby:kicked', onLobbyKicked);
      socket.off('lobby:closed', onLobbyClosed);
      socket.off('lobby:redirect', onLobbyRedirect);
      clearGame();
    };
  }, [
    socket, isConnected, gameId, user, setFullGameData, updatePublicState,
    updatePrivateState, updatePlayerSubmitted, updatePlayerDisconnect,
    setAwaitingMove, setGameResults, setError, clearGame, navigate
  ]);

  useEffect(() => {
    if (publicState?.status === 'lobby') {
      navigate(`/app/lobby/${gameId}`);
    }
  }, [publicState?.status, gameId, navigate]);

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
      {/* --- MODAL OVERLAYS --- */}
      {gameResults && <GameEndModal results={gameResults} />}
      {isMenuOpen && (
        <InGameMenuModal
          onClose={() => setIsMenuOpen(false)}
          onLeave={() => {
            clearGame();
            navigate('/app/main-menu');
          }}
        />
      )}

      {/* Top Bar: Tracks and Info */}
      <header className="flex w-full items-center justify-between border-b border-gray-700 p-2">
        <div className="font-bold text-lg">
          Round {publicState.currentRound}
        </div>
        <div className="flex-1 px-4">
          <PriorityTrack
            players={publicState.players}
            track={publicState.priorityTrack}
          />
        </div>
        <div className="flex items-center gap-4">
          <ComplicationTrack />
          <Button
            variant="outline"
            size="sm"
            className="btn-outline"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu size={18} className="mr-2" />
            Menu
          </Button>
        </div>
      </header>

      {/* Main Content: Board and Chat */}
      <main className="flex flex-1 overflow-hidden">
        {/* Game Board (Relative container) */}
        <div className="relative flex-1 p-4">
          <GameBoard />
          <MovementOverlay />
        </div>

        {/* Side Panel: Chat and Private Info */}
        <aside className="flex w-80 flex-col border-l border-gray-700 bg-gray-900">
          <div className="p-2">
            <PrivateDashboard />
          </div>
          <div className="flex-1 p-2 overflow-hidden">
            {/* --- UPDATED: ChatBox with kicking disabled --- */}
            <ChatBox gameId={gameId} allowKick={false} />
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