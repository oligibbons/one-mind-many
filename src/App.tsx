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
import { HowToPlayPage } from './pages/HowToPlayPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// --- Lazy Loaded Game Pages ---
const MainMenuPage = lazy(() => import('./pages/game/MainMenuPage').then(m => ({ default: m.MainMenuPage })));
const LobbyListPage = lazy(() => import('./pages/game/LobbyListPage').then(m => ({ default: m.LobbyListPage })));
const LobbyPage = lazy(() => import('./pages/game/LobbyPage').then(m => ({ default: m.LobbyPage })));
const GamePage = lazy(() => import('./pages/game/GamePage').then(m => ({ default: m.GamePage })));
const FriendsPage = lazy(() => import('./pages/game/FriendsPage').then(m => ({ default: m.FriendsPage })));
const ProfilePage = lazy(() => import('./pages/game/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/game/SettingsPage').then(m => ({ default: m.SettingsPage })));

// --- Lazy Loaded Admin Pages ---
const AdminPage = lazy(() => import('./pages/admin/AdminPage').then(m => ({ default: m.AdminPage })));
const ScenarioManagementPage = lazy(() => import('./pages/admin/ScenarioManagementPage').then(m => ({ default: m.ScenarioManagementPage })));
const ScenarioEditorPage = lazy(() => import('./pages/admin/ScenarioEditorPage').then(m => ({ default: m.ScenarioEditorPage })));
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage').then(m => ({ default: m.UserManagementPage })));
const GameManagementPage = lazy(() => import('./pages/admin/GameManagementPage').then(m => ({ default: m.GameManagementPage }))); // <-- NEW
const ContentManagementPage = lazy(() => import('./pages/admin/ContentManagementPage').then(m => ({ default: m.ContentManagementPage }))); // <-- NEW
// const TestGameViewPage = lazy(() => import('./pages/admin/TestGameViewPage')); // For next batch
// const RulesManagementPage = lazy(() => import('./pages/admin/RulesManagementPage')); // For next batch

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
            <Route path="games" element={<GameManagementPage />} /> {/* <-- NEW */}
            <Route path="content" element={<ContentManagementPage />} /> {/* <-- NEW */}
            {/* <Route path="test-game" element={<TestGameViewPage />} /> */}
            {/* <Route path="rules" element={<RulesManagementPage />} /> */}
          </Route>

          {/* --- Auth (Logged Out) --- */}
          <Route path="/" element={<AuthLayout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* --- Public Pages --- */}
          <Route path="/how-to-play" element={<HowToPlayPage />} />

          {/* --- Redirects & 404 --- */}
          <Route path="/menu" element={<Navigate to="/app/main-menu" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};