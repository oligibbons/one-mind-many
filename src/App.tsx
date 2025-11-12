// src/App.tsx

import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { SocketProvider } from './contexts/SocketContext';
import { Session } from '@supabase/supabase-js';

// --- FIX: Import the store initializer ---
import { initializeCurrentPlayerStore } from './stores/useCurrentPlayerStore';

// Layouts
import { MainLayout } from './layouts/MainLayout';
// ... other imports ...
import ScrollToTop from './components/layout/ScrollToTop';

// Types
interface GameInvite {
  lobbyId: string;
  lobbyCode: string;
  inviterName: string;
}

// --- FIX: Add a flag to ensure initialization runs only once ---
let storesInitialized = false;

function AppContent() {
  const { user, loading }_ = useAuth();
  const { socket } = useSocket();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState<GameInvite | null>(null);

  // --- FIX: Call the store initializer from here ---
  useEffect(() => {
    // This ensures initialization runs only once,
    // *after* AuthProvider has mounted.
    if (!storesInitialized) {
      initializeCurrentPlayerStore();
      storesInitialized = true;
    }
  }, []); // Empty dependency array ensures it runs once on mount

  useEffect(() => {
    document.title = 'M.O.P.';
  }, []);

  useEffect(() => {
    if (socket && user) {
      console.log('App.tsx: Socket connected, listening for game:invite');
      socket.on('game:invite', (data: GameInvite) => {
        console.log('Game invite received:', data);
        setInviteData(data);
        setShowInvite(true);
      });

      // Clean up listener
      return () => {
        console.log('App.tsx: Cleaning up game:invite listener');
        socket.off('game:invite');
      };
    }
  }, [socket, user]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-950">
        {/* A global loading spinner could go here */}
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/how-to-play" element={<HowToPlayPage />} />
        </Route>

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Routes (Main App) */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/main-menu" element={<MainMenuPage />} />
          <Route path="/lobbies" element={<LobbyListPage />} />
          <Route path="/lobby/:lobbyId" element={<LobbyPage />} />
          <Route path="/game/:gameId" element={<GamePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        >
          <Route path="users" element={<UserManagementPage />} />
          <Route path="games" element={<GameManagementPage />} />
          <Route path="scenarios" element={<ScenarioManagementPage />} />
          <Route path="scenario-editor" element={<ScenarioEditorPage />} />
          <Route
            path="scenario-editor/:scenarioId"
            element={<ScenarioEditorPage />}
          />
          <Route path="test-game" element={<TestGameViewPage />} />
        </Route>

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {showInvite && inviteData && (
        <InviteToast
          lobbyId={inviteData.lobbyId}
          lobbyCode={inviteData.lobbyCode}
          inviterName={inviteData.inviterName}
          onClose={() => setShowInvite(false)}
        />
      )}
    </>
  );
}

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
          <Toaster />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};