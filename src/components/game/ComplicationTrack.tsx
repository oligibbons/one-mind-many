// src/components/game/ComplicationTrack.tsx

import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { AlertTriangle, Timer } from 'lucide-react';
import clsx from 'clsx';

export const ComplicationTrack: React.FC = () => {
  const { complications } = useGameStore((state) => ({
    complications: state.publicState?.activeComplications,
  }));

  return (
    <div className="flex h-10 items-center space-x-2 rounded-lg bg-gray-900/50 p-2">
      <h4 className="mr-2 text-sm font-bold text-red-400">COMPLICATIONS:</h4>
      
      {(!complications || complications.length === 0) && (
        <span className="text-sm text-gray-500">All clear... for now.</span>
      )}

      {complications && complications.map((comp) => (
        <div
          key={comp.id}
          className={clsx(
            'flex h-8 items-center space-x-2 rounded-md border border-red-700 bg-red-900/30 p-2',
            comp.duration === -1 && 'border-red-400' // Permanent
          )}
          title={comp.effect}
        >
          <AlertTriangle size={14} className="text-red-400" />
          <span className="text-xs font-semibold text-gray-200">
            {comp.name}
          </span>
          {comp.duration > 0 && (
            <div className="flex items-center text-xs text-gray-400">
              <Timer size={12} className="mr-1" />
              {comp.duration}
            </div>
          )}
          {comp.duration === -1 && (
            <span className="text-xs font-bold text-red-400">PERM</span>
          )}
        </div>
      ))}

      {/* Fill empty slots */}
      {complications && Array(Math.max(0, 3 - complications.length)).fill(0).map((_, i) => (
         <div key={i} className="h-8 w-24 rounded-md border border-dashed border-gray-700 bg-gray-800/50" />
      ))}
    </div>
  );
};