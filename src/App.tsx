// src/App.tsx

import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { Session } from '@supabase/supabase-js';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import PublicLayout from './layouts/PublicLayout';

// Pages
import { HomePage } from './pages/HomePage';
import HowToPlayPage from './pages/HowToPlayPage'; // Using default import
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import MainMenuPage from './pages/game/MainMenuPage'; // <-- FIX: Use default
import LobbyListPage from './pages/game/LobbyListPage'; // <-- FIX: Use default
import LobbyPage from './pages/game/LobbyPage'; // <-- FIX: Use default
import GamePage from './pages/game/GamePage'; // <-- FIX: Use default
import ProfilePage from './pages/game/ProfilePage'; // <-- FIX: Use default
import FriendsPage from './pages/game/FriendsPage'; // <-- FIX: Use default
import { SettingsPage } from './pages/game/SettingsPage';
import { AdminPage } from './pages/admin/AdminPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { GameManagementPage } from './pages/admin/GameManagementPage';
import { ScenarioManagementPage } from './pages/admin/ScenarioManagementPage';
import { ScenarioEditorPage } from './pages/admin/ScenarioEditorPage';
import { TestGameViewPage } from './pages/admin/TestGameViewPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import { Toaster } from './components/ui/Toaster';
import { InviteToast } from './components/ui/InviteToast';
import { useSocket } from './hooks/useSocket';
import ScrollToTop from './components/layout/ScrollToTop';

// Types
interface GameInvite {
  lobbyId: string;
  lobbyCode: string;
  inviterName: string;
}

function AppContent() {
  const { user, loading } = useAuth();
  const { socket } = useSocket();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState<GameInvite | null>(null);

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
          /> {/* <-- FIX: Changed '}' to '/>' */}
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