// src/pages/HomePage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/ui/Logo';
import {
  Users,
  EyeOff,
  Brain,
  HelpCircle,
  AlertTriangle,
  Target,
  ArrowRight,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="w-full bg-gray-900 text-gray-200">
      {/* Hero Section */}
      <section className="flex min-h-[calc(100vh-80px)] w-full flex-col items-center justify-center bg-gray-950 px-6 text-center">
        <div className="mb-8">
          <Logo width={400} />
        </div>
        <h1 className="text-5xl font-bold text-white md:text-6xl">
          One Pawn. Many Minds.
        </h1>
        <p className="mt-6 max-w-2xl text-xl text-gray-400">
          A social deduction game of conflicting agendas and hidden motives.
          Control a single shared pawn, but trust no one.
        </p>
        <Button as={Link} to={user ? '/menu' : '/login'} size="lg" className="mt-10 text-lg">
          {user ? 'Enter the Order' : 'Play Now'}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-900 py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-4xl font-bold text-white">
            How It Works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<Users className="h-10 w-10 text-orange-400" />}
              title="Share One Mind"
              description="You and your fellow players all control a single pawn, The Harbinger. Every move is a collective, chaotic decision."
            />
            <FeatureCard
              icon={<EyeOff className="h-10 w-10 text-orange-400" />}
              title="Play Secret Actions"
              description="Each round, secretly play an action. Will you help the group, hinder them, or pursue your own bizarre goals?"
            />
            <FeatureCard
              icon={<Brain className="h-10 w-10 text-orange-400" />}
              title="Deduce Their Motives"
              description="Actions resolve in a hidden, rotating order. You know *what* just happened, but not *who* did it. Watch the tokens, trust no one."
            />
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="bg-gray-950 py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-4xl font-bold text-white">
            Trust is a Liability
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<HelpCircle className="h-10 w-10 text-blue-400" />}
              title="The True Believer"
              description="You must fulfill the Prophecy. Guide the Harbinger to its destination against all odds. They think you're helping, but you know the truth."
            />
            <FeatureCard
              icon={<AlertTriangle className="h-10 w-10 text-red-400" />}
              title="The Heretic"
              description="The Prophecy is a lie. You must ensure the Harbinger meets the Doomsday Condition. Cause chaos, misdirect, and sabotage the mission."
            />
            <FeatureCard
              icon={<Target className="h-10 w-10 text-green-400" />}
              title="The Opportunist"
              description="Who cares about some prophecy? You have your own secret goals, and they're worth far more. Play both sides and claim your own victory."
            />
          </div>
        </div>
      </section>

      {/* Thematic Section */}
      <section className="bg-gray-900 py-20 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-white">
            Welcome to the B.O.Z.O.s
          </h2>
          <p className="mt-6 text-xl text-gray-400">
            The Benevolent Order of Zany Obligations.
          </p>
          <p className="mt-4 text-lg text-gray-300">
            We believe the fate of existence depends on... bizarrely mundane
            tasks. Like guiding an unwitting accountant to deliver an offering
            to a sleeping vagrant.
          </p>
          <p className="mt-4 text-lg font-bold text-orange-400">
            It's very, very important.
          </p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gray-950 py-20 px-6 text-center">
        <h2 className="text-4xl font-bold text-white">Ready to Join?</h2>
        <p className="mt-4 text-xl text-gray-400">
          The Order is waiting.
        </p>
        <Button as={Link} to={user ? '/menu' : '/login'} size="lg" className="mt-10 text-lg">
          {user ? 'View Main Menu' : 'Create Your Account'}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </section>
    </div>
  );
};

// Helper component for feature cards
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
}) => (
  <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-900">
      {icon}
    </div>
    <h3 className="mb-3 text-2xl font-bold text-white">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);