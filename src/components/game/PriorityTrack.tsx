// src/components/game/PriorityTrack.tsx

import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { PublicPlayerState, PrioritySlot } from '../../types/game';
import clsx from 'clsx';
import { Check, Hourglass } from 'lucide-react'; // We just installed this

interface PriorityTrackProps {
  track: PrioritySlot[];
  players: PublicPlayerState[];
}

export const PriorityTrack: React.FC<PriorityTrackProps> = ({
  track,
  players,
}) => {
  // Create a quick lookup map for player submission status
  const submissionStatus = new Map<string, boolean>();
  players.forEach((p) => {
    submissionStatus.set(p.userId, p.submittedAction);
  });

  return (
    <div className="flex items-center space-x-2 rounded-lg bg-gray-900/50 p-2">
      <h4 className="mr-2 text-sm font-bold text-gray-400">PRIORITY:</h4>
      {track.map((slot, index) => {
        const hasSubmitted = submissionStatus.get(slot.playerId) || false;
        const isFirst = index === 0;

        return (
          <div
            key={slot.identity}
            className={clsx(
              'flex h-10 w-24 items-center justify-between rounded-md border-2 p-2 shadow-inner',
              isFirst
                ? 'border-orange-500 bg-orange-900/30' // Current priority
                : 'border-gray-700 bg-gray-800'
            )}
            title={
              isFirst
                ? `Current Acting Priority: ${slot.identity}`
                : `Priority: ${slot.identity}`
            }
          >
            <span className="text-xs font-bold text-gray-300">
              {slot.identity}
            </span>
            <div
              className={clsx(
                'flex h-5 w-5 items-center justify-center rounded-full',
                hasSubmitted
                  ? 'bg-green-500 text-gray-900'
                  : 'bg-gray-700 text-gray-400'
              )}
              title={hasSubmitted ? 'Action Submitted' : 'Waiting for Action'}
            >
              {hasSubmitted ? (
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