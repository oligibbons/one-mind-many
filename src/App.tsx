import React from 'react'; // <-- Restored React import
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { PublicLayout } from './layouts/PublicLayout';

// Auth Components
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';

// Public Pages
import { HomePage } from './pages/HomePage';
import { HowToPlayPage } from './pages/HowToPlayPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Protected Pages
import MainMenuPage from './pages/game/MainMenuPage';
import LobbyListPage from './pages/game/LobbyListPage';
import LobbyPage from './pages/game/LobbyPage';
import GamePage from './pages/game/GamePage';
import FriendsPage from './pages/game/FriendsPage';
import ProfilePage from './pages/game/ProfilePage';
import SettingsPage from './pages/game/SettingsPage';

// Admin Pages
import AdminPage from './pages/admin/AdminPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import GameManagementPage from './pages/admin/GameManagementPage';
import ScenarioManagementPage from './pages/admin/ScenarioManagementPage';
import ScenarioEditorPage from './pages/admin/ScenarioEditorPage';
import ContentManagementPage from './pages/admin/ContentManagementPage';
import RulesManagementPage from './pages/admin/RulesManagementPage';
import TestGameViewPage from './pages/admin/TestGameViewPage';

// --- CORRECTED EXPORT ---
// Reverted from 'function App()' and 'export default'
export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Routes - NOW WRAPPED IN PUBLICLAYOUT */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/how-to-play" element={<HowToPlayPage />} />
            </Route>

            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/main-menu" element={<MainMenuPage />} />
                <Route path="/lobby-list" element={<LobbyListPage />} />
                <Route path="/lobby/:lobbyCode" element={<LobbyPage />} />
                <Route path="/game/:gameId" element={<GamePage />} />
                <Route path="/friends" element={<FriendsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/admin" element={<AdminPage />} />
                <Route
                  path="/admin/user-management"
                  element={<UserManagementPage />}
                />
                <Route
                  path="/admin/game-management"
                  element={<GameManagementPage />}
                />
                <Route
                  path="/admin/scenario-management"
                  element={<ScenarioManagementPage />}
                />
                <Route
                  path="/admin/scenario-editor/:scenarioId"
                  element={<ScenarioEditorPage />}
                />
                <Route
                  path="/admin/scenario-editor"
                  element={<ScenarioEditorPage />}
                />
                <Route
                  path="/admin/content-management"
                  element={<ContentManagementPage />}
                />
                <Route
                  path="/admin/rules-management"
                  element={<RulesManagementPage />}
                />
                <Route
                  path="/admin/test-game"
                  element={<TestGameViewPage />}
                />
              </Route>
            </Route>

            {/* 404 - Needs to be handled. You can wrap it in PublicLayout too. */}
            <Route element={<PublicLayout />}>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

// No default export needed