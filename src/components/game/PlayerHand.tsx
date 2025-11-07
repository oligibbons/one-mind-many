import React, { useState, useMemo } from 'react';
import { usePlayerContextStore } from '../../stores/usePlayerContextStore';
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
  'Reload': RefreshCw,
  'Stockpile': Package,
};

const BASE_MP: Record<string, number> = {
  'Move 1': 1,
  'Move 2': 2,
  'Move 3': 3,
};

export const PlayerHand: React.FC = () => {
  const { socket } = useSocket();
  const player = usePlayerContextStore((state) => state.player);
  
  // --- FIX: Subscribe to more store properties ---
  const { 
    submittedAction, 
    gameId, 
    activeComplications, 
    scenario 
  } = useGameStore((state) => ({
    submittedAction: state.publicState.players.find(
      (p) => p.userId === player?.userId
    )?.submittedAction,
    gameId: state.publicState.id,
    activeComplications: state.publicState.activeComplications,
    scenario: state.scenario,
  }));
  // --- END FIX ---

  const [selectedCard, setSelectedCard] = useState<CommandCard | null>(null);

  // --- FIX: Calculate dynamic MP modifier from complications ---
  const globalMoveModifier = useMemo(() => {
    if (!scenario?.complication_effects) return 0;

    let modifier = 0;
    for (const complication of activeComplications) {
      const effectData = scenario.complication_effects[complication.name];
      // Check if the effect itself is a direct MP modification
      if (effectData?.effect?.type === 'MODIFY_TURN' && effectData.effect.moveValue) {
        modifier += effectData.effect.moveValue;
      }
      // Check for triggers that apply a modifier (this logic may need expanding)
      if (effectData?.trigger?.type === 'ACTION_PLAYED') {
         // e.g. "All Move cards have -1"
         if (effectData.effect?.type === 'MODIFY_TURN' && effectData.effect.nextMoveValueModifier) {
           modifier += effectData.effect.nextMoveValueModifier;
         }
      }
    }
    return modifier;
  }, [activeComplications, scenario]);
  // --- END FIX ---

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
  
  // --- FIX: Get final MP for selected card ---
  const baseMp = selectedCard ? BASE_MP[selectedCard.name] || 0 : 0;
  const adjustedMp = baseMp > 0 ? Math.max(0, baseMp + globalMoveModifier) : 0;
  // --- END FIX ---

  return (
    <div className="flex flex-col items-center">
      {/* Player Hand Cards */}
      <div className="flex justify-center items-end space-x-2 h-48">
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
                  'game-card w-36 h-44 cursor-pointer border-2 shadow-lg',
                  isSelected
                    ? 'border-orange-400 shadow-orange-400/30'
                    : 'border-gray-700 hover:border-gray-500',
                  submittedAction && 'opacity-60 cursor-not-allowed'
                )}
              >
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-orange-400">
                      {card.name}
                    </CardTitle>
                    <Icon className="w-5 h-5 text-gray-300" />
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <p className="text-sm text-gray-300">{card.effect}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-center w-full h-16 mt-4 space-x-4">
        {/* --- FIX: Updated MP Tracker --- */}
        <div className="w-48 h-full">
          <AnimatePresence>
            {baseMp > 0 && ( // Show if a move card is selected
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={clsx(
                  "flex items-center justify-center h-full rounded-lg p-3",
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
                  <div className="text-2xl font-bold text-white">
                    {adjustedMp} MP
                    {/* Show base and modifier if they are different */}
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
        {/* --- END FIX --- */}

        {/* Lock In Button */}
        <Button
          onClick={handleSubmitAction}
          disabled={!selectedCard || submittedAction}
          className="w-64 h-full text-lg font-bold"
        >
          {submittedAction
            ? 'Action Submitted'
            : selectedCard
            ? `Lock In: ${selectedCard.name}`
            : 'Select an Action'}
        </Button>

        {/* Placeholder for symmetry */}
        <div className="w-48 h-full" />
      </div>
    </div>
  );
};