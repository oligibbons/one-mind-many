// src/components/game/GameEndModal.tsx

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameResults, PlayerResult, PlayerRole } from '../../types/game';
import { useAuth } from '../../hooks/useAuth';
import { useGameStore } from '../../stores/useGameStore';
import { useSocket } from '../../contexts/SocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Award,
} from 'lucide-react';
import clsx from 'clsx';

interface GameEndModalProps {
  results: GameResults;
}

// Helper to get role icons and colors
const RoleInfo: React.FC<{ role: PlayerRole }> = ({ role }) => {
  const SIZES = 'h-5 w-5';
  switch (role) {
    case 'True Believer':
      return <ShieldCheck className={clsx(SIZES, 'text-green-400')} />;
    case 'Heretic':
      return <ShieldAlert className={clsx(SIZES, 'text-red-400')} />;
    case 'Opportunist':
      return <ShieldQuestion className={clsx(SIZES, 'text-blue-400')} />;
    default:
      return null;
  }
};

export const GameEndModal: React.FC<GameEndModalProps> = ({ results }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const hostId = useGameStore((state) => state.publicState?.hostId);
  const isHost = user?.id === hostId;

  const { summary, leaderboard } = results;

  const handleLeaveLobby = () => {
    // We should clear the game state when leaving
    useGameStore.getState().clearGame();
    navigate('/app/lobbies');
  };

  const handleMainMenu = () => {
    useGameStore.getState().clearGame();
    navigate('/app/main-menu');
  };

  const handlePlayAgain = () => {
    if (!socket || !isHost || !gameId) return;
    // Server should handle resetting the game state but keeping players
    socket.emit('lobby:restart', { gameId });
  };

  const handleNewScenario = () => {
    if (!socket || !isHost || !gameId) return;
    // Server should move all players back to the lobby settings
    socket.emit('lobby:return_to_lobby', { gameId });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <Card className="game-card deep-shadow w-full max-w-3xl max-h-[90vh] flex flex-col slide-in-up">
        <CardHeader className="text-center p-6">
          <div className="flex justify-center">
            <Award className="w-16 h-16 text-yellow-400" />
          </div>
          <CardTitle className="text-4xl font-bold game-title mt-2">
            Game Over
          </CardTitle>
          <p
            className={clsx(
              'text-2xl font-semibold mt-2',
              summary.winningRole === 'True Believer' && 'text-green-400',
              summary.winningRole === 'Heretic' && 'text-red-400',
              summary.winningRole === 'Opportunist' && 'text-blue-400',
              summary.winningRole === 'draw' && 'text-gray-400',
            )}
          >
            {summary.endCondition}
          </p>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          <h3 className="text-xl font-semibold text-orange-400">
            Final Leaderboard
          </h3>

          {/* Leaderboard Table */}
          <div className="w-full text-left rounded-lg overflow-hidden border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Identity
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Sub-Role
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider text-right">
                    Total VP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-900/50 divide-y divide-gray-700">
                {leaderboard.map((player, index) => (
                  <tr
                    key={player.userId}
                    className={clsx(player.userId === user?.id && 'bg-orange-900/40')}
                  >
                    <td className="px-4 py-3 text-center">
                      <span
                        className={clsx(
                          'font-bold text-lg',
                          index === 0 && 'text-yellow-400',
                          index === 1 && 'text-gray-300',
                          index === 2 && 'text-yellow-600',
                        )}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {player.username}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {player.secretIdentity}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <RoleInfo role={player.role} />
                        <span className="text-gray-200">{player.role}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {player.subRole}
                    </td>
                    <td className="px-4 py-3 text-xl font-bold text-white text-right">
                      {player.totalVp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {isHost ? (
              <>
                <Button
                  className="game-button w-full"
                  onClick={handlePlayAgain}
                >
                  Play Again
                </Button>
                <Button
                  className="btn-secondary w-full"
                  onClick={handleNewScenario}
                >
                  New Scenario
                </Button>
              </>
            ) : (
              <div className="col-span-2 text-center text-gray-400">
                Waiting for host...
              </div>
            )}
            <Button
              className="btn-outline w-full"
              onClick={handleLeaveLobby}
            >
              Leave Lobby
            </Button>
            <Button
              className="btn-outline w-full"
              onClick={handleMainMenu}
            >
              Exit to Main Menu
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Basic animation styles */}
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