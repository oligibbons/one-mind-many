// src/components/game/InGameMenuModal.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { LogOut, BookOpen, Settings, Play, AlertTriangle } from 'lucide-react';
import { RulesReferenceModal } from './RulesReferenceModal'; // <-- NEW IMPORT

interface InGameMenuModalProps {
  onClose: () => void;
  onLeave: () => void;
}

export const InGameMenuModal: React.FC<InGameMenuModalProps> = ({ onClose, onLeave }) => {
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [showRules, setShowRules] = useState(false); // <-- THIS IS NOW USED

  const handleLeaveClick = () => {
    if (showConfirmLeave) {
      onLeave();
    } else {
      setShowConfirmLeave(true);
    }
  };

  const handleRulesClick = () => {
    setShowRules(true); // <-- THIS NOW WORKS
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      >
        <Card
          className="game-card deep-shadow w-full max-w-md slide-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          <CardHeader>
            <CardTitle className="text-3xl game-title">Menu</CardTitle>
            <CardDescription className="text-gray-300">
              {showConfirmLeave ? 'Are you sure?' : 'Game is paused'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showConfirmLeave ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-md border border-red-700 bg-red-900/30 p-4 text-red-300">
                  <AlertTriangle className="h-8 w-8 flex-shrink-0" />
                  <p>
                    Leaving the game is final. You will forfeit and cannot rejoin.
                  </p>
                </div>
                <Button
                  className="w-full btn-outline"
                  onClick={() => setShowConfirmLeave(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleLeaveClick}
                >
                  Confirm & Leave Game
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button className="w-full game-button btn-lg" onClick={onClose}>
                  <Play className="h-5 w-5 mr-2" />
                  Resume
                </Button>
                <Button className="w-full btn-secondary btn-lg" onClick={handleRulesClick}>
                  <BookOpen className="h-5 w-5 mr-2" />
                  Rules Reference
                </Button>
                <Button className="w-full btn-secondary btn-lg" disabled>
                  <Settings className="h-5 w-5 mr-2" />
                  Settings (Soon)
                </Button>
                <Button
                  className="w-full btn-outline btn-lg text-red-400 border-red-500/50 hover:bg-red-900/30 hover:border-red-500 hover:text-red-300"
                  onClick={handleLeaveClick}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Leave Game
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- NEW: Render the rules modal on top --- */}
      {showRules && (
        <RulesReferenceModal onClose={() => setShowRules(false)} />
      )}

      {/* Re-using animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        .slide-in-up { animation: slideInUp 0.3s ease-out; }
      `}</style>
    </>
  );
};