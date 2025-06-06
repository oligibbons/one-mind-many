import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Brain, Shield, Server } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

const HomePage = () => {
  const { user } = useAuth();
  
  const features = [
    {
      icon: <Users className="w-10 h-10 text-orange-500" />,
      title: 'Social Deduction',
      description: 'Work with (or against) other players to complete missions, but beware—someone might be a saboteur.'
    },
    {
      icon: <Brain className="w-10 h-10 text-orange-500" />,
      title: 'AI-Driven Scenarios',
      description: 'Immersive, dynamic scenarios that adapt to your choices and actions.'
    },
    {
      icon: <Shield className="w-10 h-10 text-orange-500" />,
      title: 'Strategic Gameplay',
      description: 'Make critical decisions and manage limited resources to achieve your objectives.'
    },
    {
      icon: <Server className="w-10 h-10 text-orange-500" />,
      title: 'Real-time Updates',
      description: 'Receive immediate feedback as the environment changes based on collective actions.'
    }
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-20 pb-16 md:pt-32 md:pb-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-slate-950 opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950" />
        </div>
        
        <div className="container mx-auto relative z-10">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: "'CustomHeading', 'SpaceGrotesk', system-ui, sans-serif" }}>
              One Mind, <span className="text-orange-500">Many</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed">
              Where deception meets strategy in a gripping social deduction game.
              Navigate through dynamic, AI-driven scenarios where survival depends
              on cunning teamwork.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={user ? "/game" : "/auth/register"}>
                <Button size="lg" rightIcon={<ArrowRight />}>
                  {user ? "Play Now" : "Get Started"}
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.div>
          
          <motion.div
            className="mt-16 md:mt-24 max-w-5xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-800">
              <img 
                src="https://images.pexels.com/photos/2694344/pexels-photo-2694344.jpeg" 
                alt="One Mind, Many gameplay" 
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2" style={{ fontFamily: "'CustomHeading', 'SpaceGrotesk', system-ui, sans-serif" }}>Immersive Gameplay</h2>
                <p className="text-slate-300">Experience tension and suspense as you navigate through dynamic scenarios.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 bg-slate-950">
        <div className="container mx-auto">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'CustomHeading', 'SpaceGrotesk', system-ui, sans-serif" }}>
              Game Features
            </h2>
            <p className="text-lg text-slate-300">
              One Mind, Many offers a unique blend of strategy, deception, and collaboration
              that keeps players coming back for more.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-lg p-6 flex flex-col items-center text-center"
                variants={itemVariants}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: "'CustomHeading', 'SpaceGrotesk', system-ui, sans-serif" }}>{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Link to={user ? "/game" : "/auth/register"}>
              <Button size="lg" rightIcon={<ArrowRight />}>
                {user ? "Start Playing" : "Join Now"}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-r from-slate-900 to-slate-950">
        <div className="container mx-auto">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6" style={{ fontFamily: "'CustomHeading', 'SpaceGrotesk', system-ui, sans-serif" }}>
              Ready to Test Your Deception Skills?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Join thousands of players around the world in One Mind, Many. 
              Create your account now and start playing!
            </p>
            <Link to={user ? "/game" : "/auth/register"}>
              <Button size="lg" rightIcon={<ArrowRight />}>
                {user ? "Enter Game Lobby" : "Create Free Account"}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;