// src/components/game/MovementOverlay.tsx

import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth';
import { BoardSpace } from '../../types/game';
import clsx from 'clsx'; // <-- Corrected import
import { motion } from 'framer-motion';

export const MovementOverlay: React.FC = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  
  // --- FIX: Corrected the state selector ---
  const {
    isAwaitingMove,
    actingPlayerId,
    actingUsername,
    validMoves,
    gameId,
    boardSizeX, // <-- Use correct state properties
    boardSizeY, // <-- Use correct state properties
    clearAwaitingMove,
  } = useGameStore((state) => ({
    isAwaitingMove: state.isAwaitingMove,
    actingPlayerId: state.actingPlayerId,
    actingUsername: state.actingUsername,
    validMoves: state.validMoves,
    gameId: state.publicState?.id,
    boardSizeX: state.scenario.board_size_x || 12, // <-- Correct path
    boardSizeY: state.scenario.board_size_y || 12, // <-- Correct path
    clearAwaitingMove: state.clearAwaitingMove,
  }));
  // --- END FIX ---

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
      
      // --- FIX: Use correct socket event and payload ---
      socket?.emit('game:submit_move', {
        gameId,
        target: pos, // <-- Use 'target'
      });
      // --- END FIX ---
      
      // Clear the overlay immediately (optimistic update)
      clearAwaitingMove();
    }
  };

  if (!isAwaitingMove) {
    return null; // Don't render anything if we're not moving
  }

  const cells = [];
  // --- FIX: Use correct board size variables ---
  for (let y = 0; y < boardSizeY; y++) {
    for (let x = 0; x < boardSizeX; x++) {
      const isMe = isMyTurnToMove;
      // --- FIX: Use 0-based index for map check ---
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
          // --- FIX: Pass 0-based index position ---
          onClick={() => handleCellClick({ x, y })}
        >
          {isMe && isValid && (
            <motion.div 
              className="h-4 w-4 rounded-full bg-orange-200 shadow-lg"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            />
          )}
        </div>
      );
    }
  }
  // --- END FIX ---

  return (
    <div
      className={clsx(
        'game-board absolute inset-0 z-30', // Sits on top of GameBoard (z-30)
        !isMyTurnToMove && 'pointer-events-none' // Non-actors can't click
      )}
      // --- FIX: Apply grid styles directly ---
      style={{
        gridTemplateColumns: `repeat(${boardSizeX}, 1fr)`,
        gridTemplateRows: `repeat(${boardSizeY}, 1fr)`,
      }}
    >
      {/* Feedback Text */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900 border-2 border-orange-500 shadow-lg text-white p-4 rounded-lg z-40"
      >
        <h3 className="text-xl font-bold text-orange-400 text-center">
          {isMyTurnToMove ? "Your Move" : `Awaiting Move...`}
        </h3>
        <p className="text-center text-gray-300">
          {isMyTurnToMove
            ? "Select one of the highlighted spaces."
            : `${actingUsername} is choosing where to move.`}
        </p>
      </motion.div>
      
      {cells}
    </div>
  );
};