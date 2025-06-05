import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Users, BookOpen, Settings, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';

const MainMenuPage = () => {
  const { user, isAdmin } = useAuth();
  
  const menuItems = [
    {
      title: 'Play',
      icon: <Play size={24} className="text-orange-500" />,
      description: 'Join or create a game lobby',
      path: '/game/play',
      color: 'from-orange-500/20 to-transparent'
    },
    {
      title: 'Scenarios',
      icon: <BookOpen size={24} className="text-blue-500" />,
      description: 'Browse available game scenarios',
      path: '/game/scenarios',
      color: 'from-blue-500/20 to-transparent'
    },
    {
      title: 'Friends',
      icon: <Users size={24} className="text-green-500" />,
      description: 'Manage your friends list',
      path: '/game/friends',
      color: 'from-green-500/20 to-transparent'
    },
    {
      title: 'Settings',
      icon: <Settings size={24} className="text-purple-500" />,
      description: 'Configure game preferences',
      path: '/game/settings',
      color: 'from-purple-500/20 to-transparent'
    },
    ...(isAdmin ? [
      {
        title: 'Admin',
        icon: <Shield size={24} className="text-red-500" />,
        description: 'Access admin controls',
        path: '/admin',
        color: 'from-red-500/20 to-transparent'
      }
    ] : [])
  ];
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome, <span className="text-orange-500">{user?.username}</span>
        </h1>
        <p className="text-xl text-slate-300">
          What would you like to do today?
        </p>
      </motion.div>
      
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {menuItems.map((item, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Link to={item.path}>
              <Card
                variant="interactive"
                className="h-full bg-gradient-to-br p-px"
              >
                <div className={`h-full bg-slate-900 p-6 rounded-lg bg-gradient-to-br ${item.color}`}>
                  <div className="flex items-center mb-4">
                    {item.icon}
                    <h2 className="text-xl font-bold ml-2">{item.title}</h2>
                  </div>
                  <p className="text-slate-400">{item.description}</p>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
      
      <motion.div
        className="mt-12 bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-lg p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
        <div className="text-slate-400 text-center py-6">
          <p>No recent activity to display.</p>
          <p className="mt-2">Start playing to see your game history here!</p>
        </div>
      </motion.div>
    </div>
  );
};

export default MainMenuPage;