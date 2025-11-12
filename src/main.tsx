import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { initializeCurrentPlayerStore } from './stores/useCurrentPlayerStore';

// Initialize the store subscriptions before rendering the app
initializeCurrentPlayerStore();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);