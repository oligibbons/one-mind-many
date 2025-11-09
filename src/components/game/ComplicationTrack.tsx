// src/components/game/ComplicationTrack.tsx

import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { AlertTriangle, AlertOctagon } from 'lucide-react';

export const ComplicationTrack: React.FC = () => {
  // --- NEW: Fetch active complications and scenario data ---
  const { activeComplications, scenario } = useGameStore((state) => ({
    activeComplications: state.publicState.active_complications,
    scenario: state.scenario,
  }));

  if (!activeComplications || activeComplications.length === 0) {
    return (
      <div className="flex items-center h-8 px-3 rounded-full bg-gray-800 text-sm text-gray-400">
        All Clear
      </div>
    );
  }

  // Get the full definition for the active complications
  const complicationDetails = activeComplications
    .map(c => {
      // Find the complication definition from the scenario data
      const detail = (scenario.complication_effects as any[])?.find(e => e.name === c.name);
      return {
        ...c,
        description: detail?.description || 'A mysterious complication with unknown effects.',
      };
    })
    .filter(Boolean); // Filter out any not found

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex items-center space-x-2">
        {complicationDetails.map((comp) => (
          <Tooltip key={comp.name}>
            <TooltipTrigger asChild>
              <div className="flex items-center h-8 px-3 rounded-full bg-red-900/50 border border-red-700 text-red-300 animate-pulse">
                <AlertOctagon className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">{comp.name}</span>
                {comp.duration && (
                  <span className="ml-2 text-xs">({comp.duration})</span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <h4 className="font-bold text-orange-400 mb-2">{comp.name}</h4>
              <p>{comp.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};