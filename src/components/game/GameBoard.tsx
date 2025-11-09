// src/components/game/GameBoard.tsx

import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { BoardSpace, Location, GameObject, NPC } from '../../types/game';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Home, MapPin, ToyBrick, UserCircle, User } from 'lucide-react'; // <-- Added User

const getGridSpace = (x: number, y: number, boardSize: number): BoardSpace => {
  return { x, y };
};

export const GameBoard: React.FC = () => {
  const {
    harbingerLocation,
    boardSize,
    locations,
    objects,
    npcs,
    stalkerLocation,
    boardModifiers,
  } = useGameStore((state) => ({
    // --- FIX: Use correct snake_case properties from state ---
    harbingerLocation: state.publicState.harbinger_position,
    boardSize: state.scenario.board_size_x, // Assuming x and y are the same
    locations: state.scenario.locations,
    objects: state.publicState.game_objects,
    npcs: state.publicState.npcs,
    stalkerLocation: state.publicState.stalker_position,
    boardModifiers: state.publicState.board_modifiers,
  }));

  const gridSpaces = React.useMemo(() => {
    const spaces: BoardSpace[] = [];
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        spaces.push(getGridSpace(x, y, boardSize));
      }
    }
    return spaces;
  }, [boardSize]);

  const findLocation = (space: BoardSpace) =>
    locations.find((loc) => loc.position.x === space.x && loc.position.y === space.y);

  const findObject = (space: BoardSpace) =>
    objects.find((obj) => obj.position.x === space.x && obj.position.y === space.y);

  const findNpc = (space: BoardSpace) =>
    npcs.find((npc) => npc.position.x === space.x && npc.position.y === space.y);

  // This check is now safe, as harbingerLocation is guaranteed
  if (!harbingerLocation) {
    return null; // or a loading state
  }

  return (
    <div
      className={clsx(
        'game-board aspect-square w-auto h-auto max-w-full max-h-full', // <-- FIX: Responsive layout
        'mx-auto bg-gray-800/50 border-2 border-gray-700 rounded-lg overflow-hidden shadow-xl'
      )}
      style={{
        gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
        gridTemplateRows: `repeat(${boardSize}, 1fr)`,
      }}
    >
      {gridSpaces.map((space) => {
        const location = findLocation(space);
        const object = findObject(space);
        const npc = findNpc(space);
        const isHarbinger = harbingerLocation.x === space.x && harbingerLocation.y === space.y;
        const isStalker = stalkerLocation && stalkerLocation.x === space.x && stalkerLocation.y === space.y;

        return (
          <div
            key={`${space.x}-${space.y}`}
            className="relative w-full h-full border border-gray-700/50"
          >
            {/* Base Tile */}
            <div className="absolute inset-0 w-full h-full" />

            {/* Location */}
            {location && (
              <div className="absolute inset-0 flex items-center justify-center opacity-30" title={location.name}>
                <MapPin className="w-1/2 h-1/2 text-blue-400" />
              </div>
            )}

            {/* Object */}
            {object && (
              <div className="absolute inset-0 flex items-center justify-center opacity-70" title={object.name}>
                <ToyBrick className="w-1/2 h-1/2 text-green-400" />
              </div>
            )}

            {/* NPC */}
            {npc && (
              <div className="absolute inset-0 flex items-center justify-center opacity-70" title={npc.name}>
                <UserCircle className="w-1/2 h-1/2 text-purple-400" />
              </div>
            )}

            {/* Harbinger */}
            {isHarbinger && (
              <motion.div
                layoutId="harbinger"
                className="absolute inset-0 z-10 flex items-center justify-center"
                initial={false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="w-3/4 h-3/4 rounded-full bg-orange-500 shadow-lg flex items-center justify-center">
                  <Home className="w-1/2 h-1/2 text-white" />
                </div>
              </motion.div>
            )}

            {/* Stalker */}
            {isStalker && (
              <motion.div
                layoutId="stalker"
                className="absolute inset-0 z-20 flex items-center justify-center"
                initial={false}
                animate={{ scale: 1, opacity: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="w-2/3 h-2/3 rounded-full bg-red-700 shadow-lg flex items-center justify-center ring-2 ring-red-500">
                  <User className="w-1/2 h-1/2 text-white" />
                </div>
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
};