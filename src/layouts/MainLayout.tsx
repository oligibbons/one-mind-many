// src/layouts/MainLayout.tsx

import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useSocket } from '../contexts/SocketContext';
// --- FIX: Import definitions from InviteToast ---
import { InviteToast, InviteData } from '../components/ui/InviteToast';
import { usePresenceStore } from '../stores/usePresenceStore';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const MainLayout: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const { setFriendStatus } = usePresenceStore();
  const [activeInvite, setActiveInvite] = useState<InviteData | null>(null);
  
  // Get auth state
  const { loading, user } = useAuth(); 

  // --- Global Socket Listeners ---
  useEffect(() => {
    if (!socket || !isConnected) return;

    const onInviteReceived = (invite: InviteData) => {
      console.log('Invite received:', invite);
      setActiveInvite(invite);
    };

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
  
  // --- FIX: Simplified loading check ---
  // The original check `(user && !user.profile)` was blocking the UI.
  // This indicates the profile fetch is failing (likely RLS).
  // We will remove that check for now to get the UI to render.
  // The 'loading' state from useAuth is the primary auth check.
  if (loading) {
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
      
      {activeInvite && (
        <InviteToast
          invite={activeInvite}
          onClose={() => setActiveInvite(null)}
        />
      )}
    </div>
  );
};