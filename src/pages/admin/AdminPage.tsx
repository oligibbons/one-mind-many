import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, Brain, BarChart3, Settings, Shield } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';

interface Stats {
  totalUsers: number;
  activeGames: number;
  totalScenarios: number;
}

interface AdminSection {
  id: string;
  title: string;
  icon: JSX.Element;
  description: string;
  route: string;
  color: string;
}

const AdminPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeGames: 0,
    totalScenarios: 0
  });
  const [loading, setLoading] = useState(true);
  
  const sections: AdminSection[] = [
    {
      id: 'users',
      title: 'User Management',
      icon: <Users className="w-8 h-8 text-blue-500" />,
      description: 'Manage user accounts, roles, and permissions',
      route: '/admin/users',
      color: 'from-blue-500/20 to-transparent'
    },
    {
      id: 'scenarios',
      title: 'Scenario Management',
      icon: <FileText className="w-8 h-8 text-green-500" />,
      description: 'Create and manage game scenarios',
      route: '/admin/scenarios',
      color: 'from-green-500/20 to-transparent'
    },
    {
      id: 'ai',
      title: 'AI Narrative System',
      icon: <Brain className="w-8 h-8 text-purple-500" />,
      description: 'Configure AI models and manage prompts',
      route: '/admin/ai',
      color: 'from-purple-500/20 to-transparent'
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      icon: <BarChart3 className="w-8 h-8 text-orange-500" />,
      description: 'View game statistics and player metrics',
      route: '/admin/analytics',
      color: 'from-orange-500/20 to-transparent'
    },
    {
      id: 'content',
      title: 'Content Management',
      icon: <Settings className="w-8 h-8 text-pink-500" />,
      description: 'Manage site content and assets',
      route: '/admin/content',
      color: 'from-pink-500/20 to-transparent'
    },
    {
      id: 'security',
      title: 'Security Settings',
      icon: <Shield className="w-8 h-8 text-red-500" />,
      description: 'Configure security settings and view logs',
      route: '/admin/security',
      color: 'from-red-500/20 to-transparent'
    }
  ];
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch stats');
        
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-2">
            Welcome back, {user?.username}. Manage your game platform here.
          </p>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Users</p>
              <p className="text-3xl font-bold text-white mt-1">
                {loading ? '...' : stats.totalUsers}
              </p>
            </div>
            <Users className="w-12 h-12 text-blue-500 opacity-50" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Active Games</p>
              <p className="text-3xl font-bold text-white mt-1">
                {loading ? '...' : stats.activeGames}
              </p>
            </div>
            <FileText className="w-12 h-12 text-green-500 opacity-50" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Scenarios</p>
              <p className="text-3xl font-bold text-white mt-1">
                {loading ? '...' : stats.totalScenarios}
              </p>
            </div>
            <Brain className="w-12 h-12 text-purple-500 opacity-50" />
          </div>
        </Card>
      </div>
      
      {/* Admin Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Card 
            key={section.id}
            variant="interactive"
            className="overflow-hidden"
          >
            <div className={`p-6 bg-gradient-to-br ${section.color}`}>
              <div className="flex items-center mb-4">
                {section.icon}
                <h2 className="text-xl font-bold ml-3">{section.title}</h2>
              </div>
              <p className="text-slate-300 mb-6">{section.description}</p>
              <Button
                onClick={() => window.location.href = section.route}
                className="w-full"
              >
                Manage
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;