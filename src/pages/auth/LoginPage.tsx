import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log('Attempting to log in...');
    setLoading(true);
    setError('');

    try {
      console.log('Calling supabase.auth.signInWithPassword()');
      const { data: session, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login response:', session, 'Error:', loginError);
      if (loginError) throw loginError;

      console.log('Login successful. User session:', session);
    } catch (err: any) {
      console.error('Login error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      console.log('Login attempt finished.');
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default LoginPage;
