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
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button'; // <-- FIX: Added missing import
import clsx from 'clsx'; // <-- FIX: Added missing import

export const PrivateDashboard: React.FC = () => {
  const { privateState } = useGameStore();
  const [isOpen, setIsOpen] = useState(true);

  if (!privateState) return null;

  const { secret_identity, role, sub_role, personal_goal } = privateState; // <-- FIX: Use snake_case

  // --- FIX: Added missing roleColors object ---
  const roleColors: Record<string, string> = {
    'True Believer': 'text-green-400',
    Heretic: 'text-red-400',
    Opportunist: 'text-blue-400',
    default: 'text-gray-400',
  };
  const roleColor = roleColors[role] || roleColors.default;
  // --- END FIX ---

  return (
    <Card className="border-gray-700 bg-gray-800 text-gray-200">
      <CardHeader
        className="flex flex-row items-center justify-between p-3 cursor-pointer" // <-- FIX: Made header cursor-pointer
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="text-lg text-orange-400">
          Your Secrets
        </CardTitle>
        {/* --- FIX: Simplified toggle to just be an icon --- */}
        {isOpen ? (
          <ChevronUp size={20} className="text-gray-400" />
        ) : (
          <ChevronDown size={20} className="text-gray-400" />
        )}
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-3 p-3 pt-0">
          {/* Secret Identity */}
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Secret Identity</p>
              <p className="font-bold text-gray-100">{secret_identity}</p>
            </div>
          </div>

          {/* Main Role */}
          <div className="flex items-center space-x-3">
            <Shield className={clsx('h-5 w-5 flex-shrink-0', roleColor)} />
            <div>
              <p className="text-xs text-gray-500">Main Role</p>
              <p className={clsx('font-bold', roleColor)}>
                {role}
              </p>
            </div>
          </div>

          {/* Sub-Role */}
          <div className="flex items-center space-x-3">
            <Target className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Sub-Role</p>
              <p className="font-bold text-gray-100">{sub_role}</p>
            </div>
          </div>

          {/* Personal Goal (for Opportunist) */}
          {role === 'Opportunist' && personal_goal && (
            <div className="rounded-md border border-blue-700 bg-gray-900/50 p-2">
              <p className="text-xs font-semibold text-blue-300">
                Personal Goal
              </p>
              {/* --- FIX: Improved goal display --- */}
              <p className="text-sm text-gray-200">
                {typeof personal_goal === 'object' && personal_goal.description 
                  ? personal_goal.description 
                  : JSON.stringify(personal_goal)}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};