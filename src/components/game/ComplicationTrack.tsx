// src/components/game/ComplicationTrack.tsx

import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { ActiveComplication } from '../../types/game';
import { AlertTriangle, Clock } from 'lucide-react';
import clsx from 'clsx';

const MAX_COMPLICATIONS = 3; // From your GDD

const ComplicationCard: React.FC<{ comp: ActiveComplication }> = ({ comp }) => {
  return (
    <div
      className="flex h-10 w-48 items-center space-x-2 rounded-md border border-red-700 bg-red-900/40 p-2 shadow-inner"
      title={comp.effect}
    >
      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-400" />
      <div className="overflow-hidden">
        <p className="truncate text-xs font-bold text-red-300">{comp.name}</p>
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3 text-red-400/70" />
          <p className="text-xs text-red-400/70">
            {comp.duration === -1
              ? 'Permanent'
              : `${comp.duration} rounds left`}
          </p>
        </div>
      </div>
    </div>
  );
};

const EmptySlot: React.FC<{ index: number }> = ({ index }) => (
  <div
    className="flex h-10 w-48 items-center justify-center rounded-md border-2 border-dashed border-gray-700 bg-gray-900/50"
    title={`Complication Slot ${index + 1}`}
  >
    <span className="text-xs text-gray-600">Empty</span>
  </div>
);

export const ComplicationTrack: React.FC = () => {
  const { activeComplications } = useGameStore((state) => ({
    activeComplications: state.publicState?.activeComplications,
  }));

  const slots = [];
  for (let i = 0; i < MAX_COMPLICATIONS; i++) {
    if (activeComplications && activeComplications[i]) {
      slots.push(
        <ComplicationCard
          key={activeComplications[i].id}
          comp={activeComplications[i]}
        />
      );
    } else {
      slots.push(<EmptySlot key={i} index={i} />);
    }
  }

  return (
    <div className="flex items-center space-x-2 rounded-lg bg-gray-900/50 p-2">
      <h4 className="mr-2 text-sm font-bold text-gray-400">COMPLICATIONS:</h4>
      <div className="flex space-x-2">{slots}</div>
    </div>
  );
};