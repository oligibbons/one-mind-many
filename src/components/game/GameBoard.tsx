// src/components/game/GameBoard.tsx

import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { BoardSpace, Location } from '../../types/game';
import clsx from 'clsx'; // Using this again!

// You'll want to add this to your src/index.css for the grid
/*
.game-board {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(12, 1fr);
}
*/

const BOARD_SIZE = 12; // From your GDD

const HarbingerPawn: React.FC = () => (
  <div
    className="relative z-10 h-6 w-6 transform rounded-full bg-orange-500 shadow-lg"
    title="The Harbinger"
  >
    <div className="absolute inset-0.5 z-20 rounded-full bg-orange-300 opacity-80" />
  </div>
);

interface BoardCellProps {
  x: number;
  y: number;
  isHarbinger: boolean;
  location?: Location;
}

const BoardCell: React.FC<BoardCellProps> = ({
  x,
  y,
  isHarbinger,
  location,
}) => {
  const isGoal = location?.name === 'Squalid Bench';
  const isHazard = location?.name === 'Collapsital One Bank';

  return (
    <div
      className={clsx(
        'relative flex h-full w-full items-center justify-center border border-gray-700/50',
        location && 'bg-gray-800',
        isGoal && 'bg-green-900/50 border-green-500',
        isHazard && 'bg-red-900/50 border-red-500'
      )}
      title={location ? location.name : `Space (${x}, ${y})`}
    >
      {/* Render Harbinger if on this square */}
      {isHarbinger && <HarbingerPawn />}

      {/* Render location name */}
      {location && (
        <span className="absolute bottom-1 left-1 text-[8px] font-bold text-gray-400">
          {location.name}
        </span>
      )}
    </div>
  );
};

export const GameBoard: React.FC = () => {
  const { harbingerPosition, locations } = useGameStore((state) => ({
    harbingerPosition: state.publicState?.harbingerPosition,
    locations: state.publicS ate?.scenario.locations,
  }));

  if (!harbingerPosition || !locations) {
    return <div>Loading board...</div>;
  }

  // Create a quick lookup map for locations
  const locationMap = new Map<string, Location>();
  locations.forEach((loc) => {
    locationMap.set(`${loc.position.x},${loc.position.y}`, loc);
  });

  const cells = [];
  for (let y = 1; y <= BOARD_SIZE; y++) {
    for (let x = 1; x <= BOARD_SIZE; x++) {
      const isHarbinger =
        harbingerPosition.x === x && harbingerPosition.y === y;
      const location = locationMap.get(`${x},${y}`);

      cells.push(
        <BoardCell
          key={`${x}-${y}`}
          x={x}
          y={y}
          isHarbinger={isHarbinger}
          location={location}
        />
      );
    }
  }

  return (
    <div className="h-full w-full aspect-square max-h-[calc(100vh-200px)]">
      <div className="game-board h-full w-full rounded-lg bg-gray-900 shadow-inner">
        {cells}
      </div>
    </div>
  );
};