// src/components/ui/PlayerName.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerContextStore } from '../../stores/usePlayerContextStore';
import { api } from '../../lib/api';
import { User, UserPlus, VolumeX, Volume2, Shield, AlertTriangle, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface PlayerNameProps {
  player: {
    userId: string;
    username: string;
  };
  isHost?: boolean; // Am I the host?
  isTargetHost?: boolean; // Is this player the host?
  allowKick?: boolean; // Can this player be kicked (e.g., in a lobby)?
  onKick?: (userId: string) => void;
  className?: string;
}

export const PlayerName: React.FC<PlayerNameProps> = ({
  player,
  isHost = false,
  isTargetHost = false,
  allowKick = false,
  onKick,
  className,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMuted, muteUser, unmuteUser } = usePlayerContextStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const isSelf = user?.id === player.userId;
  const isPlayerMuted = isMuted(player.userId);
  
  const handleViewProfile = () => {
    navigate(`/app/profile/${player.userId}`);
  };
  
  const handleAddFriend = async () => {
    try {
      await api.post('/friends/request', { username: player.username });
      // TODO: Add a toast notification for "Friend request sent!"
      alert('Friend request sent!');
    } catch (err: any) {
      // TODO: Add a toast notification for the error
      alert(`Error: ${err.response?.data?.message || 'Could not send request.'}`);
    }
  };
  
  const handleMuteToggle = () => {
    if (isPlayerMuted) {
      unmuteUser(player.userId);
    } else {
      muteUser(player.userId);
    }
  };
  
  const handleKick = () => {
    if (onKick && allowKick) {
      onKick(player.userId);
    }
  };

  // Don't show menu for self
  if (isSelf) {
    return <span className={clsx("font-medium", className)}>{player.username}</span>;
  }

  return (
    <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenu.Trigger asChild>
        <span
          className={clsx(
            "font-medium cursor-pointer hover:underline hover:text-brand-orange transition-colors",
            isPlayerMuted && "italic text-gray-500 line-through",
            className
          )}
        >
          {player.username}
        </span>
      </DropdownMenu.Trigger>
      
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={5}
          className="z-[70] w-48 rounded-md border border-gray-700 bg-brand-charcoal p-2 text-brand-cream shadow-lg game-card"
        >
          <DropdownMenu.Label className="px-2 py-1 text-lg font-bold text-white">
            {player.username}
          </DropdownMenu.Label>
          
          <DropdownMenu.Separator className="h-px bg-gray-700 my-1" />

          <DropdownMenu.Item onSelect={handleViewProfile} className="dropdown-item">
            <User className="h-4 w-4 mr-2" />
            View Profile
          </DropdownMenu.Item>
          
          <DropdownMenu.Item onSelect={handleAddFriend} className="dropdown-item">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Friend
          </DropdownMenu.Item>
          
          <DropdownMenu.Separator className="h-px bg-gray-700 my-1" />

          <DropdownMenu.Item onSelect={handleMuteToggle} className="dropdown-item">
            {isPlayerMuted ? (
              <>
                <Volume2 className="h-4 w-4 mr-2" />
                Unmute Player
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 mr-2" />
                Mute Player
              </>
            )}
          </DropdownMenu.Item>
          
          {isHost && allowKick && !isTargetHost && (
            <>
              <DropdownMenu.Separator className="h-px bg-gray-700 my-1" />
              <DropdownMenu.Item onSelect={handleKick} className="dropdown-item-danger">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Kick Player
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};