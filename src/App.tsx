import { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import HomePage from './pages/HomePage';
import HowToPlayPage from './pages/HowToPlayPage';
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
import AISystemPage from './pages/admin/AISystemPage';
import ScenarioManagementPage from './pages/admin/ScenarioManagementPage';
import ContentManagementPage from './pages/admin/ContentManagementPage';
import RulesManagementPage from './pages/admin/RulesManagementPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import GameManagementPage from './pages/admin/GameManagementPage';
import TestGameViewPage from './pages/admin/TestGameViewPage';
import NotFoundPage from './pages/NotFoundPage';

// Hooks and Contexts
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  // Handle automatic redirects for authenticated users
  useEffect(() => {
    if (!loading && user) {
      // If user is authenticated and on auth pages, redirect based on role
      if (location.pathname.startsWith('/auth')) {
        if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/game', { replace: true });
        }
      }
    }
  }, [user, loading, location.pathname, navigate]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="how-to-play" element={<HowToPlayPage />} />
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
          <Route path="ai" element={<AISystemPage />} />
          <Route path="scenarios" element={<ScenarioManagementPage />} />
          <Route path="content" element={<ContentManagementPage />} />
          <Route path="rules" element={<RulesManagementPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="games" element={<GameManagementPage />} />
          <Route path="test-game" element={<TestGameViewPage />} />
        </Route>
        
        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;