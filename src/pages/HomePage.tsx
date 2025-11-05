// src/pages/HomePage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
// import { Logo } from '../components/ui/Logo'; // No longer using the Logo component here
import {
  Users,
  EyeOff,
  Brain,
  HelpCircle,
  AlertTriangle,
  Target,
  ArrowRight,
  Key, // Added for the new section
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="w-full bg-gray-900 text-gray-200">
      {/* Hero Section */}
      <section className="flex min-h-[calc(100vh-80px)] w-full flex-col items-center justify-center bg-gray-950 px-6 text-center">
        {/* --- MODIFIED: Replaced Logo with animated Orange Icon --- */}
        <div className="mb-8">
          <img
            src="/OneMindMany Icon PNG Orange.png"
            alt="G.I.M.P. Sigil"
            width="250"
            height="250"
            className="animate-[floating_6s_ease-in-out_infinite]"
          />
        </div>
        {/* --- END MODIFICATION --- */}

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

      {/* --- NEW: Thematic Concept Section --- */}
      <section className="bg-gray-900 py-20 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Key className="mx-auto h-16 w-16 text-orange-400" />
          <h2 className="mt-6 text-4xl font-bold text-white">
            The Apocalypse is a Trivial Matter
          </h2>
          <p className="mt-6 text-xl text-gray-300">
            As a Guardian of Ineffable Manifest Power (G.I.M.P.), you know the
            truth: the fabric of reality is held together by mundane tasks.
          </p>
          <p className="mt-4 text-xl text-gray-300">
            You and your fellow "Guardians" must collectively guide a single,
            unwitting mortal—The Harbinger—to complete these sacred chores.
            Guiding this pawn to file his taxes or buy milk isn't just a goal...
            it's the *only* thing preventing total annihilation.
          </p>
          <Button
            as={Link}
            to={user ? '/menu' : '/login'}
            size="lg"
            className="mt-10 text-lg"
          >
            Avert Doomsday
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
      {/* --- END NEW SECTION --- */}

      {/* How It Works Section */}
      <section className="bg-gray-950 py-20 px-6"> {/* Changed color for contrast */}
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
      <section className="bg-gray-900 py-20 px-6"> {/* Changed color for contrast */}
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

      {/* Thematic Section --- MODIFIED --- */}
      <section className="bg-gray-950 py-20 px-6"> {/* Changed color for contrast */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-white">
            Welcome to the G.I.M.P.
          </h2>
          <p className="mt-6 text-xl text-gray-400">
            Guardians of Ineffable Manifest Power.
          </p>
          <p className="mt-4 text-lg text-gray-300">
            "We are the G.I.M.P, bearers of the Ineffable Manifest Power: the
            sacred force that makes prophecy real through perfect, ordained
            action. Every chore is a sigil. Every checklist, a covenant. The
            apocalypse trembles before a well-folded sheet.”
          </p>
          <p className="mt-4 text-lg font-bold text-orange-400">
            It's very, very important.
          </p>
        </div>
      </section>
      {/* --- END MODIFICATION --- */}


      {/* Final CTA Section */}
      <section className="bg-gray-900 py-20 px-6 text-center"> {/* Changed color for contrast */}
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

