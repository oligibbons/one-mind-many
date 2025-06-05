import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Volume2, Bell, Moon, Monitor } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';

const SettingsPage = () => {
  const { user } = useAuth();
  
  const [settings, setSettings] = useState({
    theme: 'dark',
    volume: 80,
    notifications: true,
    soundEffects: true,
    musicVolume: 60,
    language: 'en',
  });
  
  const [loading, setLoading] = useState(false);
  
  const handleSave = async () => {
    setLoading(true);
    // In a real implementation, this would save to the database
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };
  
  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <motion.div
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-slate-400">Customize your game experience</p>
          </div>
          <Button
            onClick={handleSave}
            isLoading={loading}
            leftIcon={<Save size={18} />}
          >
            Save Changes
          </Button>
        </div>
        
        <div className="space-y-6">
          {/* Theme Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Monitor size={20} className="mr-2" />
              Display
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Theme
                </label>
                <div className="flex gap-4">
                  <button
                    className={`px-4 py-2 rounded-md flex items-center ${
                      settings.theme === 'light'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    onClick={() => setSettings({ ...settings, theme: 'light' })}
                  >
                    <Moon size={16} className="mr-2" />
                    Light
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md flex items-center ${
                      settings.theme === 'dark'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    onClick={() => setSettings({ ...settings, theme: 'dark' })}
                  >
                    <Moon size={16} className="mr-2" />
                    Dark
                  </button>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Audio Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Volume2 size={20} className="mr-2" />
              Audio
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Master Volume
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.volume}
                  onChange={(e) => setSettings({ ...settings, volume: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-right text-sm text-slate-400 mt-1">
                  {settings.volume}%
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Music Volume
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.musicVolume}
                  onChange={(e) => setSettings({ ...settings, musicVolume: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-right text-sm text-slate-400 mt-1">
                  {settings.musicVolume}%
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">Sound Effects</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.soundEffects}
                    onChange={(e) => setSettings({ ...settings, soundEffects: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>
          </Card>
          
          {/* Notification Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Bell size={20} className="mr-2" />
              Notifications
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">Game Notifications</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>
          </Card>
          
          {/* Account Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
            <div className="space-y-2">
              <p className="text-slate-300">
                <span className="font-medium">Username:</span> {user?.username}
              </p>
              <p className="text-slate-300">
                <span className="font-medium">Email:</span> {user?.email}
              </p>
              <p className="text-slate-300">
                <span className="font-medium">Account Type:</span>{' '}
                <span className="capitalize">{user?.role}</span>
              </p>
            </div>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPage;