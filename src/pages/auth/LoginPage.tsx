import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Mail, Lock } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    // Note: Redirect is handled by App.tsx useEffect based on user role
    
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "'CustomHeading', 'Quicksand', system-ui, sans-serif" }}
        >
          Welcome Back
        </h1>
        <p 
          className="text-slate-400 mt-2"
          style={{ fontFamily: "'Quicksand', system-ui, sans-serif" }}
        >
          Sign in to continue to One Mind, Many
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <p 
            className="text-red-500"
            style={{ fontFamily: "'Quicksand', system-ui, sans-serif" }}
          >
            {error}
          </p>
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
          disabled={isLoading}
        />

        <Input
          type="password"
          label="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Enter your password"
          leftIcon={<Lock size={18} />}
          required
          disabled={isLoading}
        />

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
        >
          Sign In
        </Button>

        <p 
          className="text-center text-slate-400"
          style={{ fontFamily: "'Quicksand', system-ui, sans-serif" }}
        >
          Don't have an account?{' '}
          <Link 
            to="/auth/register" 
            className="text-orange-500 hover:text-orange-600"
            style={{ fontFamily: "'CustomHeading', 'Quicksand', system-ui, sans-serif" }}
          >
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;