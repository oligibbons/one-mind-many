// src/App.tsx

import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext'; // <-- NEW

import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { MainMenuPage } from './pages/game/MainMenuPage';
import { HowToPlayPage } from './pages/HowToPlayPage';
import { FriendsPage } from './pages/game/FriendsPage';
import { SettingsPage } from './pages/game/SettingsPage';
import { GamePage } from './pages/game/GamePage'; // <-- NEW
import { LobbyPage } from './pages/game/LobbyPage'; // Kept for future use
import { NotFoundPage } from './pages/NotFoundPage';

import ProtectedRoute from './components/auth/ProtectedRoute';
// Admin routes are kept but simplified for now
import AdminRoute from './components/auth/AdminRoute';
import { AdminPage } from './pages/admin/AdminPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        {' '}
        {/* <-- Wrap app in SocketProvider */}
        <Router>
          <Routes>
            {/* --- Public Routes --- */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/how-to-play" element={<HowToPlayPage />} />
            </Route>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* --- Protected Game Routes --- */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/menu" element={<MainMenuPage />} />
              <Route path="/lobby/:lobbyId" element={<LobbyPage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* --- NEW Game Page Route (uses its own layout) --- */}
            <Route
              path="/game/:gameId"
              element={
                <ProtectedRoute>
                  <GamePage />
                </ProtectedRoute>
              }
            />

            {/* --- Admin Routes --- */}
            <Route
              element={
                <AdminRoute>
                  <MainLayout />
                </AdminRoute>
              }
            >
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
            </Route>

            {/* --- Catch-all --- */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;