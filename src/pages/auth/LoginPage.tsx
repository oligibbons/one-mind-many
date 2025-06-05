import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  if (authLoading) {
    return <LoadingSpinner size="lg" text="Loading..." />;
  }
  
  if (user) {
    navigate('/game');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      navigate('/game');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Login</h1>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 rounded p-3 mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-white text-black rounded border border-slate-300"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-white text-black rounded border border-slate-300"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;