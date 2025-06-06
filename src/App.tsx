import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import MainMenuPage from './pages/game/MainMenuPage';
import PlayPage from './pages/game/PlayPage';
import LobbyPage from './pages/game/LobbyPage';
import GamePage from './pages/game/GamePage';
import ScenariosPage from './pages/game/ScenariosPage';
import FriendsPage from './pages/game/FriendsPage';
import SettingsPage from './pages/game/SettingsPage';
import AdminPage from './pages/admin/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Hooks and Contexts
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

function App() {
  const location = useLocation();
  const { user, loading } = useAuth();
  
  // Remove the checkAuth call from here since it's handled in AuthProvider
  // This was causing the race condition
  
  console.log('App render - User:', user?.username, 'Loading:', loading);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
        </Route>
        
        {/* Auth routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
        
        {/* Protected game routes */}
        <Route path="/game" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<MainMenuPage />} />
          <Route path="play" element={<PlayPage />} />
          <Route path="lobby/:id" element={<LobbyPage />} />
          <Route path="active/:id" element={<GamePage />} />
          <Route path="scenarios" element={<ScenariosPage />} />
          <Route path="friends" element={<FriendsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        
        {/* Admin routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <MainLayout />
          </AdminRoute>
        }>
          <Route index element={<AdminPage />} />
        </Route>
        
        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;