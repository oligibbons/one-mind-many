import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Mail, Lock } from 'lucide-react';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      console.log('Attempting to log in...');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      console.log('Login response data:', data);
      console.log('Login response error:', signInError);

      if (signInError) {
        console.error('Sign-in error:', signInError.message);
        throw signInError;
      }

      if (data.user) {
        console.log('User successfully logged in:', data.user);
        // Optionally redirect here, if applicable:
        // navigate('/dashboard');
      } else {
        console.error('No user object returned in the response.');
        setError('Unexpected error: No user data returned. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error details:', err);
      setError(err.message || 'Unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'CustomHeading', 'SpaceGrotesk', system-ui, sans-serif" }}>Welcome Back</h1>
        <p className="text-slate-400 mt-2">Sign in to continue to One Mind, Many</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          type="email"
          label="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Enter your email"
          leftIcon={<Mail size={18} />}
          required
          disabled={loading}
        />

        <Input
          type="password"
          label="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Enter your password"
          leftIcon={<Lock size={18} />}
          required
          disabled={loading}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

        <p className="text-center text-slate-400">
          Don't have an account?{' '}
          <Link to="/auth/register" className="text-orange-500 hover:text-orange-600" style={{ fontFamily: "'CustomHeading', 'SpaceGrotesk', system-ui, sans-serif" }}>
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;