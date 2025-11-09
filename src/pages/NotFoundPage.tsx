// src/pages/NotFoundPage.tsx

import React, { useState, useEffect } from 'react'; // <-- NEW: Added useState, useEffect
import { Link }_from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';

// --- NEW: Random messages ---
const funnyMessages = [
  "We're not sure how you got here. Why are you here? This page doesn't exist.",
  "You've found a page that isn't a page. Are you proud of yourself? The void is looking back.",
  "404. You broke it. Or maybe you're just lost. Either way, this is... probably on you. Go back home.",
  "This page has been redacted by the Ministry. Stop poking around where you don't belong.",
  "You zigged. You should have zagged. Now you're in the 404 dimension. Population: you.",
];
// --- END NEW ---

export const NotFoundPage = () => {
  // --- NEW: State to hold the random message ---
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Pick a random message on component mount
    const randomIndex = Math.floor(Math.random() * funnyMessages.length);
    setMessage(funnyMessages[randomIndex]);
  }, []);
  // --- END NEW ---

  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full flex-col items-center justify-center space-y-6 text-center p-4">
      <AlertTriangle className="h-24 w-24 text-orange-400" />
      <h1 className="text-6xl font-bold text-white">404</h1>
      {/* --- FIX: Updated header --- */}
      <h2 className="text-3xl font-medium text-gray-300">
        Well, this is awkward.
      </h2>
      {/* --- FIX: Use random message state --- */}
      <p className="max-w-md text-lg text-gray-400">
        {message}
      </p>
      <div>
        <Button as={Link} to="/" size="lg" variant="game">
          <Home className="mr-2 h-5 w-5" />
          Go Back Home
        </Button>
      </div>
    </div>
  );
};