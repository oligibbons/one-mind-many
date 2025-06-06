import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleLogin = async () => {
    console.log('Attempting to log in...');
    setLoading(true);
    setError(null);

    try {
      console.log('Calling supabase.auth.signInWithPassword()');
      const { data: session, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login response:', session, 'Error:', loginError);
      if (loginError) throw loginError;

      if (session) {
        console.log('Login successful. Redirecting to /dashboard...');
        navigate('/dashboard');
      } else {
        console.error('Unexpected error: No session returned from Supabase.');
        setError('Unexpected error occurred. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error:', err.message);
      setError(err.message || 'An error occurred while logging in.');
    } finally {
      setLoading(false);
      console.log('Login attempt finished.');
    }
  };

  return (
    <div className="login-container">
      <h1>Login</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
      >
        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default LoginPage;
