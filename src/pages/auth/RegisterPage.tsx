import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

const RegisterPage = () => {
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
        <h1 className="text-2xl font-bold text-white">Create an Account</h1>
        <p className="text-slate-400 mt-2">Join One Mind, Many to start playing</p>
      </div>
      
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#f97316',
                brandAccent: '#ea580c',
                inputBackground: 'rgb(30 41 59 / 0.5)',
                inputText: 'white',
                inputBorder: 'rgb(51 65 85)',
                inputBorderHover: '#f97316',
                inputBorderFocus: '#f97316',
              },
            },
          },
          className: {
            container: 'supabase-auth-ui',
            button: 'supabase-auth-ui__button',
            input: 'supabase-auth-ui__input',
            label: 'supabase-auth-ui__label',
          },
        }}
        theme="dark"
        providers={[]}
        redirectTo={`${window.location.origin}/game`}
        view="sign_up"
      />
    </div>
  );
};

export default RegisterPage;