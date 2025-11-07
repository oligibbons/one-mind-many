// src/components/game/MovementOverlay.tsx

import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth';
import { BoardSpace } from '../../types/game';
import clsx from 'clsx'; // <-- THIS IS THE MISSING IMPORT
import { motion } from 'framer-motion'; // Import motion

export const MovementOverlay: React.FC = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  
  // Get new state variables
  const {
    isAwaitingMove,
    actingPlayerId,
    actingUsername,
    validMoves,
    gameId,
    boardSize, 
    clearAwaitingMove,
  } = useGameStore((state) => ({
    isAwaitingMove: state.isAwaitingMove,
    actingPlayerId: state.actingPlayerId,
    actingUsername: state.actingUsername,
    validMoves: state.validMoves,
    gameId: state.publicState?.id,
    boardSize: state.publicState?.scenario.boardSize || { x: 12, y: 12 },
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
  for (let y = 1; y <= boardSize.y; y++) {
    for (let x = 1; x <= boardSize.x; x++) {
      const isMe = isMyTurnToMove;
      const isValid = validMoveMap.has(`${x},${y}`);

      cells.push(
        <div
          key={`${x}-${y}`}
          className={clsx( // <-- This is where 'clsx' is used
            'flex h-full w-full items-center justify-center',
            isMe && isValid &&
              'cursor-pointer bg-orange-500/50 transition-all hover:bg-orange-400/70',
            isMe && isValid && 'z-20',
            !isMe && 'z-10 bg-black/50 backdrop-blur-sm' // Overlay for other players
          )}
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

  return (
    <div
      className={clsx( // <-- This is where 'clsx' is used
        'game-board absolute inset-0 z-10', // Sits on top of GameBoard
        !isMyTurnToMove && 'pointer-events-none' // Non-actors can't click
      )}
    >
      {/* Feedback Text */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900 border-2 border-orange-500 shadow-lg text-white p-4 rounded-lg z-30"
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