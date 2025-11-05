// src/components/ui/InviteToast.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent } from './Card';
import { Button } from './Button';
import { X, Mail, Gamepad2 } from 'lucide-react';
import { Profile } from '../../types/game'; // Assuming Profile is in game.d.ts

export interface InviteData {
  gameId: string;
  lobbyName: string;
  hostUsername: string;
}

interface InviteToastProps {
  invite: InviteData;
  onClose: () => void;
}

export const InviteToast: React.FC<InviteToastProps> = ({ invite, onClose }) => {
  const { socket } = useSocket();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!socket || !user || !profile) return;

    // We must first leave any room we are currently in
    // The server should handle this, but we can emit a 'leave' just in case.
    // For now, just emit 'lobby:join'
    socket.emit(
      'lobby:join',
      {
        gameId: invite.gameId,
        userId: user.id,
        username: profile.username || 'AnonPlayer',
      },
      (response: { status: 'ok'; gameId: string } | { status: 'error'; message: string }) => {
        if (response.status === 'ok') {
          navigate(`/app/lobby/${response.gameId}`);
          onClose();
        } else {
          // TODO: show a more robust error
          alert(`Failed to join: ${response.message}`);
          onClose();
        }
      },
    );
  };

  return (
    <Card className="fixed bottom-4 right-4 z-[100] w-full max-w-sm game-card deep-shadow slide-in-up">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex-shrink-0 rounded-full bg-brand-orange/20 p-2 text-brand-orange">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <h4 className="font-semibold text-brand-cream">Lobby Invite</h4>
              <p className="text-sm text-gray-300">
                <span className="font-bold text-white">{invite.hostUsername}</span>
                {' '}invited you to join:
                <br />
                <span className="italic">{invite.lobbyName}</span>
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-4 flex gap-3">
          <Button className="w-full btn-secondary" onClick={onClose}>
            Decline
          </Button>
          <Button className="w-full game-button" onClick={handleJoin}>
            <Gamepad2 className="h-4 w-4 mr-2" />
            Join
          </Button>
        </div>
      </CardContent>
      {/* Re-using slide-in animation from GameEndModal */}
      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-in-up { animation: slideInUp 0.3s ease-out; }
      `}</style>
    </Card>
  );
};