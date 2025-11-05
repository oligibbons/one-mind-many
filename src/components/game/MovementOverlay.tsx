// src/components/game/MovementOverlay.tsx

import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth';
import { BoardSpace } from '../../types/game';
import clsx from 'clsx';

const BOARD_SIZE = 12;

export const MovementOverlay: React.FC = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  
  // Get the movement state from our store
  const {
    isAwaitingMove,
    actingPlayerId,
    validMoves,
    gameId,
    clearAwaitingMove,
  } = useGameStore((state) => ({
    isAwaitingMove: state.isAwaitingMove,
    actingPlayerId: state.actingPlayerId,
    validMoves: state.validMoves,
    gameId: state.publicState?.id,
    clearAwaitingMove: state.clearAwaitingMove,
  }));

  // Create a fast lookup map for valid move positions
  const validMoveMap = React.useMemo(() => {
    const map = new Set<string>();
    validMoves.forEach((pos) => map.add(`${pos.x},${pos.y}`));
    return map;
  }, [validMoves]);

  // Check if it's our turn to move
  const isMyTurnToMove = isAwaitingMove && actingPlayerId === user?.id;

  const handleCellClick = (pos: BoardSpace) => {
    if (!isMyTurnToMove || !gameId) return;

    if (validMoveMap.has(`${pos.x},${pos.y}`)) {
      console.log(`Submitting move to: ${pos.x}, ${pos.y}`);
      // Send the chosen move back to the server
      socket?.emit('action:submit_move', {
        gameId,
        position: pos,
      });
      // Clear the overlay immediately (optimistic update)
      clearAwaitingMove();
    }
  };

  if (!isAwaitingMove) {
    return null; // Don't render anything if we're not moving
  }

  const cells = [];
  for (let y = 1; y <= BOARD_SIZE; y++) {
    for (let x = 1; x <= BOARD_SIZE; x++) {
      const isMe = isMyTurnToMove;
      const isValid = validMoveMap.has(`${x},${y}`);

      cells.push(
        <div
          key={`${x}-${y}`}
          className={clsx(
            'flex h-full w-full items-center justify-center',
            isMe && isValid &&
              'cursor-pointer bg-orange-500/50 transition-all hover:bg-orange-400/70',
            isMe && isValid && 'z-20',
            !isMe && 'z-10 bg-black/50 backdrop-blur-sm' // Overlay for other players
          )}
          onClick={() => handleCellClick({ x, y })}
        >
          {isMe && isValid && (
            <div className="h-4 w-4 rounded-full bg-orange-200 shadow-lg" />
          )}
        </div>
      );
    }
  }

  return (
    <div
      className={clsx(
        'game-board absolute inset-0 z-10', // Sits on top of GameBoard
        !isMyTurnToMove && 'pointer-events-none' // Non-actors can't click
      )}
    >
      {cells}
    </div>
  );
};