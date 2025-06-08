import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Users, Brain, Zap, Trophy, Star, ArrowRight, Book } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

const HomePage = () => {
  const { user } = useAuth();
  
  const gameStats = [
    { label: 'Active Players', value: '12,847', icon: <Users className="w-5 h-5" /> },
    { label: 'Games Played', value: '89,234', icon: <Play className="w-5 h-5" /> },
    { label: 'Success Rate', value: '67%', icon: <Trophy className="w-5 h-5" /> },
  ];
  
  const quickFeatures = [
    {
      icon: <Brain className="w-8 h-8 text-orange-400" />,
      title: 'AI Scenarios',
      description: 'Dynamic stories that adapt to your choices'
    },
    {
      icon: <Users className="w-8 h-8 text-blue-400" />,
      title: 'Social Deduction',
      description: 'Trust no one, suspect everyone'
    },
    {
      icon: <Zap className="w-8 h-8 text-purple-400" />,
      title: 'Real-time Action',
      description: 'Every decision matters instantly'
    }
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-12 px-4 sm:px-6">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-orange-500/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-blue-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Game Logo/Title */}
            <div className="mb-8">
              <motion.div
                className="flex justify-center mb-6"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <img
                  src="/OneMindMay Logo - long.png"
                  alt="One Mind, Many"
                  className="h-24 md:h-32 lg:h-40 object-contain game-title"
                />
              </motion.div>
              
              <motion.div
                className="flex justify-center items-center gap-2 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-orange-400 fill-current" />
                ))}
                <span className="ml-2 text-slate-300 font-medium">4.8/5 Player Rating</span>
              </motion.div>
            </div>
            
            {/* Game Description */}
            <motion.p 
              className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed max-w-3xl mx-auto"
              style={{ fontFamily: "'Quicksand', system-ui, sans-serif" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              The ultimate social deduction experience. Navigate through AI-driven scenarios 
              where <span className="text-orange-400 font-semibold">trust is scarce</span> and 
              <span className="text-orange-400 font-semibold"> survival depends on wit</span>.
            </motion.p>
            
            {/* Main CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Link to={user ? "/game" : "/auth/register"}>
                <button className="game-button text-lg px-8 py-4 glow-pulse">
                  <Play className="w-6 h-6 mr-2" />
                  {user ? "Enter Game" : "Start Playing"}
                </button>
              </Link>
              
              <Link to="/how-to-play">
                <button className="game-button bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-lg px-8 py-4">
                  <Book className="w-6 h-6 mr-2" />
                  How to Play
                </button>
              </Link>
            </motion.div>
            
            {/* Game Stats */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {gameStats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="game-stat text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-center mb-2 text-orange-400">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Quick Features Section */}
      <section className="py-16 px-4 sm:px-6">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 
              className="text-3xl md:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: "'CustomHeading', 'Quicksand', system-ui, sans-serif" }}
            >
              Why Players Love It
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {quickFeatures.map((feature, index) => (
              <motion.div
                key={index}
                className="game-card p-6 text-center group hover:border-orange-500/50 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="mb-4 flex justify-center group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 
                  className="text-xl font-bold text-white mb-2"
                  style={{ fontFamily: "'CustomHeading', 'Quicksand', system-ui, sans-serif" }}
                >
                  {feature.title}
                </h3>
                <p className="text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Game Preview Section */}
      <section className="py-16 px-4 sm:px-6 bg-slate-950/50">
        <div className="container mx-auto">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="game-card p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 
                    className="text-3xl md:text-4xl font-bold text-white mb-6"
                    style={{ fontFamily: "'CustomHeading', 'Quicksand', system-ui, sans-serif" }}
                  >
                    Ready for the Challenge?
                  </h2>
                  <p className="text-lg text-slate-300 mb-6">
                    Join thousands of players in intense psychological gameplay. 
                    Every game is different, every choice matters, and anyone could be the saboteur.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to={user ? "/game/play" : "/auth/register"}>
                      <button className="game-button w-full sm:w-auto">
                        <Play className="w-5 h-5 mr-2" />
                        {user ? "Find Game" : "Join Now"}
                      </button>
                    </Link>
                    <Link to="/how-to-play">
                      <button className="game-button bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 w-full sm:w-auto">
                        <Book className="w-5 h-5 mr-2" />
                        Learn Rules
                      </button>
                    </Link>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="game-card p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Brain className="w-10 h-10 text-orange-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Live Game Preview</h3>
                      <p className="text-slate-400 mb-4">Experience dynamic storytelling</p>
                      <div className="bg-slate-800/50 rounded-lg p-4 text-left">
                        <p className="text-sm text-slate-300 italic">
                          "The lights flicker in the research facility. You hear footsteps echoing 
                          down the corridor, but you're supposed to be alone..."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="py-16 px-4 sm:px-6">
        <div className="container mx-auto">
          <motion.div
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 
              className="text-3xl md:text-4xl font-bold text-white mb-6"
              style={{ fontFamily: "'CustomHeading', 'Quicksand', system-ui, sans-serif" }}
            >
              Your Next Adventure Awaits
            </h2>
            <p className="text-lg text-slate-300 mb-8">
              Free to play. Easy to learn. Impossible to master.
            </p>
            <Link to={user ? "/game" : "/auth/register"}>
              <button className="game-button text-xl px-10 py-5 glow-pulse">
                <Play className="w-6 h-6 mr-3" />
                {user ? "Continue Playing" : "Start Your Journey"}
                <ArrowRight className="w-6 h-6 ml-3" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;