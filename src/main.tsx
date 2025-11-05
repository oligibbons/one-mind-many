import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App'; // <-- FIX: Changed from default import 'App' to named import '{ App }'
import './index.css'; // Your global styles

// Supabase and API clients
import { supabase } from './lib/supabaseClient';
import { api } from './lib/api';
import { Session } from '@supabase/supabase-js';

// Setup Axios interceptor
// NOTE: Your 'api.ts' file uses 'fetch' and a different auth method.
// This interceptor logic is from my previous (incorrect) file.
// Your actual api.ts handles auth by getting the token from localStorage.
/*
api.interceptors.request.use(
  async (config) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
*/

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);