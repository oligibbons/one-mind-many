// src/pages/HomePage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../hooks/useAuth';
import { ArrowRight, UserCheck } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center p-8 text-center">
      {/* 64px is the height of the Navbar */}
      <Logo className="mb-6 h-32 w-auto text-orange-500" />
      
      <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
        One Mind, Many
      </h1>
      
      <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300 sm:text-xl">
        A social deduction game where conflicting secret agendas are enforced
        by a rotating turn order to control one shared pawn.
      </p>

      {user ? (
        // User is logged in
        <Button as={Link} to="/menu" size="lg" className="text-lg">
          <UserCheck className="mr-2 h-5 w-5" />
          Go to Main Menu
        </Button>
      ) : (
        // User is logged out
        <div className="flex space-x-4">
          <Button as={Link} to="/register" size="lg" className="text-lg">
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            as={Link}
            to="/login"
            size="lg"
            variant="outline"
            className="text-lg"
          >
            Log In
          </Button>
        </div>
      )}
    </div>
  );
};