import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { User, Mail, Lock } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Check if username exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', formData.username)
        .single();

      if (existingUser) {
        throw new Error('Username already taken');
      }

      // Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error('Registration failed');

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: data.user.id,
          username: formData.username,
          email: formData.email,
          role: 'user'
        }]);

      if (profileError) throw profileError;

      // Registration successful
      navigate('/auth/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'CustomHeading', 'SpaceGrotesk', system-ui, sans-serif" }}>Create Account</h1>
        <p className="text-slate-400 mt-2">Join One Mind, Many to start playing</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          type="text"
          label="Username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="Choose a username"
          leftIcon={<User size={18} />}
          required
          disabled={loading}
        />

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
          placeholder="Choose a password"
          leftIcon={<Lock size={18} />}
          required
          disabled={loading}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>

        <p className="text-center text-slate-400">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-orange-500 hover:text-orange-600" style={{ fontFamily: "'CustomHeading', 'SpaceGrotesk', system-ui, sans-serif" }}>
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;