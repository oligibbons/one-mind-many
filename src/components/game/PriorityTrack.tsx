// src/components/game/PriorityTrack.tsx

import React from 'react';
import { Player, PlayerIdentity } from '../../types/game';
import { ShieldCheck, ShieldAlert, ShieldQuestion, User, Check, Hourglass } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import clsx from 'clsx';

interface PriorityTrackProps {
  players: Player[];
  track: PlayerIdentity[];
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'True Believer': return ShieldCheck;
    case 'Heretic': return ShieldAlert;
    case 'Opportunist': return ShieldQuestion;
    default: return User;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'True Believer': return 'text-green-400';
    case 'Heretic': return 'text-red-400';
    case 'Opportunist': return 'text-blue-400';
    default: return 'text-gray-400';
  }
};

export const PriorityTrack: React.FC<PriorityTrackProps> = ({ players, track }) => {
  const { publicState } = useGameStore();
  const currentActionIndex = publicState?.currentActionIndex ?? 0;

  // --- FIX: Added scrolling container ---
  // This allows the track to shrink on mobile without breaking the layout.
  // The 'no-scrollbar' classes hide the visual scrollbar but keep functionality.
  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <div className="flex w-full min-w-max items-center justify-center space-x-2">
        {track.map((identity, index) => {
          const player = players.find(p => p.identity === identity.id);
          const isSubmitted = player?.submitted_action;
          const isActive = index === currentActionIndex;
          
          let status: 'pending' | 'submitted' | 'active' = 'pending';
          if (isActive) {
            status = 'active';
          } else if (isSubmitted) {
            status = 'submitted';
          }

          return (
            <div
              key={identity.id}
              className={clsx(
                'flex h-10 w-28 flex-shrink-0 items-center justify-between rounded-md border-2 p-3 shadow-inner',
                status === 'active' && 'border-orange-500 bg-orange-900/30',
                status !== 'active' && 'border-gray-700 bg-gray-800',
                status === 'pending' && 'opacity-60'
              )}
            >
              <span className="text-sm font-bold text-gray-300">{identity.name}</span>
              <div
                className={clsx(
                  'flex h-6 w-6 items-center justify-center rounded-full',
                  status === 'submitted' && 'bg-green-500 text-gray-900',
                  status === 'pending' && 'bg-gray-700 text-gray-400',
                  status === 'active' && 'bg-orange-400 text-gray-900'
                )}
              >
                {status === 'submitted' && <Check size={16} />}
                {status === 'pending' && <Hourglass size={14} />}
                {status === 'active' && <User size={16} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};