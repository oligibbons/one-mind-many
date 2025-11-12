// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
// --- FIX: Do NOT import or call this here ---
// import { initializeCurrentPlayerStore } from './stores/useCurrentPlayerStore';

// --- FIX: This call is being moved to App.tsx ---
// initializeCurrentPlayerStore();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);