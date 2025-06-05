import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      navigate('/game');
    }
  }, [user, navigate]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
        <p className="text-slate-400 mt-2">Sign in to continue to One Mind, Many</p>
      </div>
      
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          style: {
            button: {
              background: '#f97316',
              color: 'white',
              borderRadius: '6px',
            },
            input: {
              background: 'rgb(30 41 59 / 0.5)',
              color: 'white',
              borderColor: 'rgb(51 65 85)',
            },
            label: {
              color: 'rgb(203 213 225)',
            },
          },
        }}
        theme="dark"
        providers={[]}
        redirectTo={`${window.location.origin}/game`}
        view="sign_in"
      />
    </div>
  );
};

export default LoginPage;