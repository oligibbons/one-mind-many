import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LogOut, Users, Settings, Play, Target } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';

const MainMenuPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Determine user name for welcome message
  const username =
    user?.profile?.username || user?.email?.split('@')[0] || 'Seeker';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // --- FIX: Corrected all paths to match App.tsx routes ---
  const menuItems = [
    {
      name: 'New Prophecy',
      icon: <Target className="w-6 h-6 text-orange-400" />,
      path: '/lobby-list',
      description: 'Begin a new game, either public or private.',
    },
    {
      name: 'Find Other Seekers',
      icon: <Play className="w-6 h-6 text-orange-400" />,
      path: '/lobby-list',
      description: 'Join a game already in progress or view public lobbies.',
    },
    {
      name: 'Your G.I.M.P Cohorts',
      icon: <Users className="w-6 h-6 text-orange-400" />,
      path: '/friends',
      description: 'Manage your friends list and send invitations.',
    },
  ];

  const secondaryActions = [
    { name: 'Profile', path: '/profile' },
    { name: 'Settings', path: '/settings' },
    { name: 'How to Play', path: '/how-to-play' },
  ];
  // --- END OF FIX ---

  return (
    <div
      className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4"
      style={{ fontFamily: "'Quicksand', system-ui, sans-serif" }}
    >
      {/* Header and Welcome */}
      <div className="text-center mb-12">
        <Logo size="lg" />

        <h1
          className="text-4xl sm:text-5xl font-extrabold mt-4 tracking-wider text-orange-500"
          style={{ fontFamily: "'CustomHeading', system-ui, sans-serif" }}
        >
          THE ORACLE AWAITS
        </h1>
        <p className="text-lg text-slate-300 mt-2">
          Welcome, <span className="font-bold text-orange-400">{username}</span>
          . Your journey begins now.
        </p>
      </div>

      {/* Main Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-10">
        {menuItems.map((item) => (
          <Card
            key={item.name}
            className="p-6 bg-slate-800 hover:bg-slate-700/80 transition-all duration-200 cursor-pointer border border-transparent hover:border-orange-500 group"
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

      {/* Secondary Actions and Logout */}
      <div className="flex flex-wrap justify-center gap-4 max-w-4xl w-full">
        {secondaryActions.map((action) => (
          <Button
            key={action.name}
            variant="ghost"
            className="text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-2"
            onClick={() => navigate(action.path)}
          >
            {action.name}
          </Button>
        ))}

        <Button
          variant="secondary"
          className="bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2 px-4 py-2"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </Button>
      </div>

      {/* Footer message for atmosphere */}
      <p className="mt-16 text-sm text-slate-500">
        "The mind of the many is a whisper. The voice of the one is a shadow."
      </p>
    </div>
  );
};

export default MainMenuPage;