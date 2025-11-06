// src/layouts/MainLayout.tsx

import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useSocket } from '../contexts/SocketContext';
import { InviteToast, InviteData } from '../components/ui/InviteToast';
import { usePresenceStore } from '../stores/usePresenceStore';
import { useAuth } from '../hooks/useAuth'; // <-- FIX: Import useAuth
import { LoadingSpinner } from '../components/ui/LoadingSpinner'; // <-- FIX: Import LoadingSpinner

export const MainLayout: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const { setFriendStatus } = usePresenceStore();
  const [activeInvite, setActiveInvite] = useState<InviteData | null>(null);
  
  // --- FIX: Add useAuth hook to get loading state ---
  const { loading, user } = useAuth(); 

  // --- NEW: Global Socket Listeners ---
  useEffect(() => {
    if (!socket || !isConnected) return;

    // 1. Listen for friend invites
    const onInviteReceived = (invite: InviteData) => {
      console.log('Invite received:', invite);
      setActiveInvite(invite);
    };

    // 2. Listen for friend presence updates
    const onStatusUpdate = (data: { userId: string; status: 'Online' | 'Offline' | 'In-Game' }) => {
      console.log('Presence update:', data);
      setFriendStatus(data.userId, data.status);
    };

    socket.on('friend:invite_received', onInviteReceived);
    socket.on('friend:status_update', onStatusUpdate);

    // Cleanup listeners
    return () => {
      socket.off('friend:invite_received', onInviteReceived);
      socket.off('friend:status_update', onStatusUpdate);
    };
  }, [socket, isConnected, setFriendStatus]);
  
  // --- FIX: Add loading check ---
  // This ensures we don't render the app until the user and profile are loaded,
  // preventing layout shifts or errors in the Navbar.
  if (loading || (user && !user.profile)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <LoadingSpinner size="lg" />
        <p className="ml-4 text-xl text-gray-300">Loading User Data...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      
      {/* --- NEW: Render invite toast if one is active --- */}
      {activeInvite && (
        <InviteToast
          invite={activeInvite}
          onClose={() => setActiveInvite(null)}
        />
      )}
    </div>
  );
};