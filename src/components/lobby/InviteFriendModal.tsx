// src/components/lobby/InviteFriendModal.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useSocket } from '../../hooks/useSocket';
import { api } from '../../lib/api';
import { X, Send, AlertTriangle, User } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

// --- NEW: Define Friend type ---
interface Friend {
  id: string; // This is the user ID of the friend
  username: string;
  status: 'Online' | 'Offline' | 'In-Game';
}

interface FriendApiResponse {
  id: string; // friendship_id
  user: Friend;
}

interface InviteFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  lobbyId: string;
  lobbyCode: string;
}

export const InviteFriendModal: React.FC<InviteFriendModalProps> = ({
  isOpen,
  onClose,
  lobbyId,
  lobbyCode,
}) => {
  const { socket } = useSocket();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- NEW: Fetch friends when modal opens ---
  useEffect(() => {
    if (isOpen) {
      const fetchFriends = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await api.get('/friends');
          // API returns { id: friendshipId, user: { id, username, status } }
          // We just need the user object
          const friendData = response.data.map((f: FriendApiResponse) => f.user);
          setFriends(friendData);
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to load friends.');
        } finally {
          setLoading(false);
        }
      };
      fetchFriends();
    }
  }, [isOpen]);

  // --- NEW: Handle sending invite ---
  const handleSendInvite = (friendId: string, friendUsername: string) => {
    if (!socket) {
      toast({
        title: 'Socket not connected',
        description: 'Please wait a moment and try again.',
        variant: 'destructive',
      });
      return;
    }

    // Emit socket event to server
    socket.emit('lobby:invite_friend', { lobbyId, lobbyCode, friendId });

    toast({
      title: 'Invite Sent!',
      description: `Your invite has been sent to ${friendUsername}.`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="game-card w-full max-w-md m-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl text-white">Invite Friends</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center h-32">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center text-red-400">
              <AlertTriangle className="mx-auto h-8 w-8" />
              <p className="mt-2">{error}</p>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center text-gray-400">
              <User className="mx-auto h-8 w-8" />
              <p className="mt-2">You haven't added any friends yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
              {friends.map((friend) => {
                const isOnline = friend.status === 'Online';
                return (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between rounded-lg bg-gray-800/70 p-3"
                  >
                    <div>
                      <span className="font-semibold text-white">{friend.username}</span>
                      <p className={`text-sm ${isOnline ? 'text-green-400' : 'text-gray-500'}`}>
                        {friend.status}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="game-button"
                      onClick={() => handleSendInvite(friend.id, friend.username)}
                      disabled={!isOnline}
                      title={!isOnline ? `${friend.username} is not online.` : `Invite ${friend.username}`}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};