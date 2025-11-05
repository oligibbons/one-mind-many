// src/components/game/PriorityTrack.tsx

import React from 'react';
import { PublicPlayerState, PrioritySlot } from '../../types/game';
import clsx from 'clsx';
import { Check, Hourglass, X } from 'lucide-react'; // <-- NEW: Added X icon

interface PriorityTrackProps {
  track: PrioritySlot[];
  players: PublicPlayerState[];
}

export const PriorityTrack: React.FC<PriorityTrackProps> = ({
  track,
  players,
}) => {
  // Create a quick lookup map for player status
  const playerStatus = new Map<string, { submitted: boolean, disconnected: boolean }>();
  players.forEach((p) => {
    playerStatus.set(p.userId, { submitted: p.submittedAction, disconnected: p.is_disconnected });
  });

  return (
    <div className="flex items-center space-x-2 rounded-lg bg-gray-900/50 p-2">
      <h4 className="mr-2 text-sm font-bold text-gray-400">PRIORITY:</h4>
      {track.map((slot, index) => {
        const status = playerStatus.get(slot.playerId);
        const hasSubmitted = status?.submitted || false;
        const isDisconnected = status?.disconnected || false; // <-- NEW
        const isFirst = index === 0;

        return (
          <div
            key={slot.identity}
            className={clsx(
              'flex h-10 w-24 items-center justify-between rounded-md border-2 p-2 shadow-inner transition-all',
              isFirst && !isDisconnected && 'border-orange-500 bg-orange-900/30',
              !isFirst && !isDisconnected && 'border-gray-700 bg-gray-800',
              isDisconnected && 'border-gray-800 bg-gray-900 opacity-50' // <-- NEW: Disconnected style
            )}
            title={
              isDisconnected ? `${slot.identity} (Disconnected)` :
              isFirst ? `Current Acting Priority: ${slot.identity}` : `Priority: ${slot.identity}`
            }
          >
            <span className="text-xs font-bold text-gray-300">
              {slot.identity}
            </span>
            <div
              className={clsx(
                'flex h-5 w-5 items-center justify-center rounded-full',
                isDisconnected ? 'bg-red-800 text-red-300' :
                hasSubmitted ? 'bg-green-500 text-gray-900' : 'bg-gray-700 text-gray-400'
              )}
              title={
                isDisconnected ? 'Disconnected' :
                hasSubmitted ? 'Action Submitted' : 'Waiting for Action'
              }
            >
              {isDisconnected ? (
                <X size={14} /> // <-- NEW
              ) : hasSubmitted ? (
                <Check size={14} />
              ) : (
                <Hourglass size={12} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};