// src/pages/game/MainMenuPage.tsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { LogOut, Play, Users, Settings, User, Shield } from 'lucide-react';

// FIX: Changed from 'export const' to 'const'
const MainMenuPage: React.FC = () => {
  // FIX: 'useAuth' provides 'user' (which contains profile) and 'logout'.
  // It does NOT provide 'profile' as a separate variable.
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Redirect is handled by ProtectedRoute & AuthLayout
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-950 text-gray-200">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white">
          {/* FIX: Changed 'profile.username' to 'user.profile.username' */}
          Welcome, {user?.profile?.username || 'Guardian'}
        </h1>
        <p className="text-lg text-gray-400 mt-2">
          The Order awaits your guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
        <Button as={Link} to="/app/lobbies" size="lg" className="justify-center">
          <Play className="mr-2 h-5 w-5" />
          Play
        </Button>
        <Button
          as={Link}
          to="/app/friends"
          size="lg"
          variant="secondary"
          className="justify-center"
        >
          <Users className="mr-2 h-5 w-5" />
          Friends
        </Button>
        <Button
          as={Link}
          // FIX: Changed 'user.id' to 'user.profile.id' or 'user.id'
          // 'user.id' is correct as it's the auth user's ID.
          to={`/app/profile/${user?.id}`}
          size="lg"
          variant="secondary"
          className="justify-center"
        >
          <User className="mr-2 h-5 w-5" />
          Profile
        </Button>
        <Button
          as={Link}
          to="/app/settings"
          size="lg"
          variant="secondary"
          className="justify-center"
        >
          <Settings className="mr-2 h-5 w-5" />
          Settings
        </Button>
        
        {/* FIX: Changed 'profile.is_admin' to 'user.profile.is_admin' */}
        {user?.profile?.is_admin && (
           <Button
            as={Link}
            to="/admin"
            size="lg"
            variant="danger"
            className="justify-center"
          >
            <Shield className="mr-2 h-5 w-5" />
            Admin Panel
          </Button>
        )}

        <Button
          onClick={handleLogout}
          size="lg"
          variant="ghost"
          className="justify-center mt-4"
        >
          <LogOut className="mr-2 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

// FIX: Added 'export default'
export default MainMenuPage;