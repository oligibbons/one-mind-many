// src/pages/game/MainMenuPage.tsx

import { useNavigate, Link } from 'react-router-dom'; // <-- NEW: Added Link
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'; // <-- NEW: Added Card components
import { LogOut, Users, Settings, Play, Target, BookOpen, User, Shield } from 'lucide-react'; // <-- NEW: Added icons
import { Logo } from '../../components/ui/Logo';

export const MainMenuPage = () => {
  // --- FIX: Updated to use 'profile' and 'handleSignOut' from context ---
  const { user, profile, handleSignOut } = useAuth();
  const navigate = useNavigate();

  // Determine user name for welcome message
  const username = profile?.username || user?.email?.split('@')[0] || 'Agent';

  const onSignOut = async () => {
    await handleSignOut();
    navigate('/login');
  };

  // --- FIX: Updated names, descriptions, and paths ---
  const menuItems = [
    {
      name: 'Find Mission',
      icon: <Play className="w-6 h-6 text-orange-400" />,
      path: '/lobbies', // <-- FIX: Corrected path
      description: 'Join a public mission or see active lobbies.',
    },
    {
      name: 'Create Mission',
      icon: <Target className="w-6 h-6 text-orange-400" />,
      path: '/lobbies', // <-- FIX: Corrected path (Lobby list page has "Create")
      description: 'Begin a new mission, either public or private.',
    },
    {
      name: 'Agent Directory',
      icon: <Users className="w-6 h-6 text-orange-400" />,
      path: '/friends',
      description: 'Manage your agent cohorts and send invites.', // <-- FIX: GIMP -> MOP
    },
  ];

  const secondaryActions = [
    { name: 'Profile', path: `/profile/${user?.id}`, icon: User }, // <-- FIX: Corrected path
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'How to Play', path: '/how-to-play', icon: BookOpen },
  ];
  
  if (profile?.is_admin) {
    secondaryActions.push({ name: 'Admin', path: '/admin', icon: Shield });
  }
  // --- END OF FIX ---

  return (
    <div
      className="flex min-h-full w-full flex-col items-center justify-center p-4"
      style={{ fontFamily: "'Quicksand', system-ui, sans-serif" }}
    >
      {/* Header and Welcome */}
      <div className="text-center mb-12">
        <Logo width="100" height="100" className="mx-auto" />

        <h1
          className="text-4xl sm:text-5xl font-extrabold mt-4 tracking-wider game-title" // <-- FIX: Use game-title class
          style={{ fontFamily: "'CustomHeading', system-ui, sans-serif" }}
        >
          {/* --- FIX: Updated text to M.O.P. lore --- */}
          MINISTRY MAIN HUB
        </h1>
        <p className="text-lg text-slate-300 mt-2">
          Welcome, <span className="font-bold text-orange-400">{username}</span>
          . Your attention is required.
        </p>
      </div>

      {/* Main Menu Grid (Preserved your layout) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-10">
        {menuItems.map((item) => (
          <Card
            key={item.name}
            className="game-card p-6 transition-all duration-200 cursor-pointer hover:border-orange-400 group"
            onClick={() => navigate(item.path)}
          >
            <div className="flex items-center space-x-4">
              {item.icon}
              <h2 className="text-xl font-semibold text-white group-hover:text-orange-400 transition-colors">
                {item.name}
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-3">{item.description}</p>
          </Card>
        ))}
      </div>

      {/* Secondary Actions and Logout (Preserved your layout) */}
      <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 max-w-4xl w-full">
        {secondaryActions.map((action) => (
          <Button
            key={action.name}
            variant="ghost"
            className="text-slate-300 hover:text-white hover:bg-gray-800/60 px-4 py-2"
            onClick={() => navigate(action.path)}
          >
            <action.icon className="w-4 h-4 mr-2" />
            {action.name}
          </Button>
        ))}

        <Button
          variant="secondary"
          className="bg-red-600/90 hover:bg-red-700 text-white flex items-center space-x-2 px-4 py-2"
          onClick={onSignOut} // <-- FIX: Use correct sign out function
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </Button>
      </div>

      {/* Footer message for atmosphere (Preserved) */}
      <p className="mt-16 text-sm text-slate-500 text-center">
        "The mind of the many is a whisper. The voice of the one is a shadow."
      </p>
    </div>
  );
};

export default MainMenuPage;