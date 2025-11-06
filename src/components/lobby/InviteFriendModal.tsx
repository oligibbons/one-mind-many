// src/components/lobby/InviteFriendModal.tsx

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { AlertCircle, User, Send, Check } from 'lucide-react';
import { api } from '../../lib/api'; // Your configured axios instance
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth'; // <-- FIX: Imported useAuth
import clsx from 'clsx';

// This interface matches YOUR server's GET /friends response
interface FriendData {
  id: string; // This is the friendship_id
  user: {
    id: string; // This is the friend's user_id
    username: string;
    avatar_url: string | null;
    status: 'Online' | 'Offline' | 'In-Game';
  };
  created_at: string;
}

interface InviteFriendModalProps {
  gameId: string;
  lobbyName: string; // <-- NEW: To tell your friend what lobby
  onClose: () => void;
}

export const InviteFriendModal: React.FC<InviteFriendModalProps> = ({
  gameId,
  lobbyName,
  onClose,
}) => {
  const { socket } = useSocket();
  const { user } = useAuth(); // <-- FIX: Added useAuth hook
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFriends = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/friends');
        // TODO: Once presence is implemented, sort by online status
        setFriends(response.data);
      } catch (err: any) {
        console.error('Error fetching friends:', err);
        setError(err.response?.data?.message || 'Failed to load your friends list.');
      }
      setIsLoading(false);
    };

    fetchFriends();
  }, []);

  const handleInvite = (friendUserId: string) => {
    // FIX: Check for socket and user
    if (!socket || !user) {
      setError('Socket or user not available.');
      return;
    }

    console.log(`Inviting friend ${friendUserId} to game ${gameId}`);
    setError(null);

    // This is the real-time invite event we'll implement fully in the next batch
    socket.emit(
      'friend:invite',
      { 
        gameId, 
        lobbyName,
        inviteeId: friendUserId,
        // FIX: Send sender info from the authenticated user
        senderId: user.id, 
        senderUsername: user.profile?.username || 'A friend',
      },
      (response: { status: 'ok' } | { status: 'error'; message: string }) => {
        if (response.status === 'ok') {
          setInvitedFriends((prev) => new Set(prev).add(friendUserId));
        } else {
          setError(response.message);
        }
      },
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      );
    }

    if (friends.length === 0) {
      return (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-gray-400">
          <User className="h-8 w-8" />
          <p>You haven't added any friends yet.</p>
          <p className="text-sm">Go to the Friends page to add friends by username.</p>
        </div>
      );
    }

    return (
      <div className="max-h-96 space-y-3 overflow-y-auto custom-scrollbar pr-2">
        {friends.map((friend) => {
          const friendUser = friend.user;
          const isInvited = invitedFriends.has(friendUser.id);
          
          // TODO: Use real status from presence system
          const isOnline = friendUser.status !== 'Offline'; 

          return (
            <div
              key={friend.id} // Use friendship ID as key
              className="flex items-center justify-between rounded-lg bg-brand-navy/50 p-3"
            >
              <div className="flex items-center">
                <span className="relative mr-3">
                  {friendUser.avatar_url ? (
                    <img src={friendUser.avatar_url} alt={friendUser.username} className="h-10 w-10 rounded-full" />
                  ) : (
                    <User className="h-10 w-10 rounded-full bg-brand-navy p-2 text-gray-400" />
                  )}
                  <span
                    className={clsx(
                      'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-brand-navy',
                      isOnline ? 'bg-green-400' : 'bg-gray-600',
                    )}
                  />
                </span>
                <div>
                  <h3 className="font-semibold text-brand-cream">{friendUser.username}</h3>
                  <p className="text-sm text-gray-400">{friendUser.status}</p>
                </div>
              </div>
              <Button
                variant={isInvited ? 'secondary' : 'default'}
                className={isInvited ? 'btn-secondary' : 'btn-primary'}
                size="sm"
                onClick={() => handleInvite(friendUser.id)} // Pass the friend's USER ID
                disabled={isInvited || !isOnline}
                title={!isOnline ? `${friendUser.username} is offline` : (isInvited ? 'Invite sent' : `Invite ${friendUser.username}`)}
              >
                {isInvited ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Sent
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Invite
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <Card
        className="game-card deep-shadow w-full max-w-lg slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle className="text-3xl game-title">Invite Friends</CardTitle>
          <CardDescription className="text-gray-300">
            Invite friends from your list to this lobby.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-red-700 bg-red-900/30 p-3 text-red-300">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {renderContent()}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="btn-outline"
            onClick={onClose}
          >
            Close
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};