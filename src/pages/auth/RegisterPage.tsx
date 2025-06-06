import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { User, Mail, Lock } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (user) {
      navigate('/game');
    }
  }, [user, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });
      
      if (signUpError) throw signUpError;
      
      if (user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            username,
            email,
            role: 'user'
          }]);
        
        if (profileError) throw profileError;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white">Create Account</h1>
        <p className="text-slate-400 mt-2">Join One Mind, Many to start playing</p>
      </div>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleRegister} className="space-y-6">
        <Input
          type="text"
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Choose a username"
          leftIcon={<User size={18} />}
          required
          disabled={loading}
        />
        
        <Input
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          leftIcon={<Mail size={18} />}
          required
          disabled={loading}
        />
        
        <Input
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Choose a password"
          leftIcon={<Lock size={18} />}
          required
          disabled={loading}
        />
        
        <Button
          type="submit"
          className="w-full"
          isLoading={loading}
          disabled={loading}
        >
          Create Account
        </Button>
        
        <p className="text-center text-slate-400 mt-4">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-orange-500 hover:text-orange-600">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;