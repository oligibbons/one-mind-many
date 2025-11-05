// src/components/game/PrivateDashboard.tsx

import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import {
  User,
  Shield,
  Target,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'; // Your existing Card

export const PrivateDashboard: React.FC = () => {
  const { privateState } = useGameStore();
  const [isOpen, setIsOpen] = useState(true);

  if (!privateState) return null;

  const { secretIdentity, role, subRole, personalGoal } = privateState;

  // Determine role colors
  const roleColors = {
    'True Believer': 'text-green-400',
    Heretic: 'text-red-400',
    Opportunist: 'text-blue-400',
  };

  return (
    <Card className="border-gray-700 bg-gray-800 text-gray-200">
      <CardHeader
        className="flex flex-row items-center justify-between p-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="text-lg text-orange-400">
          Your Secrets
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </Button>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-3 p-3 pt-0">
          {/* Secret Identity */}
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Secret Identity</p>
              <p className="font-bold text-gray-100">{secretIdentity}</p>
            </div>
          </div>

          {/* Main Role */}
          <div className="flex items-center space-x-3">
            <Shield className={clsx('h-5 w-5', roleColors[role])} />
            <div>
              <p className="text-xs text-gray-500">Main Role</p>
              <p className={clsx('font-bold', roleColors[role])}>
                {role}
              </p>
            </div>
          </div>

          {/* Sub-Role */}
          <div className="flex items-center space-x-3">
            <Target className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Sub-Role</p>
              <p className="font-bold text-gray-100">{subRole}</p>
            </div>
          </div>

          {/* Personal Goal (for Opportunist) */}
          {role === 'Opportunist' && personalGoal && (
            <div className="rounded-md border border-gray-700 bg-gray-900/50 p-2">
              <p className="text-xs font-semibold text-blue-300">
                Personal Goal
              </p>
              <p className="text-sm text-gray-200">
                {/* This assumes a simple string goal. Update as needed. */}
                {JSON.stringify(personalGoal)}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};