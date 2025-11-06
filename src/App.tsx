// src/App.tsx

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// --- Layouts ---
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';

// --- Eagerly Loaded Pages ---
import { HomePage } from './pages/HomePage';
import { HowToPlayPage } from './pages/HowToPlayPage'; // <-- FIX: Eager load this
import { NotFoundPage } from './pages/NotFoundPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// --- Lazy Loaded App Pages ---
const MainMenuPage = lazy(() => import('./pages/game/MainMenuPage'));
const LobbyListPage = lazy(() => import('./pages/game/LobbyListPage'));
const LobbyPage = lazy(() => import('./pages/game/LobbyPage'));
const GamePage = lazy(() => import('./pages/game/GamePage'));
const FriendsPage = lazy(() => import('./pages/game/FriendsPage'));
const ProfilePage = lazy(() => import('./pages/game/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/game/SettingsPage'));

// --- Lazy Loaded Admin Pages ---
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const ScenarioManagementPage = lazy(() => import('./pages/admin/ScenarioManagementPage'));
const ScenarioEditorPage = lazy(() => import('./pages/admin/ScenarioEditorPage'));
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'));
const GameManagementPage = lazy(() => import('./pages/admin/GameManagementPage'));
const ContentManagementPage = lazy(() => import('./pages/admin/ContentManagementPage'));


const AppSuspense: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={
    <div className="flex h-screen w-full items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  }>
    {children}
  </Suspense>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* --- Main App (Logged In) --- */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <SocketProvider>
                  <AppSuspense>
                    <MainLayout />
                  </AppSuspense>
                </SocketProvider>
              </ProtectedRoute>
            }
          >
            <Route path="main-menu" element={<MainMenuPage />} />
            <Route path="lobbies" element={<LobbyListPage />} />
            <Route path="lobby/:lobbyId" element={<LobbyPage />} />
            <Route path="game/:gameId" element={<GamePage />} />
            <Route path="friends" element={<FriendsPage />} />
            <Route path="profile/:userId" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route index element={<Navigate to="main-menu" replace />} />
          </Route>

          {/* --- Admin (Logged In + Admin Role) --- */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <SocketProvider>
                  <AppSuspense>
                    <MainLayout />
                  </AppSuspense>
                </SocketProvider>
              </AdminRoute>
            }
          >
            <Route index element={<AdminPage />} />
            <Route path="scenarios" element={<ScenarioManagementPage />} />
            <Route path="scenario/new" element={<ScenarioEditorPage />} />
            <Route path="scenario/edit/:scenarioId" element={<ScenarioEditorPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="games" element={<GameManagementPage />} />
            <Route path="content" element={<ContentManagementPage />} />
          </Route>

          {/* --- Auth & Public Pages (Logged Out) --- */}
          {/* FIX: All public-facing pages are now children of AuthLayout */}
          <Route path="/" element={<AuthLayout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="how-to-play" element={<HowToPlayPage />} /> {/* <-- FIX: Moved here */}
          </Route>

          {/* --- Redirects & 404 --- */}
          <Route path="/menu" element={<Navigate to="/app/main-menu" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};