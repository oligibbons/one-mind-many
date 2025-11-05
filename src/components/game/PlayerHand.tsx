// src/components/game/PlayerHand.tsx

import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth';
import { CommandCard } from '../../types/game';
import { Button } from '../ui/Button'; // Your existing Button component
import clsx from 'clsx'; // We just installed this

// Re-using your existing Card component for styling
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface PlayerHandProps {
  gameId: string;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({ gameId }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  // Get state from our store
  const { privateState, publicState } = useGameStore((state) => ({
    privateState: state.privateState,
    publicState: state.publicState,
  }));

  const [selectedCard, setSelectedCard] = useState<CommandCard | null>(null);

  // Find out if this player has already submitted an action
  const hasSubmitted =
    publicState?.players.find((p) => p.userId === user?.id)?.submittedAction ||
    false;

  const handleCardSelect = (card: CommandCard) => {
    if (hasSubmitted) return; // Can't change after submitting
    setSelectedCard(card);
  };

  const handleSubmitAction = () => {
    if (!socket || !user || !selectedCard || hasSubmitted) return;

    console.log(`Submitting action: ${selectedCard.name}`);
    socket.emit('action:submit', {
      gameId,
      userId: user.id,
      card: selectedCard,
    });
    // We don't clear selectedCard, so it stays highlighted as "submitted"
  };

  if (!privateState) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-lg font-semibold text-gray-200">Your Hand</h3>
        <Button
          onClick={handleSubmitAction}
          disabled={!selectedCard || hasSubmitted}
          className={clsx(
            hasSubmitted && 'bg-green-700 hover:bg-green-700',
            'min-w-[120px]'
          )}
        >
          {hasSubmitted ? 'Submitted' : 'Lock In Action'}
        </Button>
      </div>

      <div className="flex h-40 items-center justify-center space-x-4">
        {privateState.hand.length === 0 && (
          <p className="text-gray-400">Waiting for next hand...</p>
        )}
        
        {privateState.hand.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardSelect(card)}
            className={clsx(
              'transform cursor-pointer transition-all duration-200 ease-in-out',
              selectedCard?.id === card.id
                ? 'scale-105 -translate-y-4 shadow-lg shadow-orange-500/50'
                : 'hover:-translate-y-2',
              hasSubmitted && selectedCard?.id !== card.id && 'opacity-30'
            )}
          >
            <Card className="h-36 w-28 bg-gray-800 border-gray-700 shadow-md">
              <CardHeader className="p-2">
                <CardTitle className="text-sm text-orange-400">
                  {card.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <p className="text-xs text-gray-300">{card.effect}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};