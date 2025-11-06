import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import {
  Users,
  Swords,
  Scroll,
  FileText,
  Library,
  Hammer,
  FlaskConical,
} from 'lucide-react';

const AdminPage = () => {
  const navigate = useNavigate();

  // --- FIX: Corrected all paths to match App.tsx routes ---
  const adminSections = [
    {
      name: 'User Management',
      icon: <Users className="w-6 h-6 text-orange-400" />,
      path: '/admin/user-management',
      description: 'Manage users, roles, and permissions.',
    },
    {
      name: 'Game Management',
      icon: <Swords className="w-6 h-6 text-orange-400" />,
      path: '/admin/game-management',
      description: 'View and manage active games.',
    },
    {
      name: 'Scenario Management',
      icon: <Scroll className="w-6 h-6 text-orange-400" />,
      path: '/admin/scenario-management',
      description: 'Create, edit, and publish game scenarios.',
    },
    {
      name: 'New Scenario',
      icon: <Hammer className="w-6 h-6 text-orange-400" />,
      path: '/admin/scenario-editor',
      description: 'Access the scenario creation tool.',
    },
    {
      name: 'Content Management',
      icon: <FileText className="w-6 h-6 text-orange-400" />,
      path: '/admin/content-management',
      description: 'Manage static content (e.g., How to Play).',
    },
    {
      name: 'Rules Management',
      icon: <Library className="w-6 h-6 text-orange-400" />,
      path: '/admin/rules-management',
      description: 'Edit core game rules and definitions.',
    },
    {
      name: 'Test Game View',
      icon: <FlaskConical className="w-6 h-6 text-orange-400" />,
      path: '/admin/test-game',
      description: 'Access a test view of the game board.',
    },
  ];
  // --- END OF FIX ---

  return (
    <div className="container mx-auto p-4">
      <h1
        className="text-4xl font-extrabold text-center mb-10 text-orange-500"
        style={{ fontFamily: "'CustomHeading', system-ui, sans-serif" }}
      >
        Admin Panel
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((item) => (
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
    </div>
  );
};

export default AdminPage;