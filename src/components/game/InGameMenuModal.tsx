// src/components/game/InGameMenuModal.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, LogOut, BookOpen, AlertTriangle, Shield } from 'lucide-react';

interface InGameMenuModalProps {
  onClose: () => void;
  onLeave: () => void;
}

export const InGameMenuModal: React.FC<InGameMenuModalProps> = ({ onClose, onLeave }) => {
  const [confirmLeave, setConfirmLeave] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <Card className="game-card deep-shadow w-full max-w-sm slide-in-up">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <CardTitle className="text-2xl font-bold text-white">
            Pause Menu
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {confirmLeave ? (
            <div className="rounded-lg border border-red-700 bg-red-900/30 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-400 flex-shrink-0" />
                <h4 className="text-lg font-bold text-white">Are you sure?</h4>
              </div>
              <p className="text-red-200 my-2 text-sm">
                Leaving the mission is permanent. This will count as a loss.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button
                  variant="outline"
                  className="btn-outline"
                  onClick={() => setConfirmLeave(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={onLeave}
                >
                  Leave Mission
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button
                variant="game"
                className="w-full game-button"
                size="lg"
                onClick={onClose}
              >
                Continue Mission
              </Button>
              <Button
                as={Link}
                to="/how-to-play"
                target="_blank" // Open in new tab
                variant="secondary"
                className="w-full btn-secondary"
                size="lg"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                How to Play
              </Button>
              <Button
                variant="destructive"
                className="w-full bg-red-800 hover:bg-red-700"
                size="lg"
                onClick={() => setConfirmLeave(true)}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Leave Mission
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Re-using animations from your GameEndModal */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .slide-in-up { animation: slideInUp 0.4s ease-out; }
      `}</style>
    </div>
  );
};