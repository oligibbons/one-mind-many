// src/components/game/PlayerHand.tsx

import React, { useState, useMemo } from 'react';
import { useCurrentPlayerStore } from '../../stores/useCurrentPlayerStore'; // <-- FIX: Use the new store
import { useGameStore } from '../../stores/useGameStore';
import { useSocket } from '../../hooks/useSocket';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { CommandCard, CardName } from '../../types/game';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Move3d, Hand, Redo, Undo, Ban, Plus, Minus, RefreshCw, Shuffle,
  Bot, XSquare, Copy, CopyCheck, Waypoints, Package, Rocket
} from 'lucide-react';

const CARD_ICONS: Record<CardName, React.ElementType> = {
  'Move 1': Move3d,
  'Move 2': Move3d,
  'Move 3': Move3d,
  'Hesitate': Minus,
  'Charge': Plus,
  'Empower': CopyCheck,
  'Degrade': Bot,
  'Impulse': Waypoints,
  'Interact': Hand,
  'Buffer': XSquare,
  'Rethink': Undo,
  'Homage': Redo,
  'Foresight': Copy,
  'Deny': Ban,
  'Inhibit': Ban,
  'Gamble': Shuffle,
  'Hail Mary': RefreshCw,
  'Scramble': RefreshCw, // <-- FIX: Renamed 'Reload'
  'Stockpile': Package,
};

const BASE_MP: Record<string, number> = {
  'Move 1': 1,
  'Move 2': 2,
  'Move 3': 3,
};

export const PlayerHand: React.FC = () => {
  const { socket } = useSocket();
  const player = useCurrentPlayerStore((state) => state.player); // <-- FIX: Use the new store

  const { 
    submittedAction, 
    gameId, 
    activeComplications, 
    scenario 
  } = useGameStore((state) => ({
    submittedAction: state.publicState?.players.find(
      (p) => p.user_id === player?.user_id
    )?.submitted_action,
    gameId: state.publicState?.id,
    activeComplications: state.publicState?.active_complications || [],
    scenario: state.scenario,
  }));

  const [selectedCard, setSelectedCard] = useState<CommandCard | null>(null);

  const globalMoveModifier = useMemo(() => {
    if (!scenario?.complication_effects) return 0;

    let modifier = 0;
    for (const complication of activeComplications) {
      const effectData = (scenario.complication_effects as any)[complication.name];
      if (effectData?.effect?.type === 'MODIFY_TURN' && effectData.effect.moveValue) {
        modifier += effectData.effect.moveValue;
      }
      if (effectData?.trigger?.type === 'ACTION_PLAYED') {
         if (effectData.effect?.type === 'MODIFY_TURN' && effectData.effect.nextMoveValueModifier) {
           modifier += effectData.effect.nextMoveValueModifier;
         }
      }
    }
    return modifier;
  }, [activeComplications, scenario]);

  const handleSubmitAction = () => {
    if (selectedCard && socket && gameId && !submittedAction) {
      socket.emit('game:submit_action', {
        gameId: gameId,
        card: selectedCard,
      });
    }
  };

  if (!player) {
    return (
      <div className="text-center text-gray-400">Loading player hand...</div>
    );
  }
  
  const baseMp = selectedCard ? BASE_MP[selectedCard.name] || 0 : 0;
  const adjustedMp = baseMp > 0 ? Math.max(0, baseMp + globalMoveModifier) : 0;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Player Hand Cards */}
      <div className="flex w-full justify-center items-end h-48 md:h-52 overflow-x-auto overflow-y-hidden no-scrollbar px-4">
        <div className="flex min-w-max space-x-2">
          {player.hand.map((card) => {
            const Icon = CARD_ICONS[card.name] || Move3d;
            const isSelected = selectedCard?.id === card.id;

            return (
              <motion.div
                key={card.id}
                onClick={() =>
                  !submittedAction ? setSelectedCard(card) : undefined
                }
                animate={{
                  y: isSelected ? -20 : 0,
                  scale: isSelected ? 1.05 : 1,
                }}
                whileHover={{
                  y: submittedAction ? 0 : -10,
                  scale: submittedAction ? 1 : 1.05,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Card
                  className={clsx(
                    'game-card w-32 h-40 md:w-36 md:h-44 cursor-pointer border-2 shadow-lg',
                    isSelected
                      ? 'border-orange-400 shadow-orange-400/30'
                      : 'border-gray-700 hover:border-gray-500',
                    submittedAction && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <CardHeader className="p-2 md:p-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm md:text-base text-orange-400">
                        {card.name}
                      </CardTitle>
                      <Icon className="w-4 h-4 md:w-5 md:h-5 text-gray-300" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 md:p-3">
                    <p className="text-xs md:text-sm text-gray-300">{card.effect}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-lg md:max-w-2xl h-auto md:h-16 mt-4 space-y-2 md:space-y-0 md:space-x-4">
        {/* MP Tracker */}
        <div className="w-full md:w-48 h-full">
          <AnimatePresence>
            {baseMp > 0 && ( // Show if a move card is selected
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={clsx(
                  "flex items-center justify-center h-14 md:h-full rounded-lg p-3",
                  globalMoveModifier < 0 && "bg-red-900/50",
                  globalMoveModifier > 0 && "bg-green-900/50",
                  globalMoveModifier === 0 && "bg-gray-800",
                )}
              >
                <Rocket className="w-6 h-6 text-orange-400 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-400">
                    Adjusted Movement
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-white">
                    {adjustedMp} MP
                    {globalMoveModifier !== 0 && (
                      <span className="text-sm ml-1 text-gray-300">
                        ({baseMp} {globalMoveModifier > 0 ? '+' : ''}{globalMoveModifier})
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Lock In Button */}
        <Button
          onClick={handleSubmitAction}
          disabled={!selectedCard || !!submittedAction}
          className="w-full md:w-64 h-14 md:h-full text-lg font-bold game-button"
          size="lg"
        >
          {submittedAction
            ? 'Action Submitted'
            : selectedCard
            ? `Lock In: ${selectedCard.name}`
            : 'Select an Action'}
        </Button>

        {/* Placeholder for symmetry (desktop only) */}
        <div className="w-48 h-full hidden md:block" />
      </div>
    </div>
  );
};