// src/pages/HowToPlayPage.tsx

import React from 'react';
import {
  Brain,
  EyeOff,
  Target,
  Users,
  AlertTriangle,
  HelpCircle,
  Clock,
  Send,
  Shuffle,
  Search,
  Move,
  Hand,
  Zap,
  Award,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Hourglass,
  Check,
  ArrowRight,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import clsx from 'clsx';

// --- Reusable Helper Components for this Page ---

// A header with an icon
const IconHeader: React.FC<{
  icon: React.ElementType;
  title: string;
  className?: string;
}> = ({ icon: Icon, title, className = 'text-orange-400' }) => (
  <div className="flex items-center space-x-3">
    <Icon className={clsx('h-8 w-8 flex-shrink-0', className)} />
    <h2 className="text-3xl font-bold text-white">{title}</h2>
  </div>
);

// A card for a single step
const StepCard: React.FC<{
  number: string;
  title: string;
  children: React.ReactNode;
}> = ({ number, title, children }) => (
  <div className="flex space-x-6">
    <div className="flex flex-col items-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-orange-400 bg-gray-900 text-2xl font-bold text-orange-400">
        {number}
      </div>
      <div className="h-full w-0.5 flex-1 bg-gray-700" />
    </div>
    <div className="flex-1 pb-16">
      <h3 className="mb-3 text-2xl font-semibold text-white">{title}</h3>
      <p className="text-lg text-gray-300">{children}</p>
    </div>
  </div>
);

// A card for explaining a role
const RoleCard: React.FC<{
  icon: React.ElementType;
  title: string;
  color: string;
  description: string;
}> = ({ icon: Icon, title, color, description }) => (
  <Card className={clsx('border-2 bg-gray-800', color)}>
    <CardHeader className="flex flex-row items-center space-x-3 p-4">
      <Icon className="h-6 w-6 flex-shrink-0" />
      <CardTitle className="text-xl">{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-4 pt-0 text-gray-300">
      {description}
    </CardContent>
  </Card>
);

// A "visual" for the fake Command Card
const FakeCommandCard: React.FC<{ name: string; effect: string }> = ({
  name,
  effect,
}) => (
  <Card className="h-40 w-32 bg-gray-800 border-gray-700 shadow-lg">
    <CardHeader className="p-2">
      <CardTitle className="text-base text-orange-400">{name}</CardTitle>
    </CardHeader>
    <CardContent className="p-2">
      <p className="text-sm text-gray-300">{effect}</p>
    </CardContent>
  </Card>
);

// A "visual" for the fake Priority Track
const FakePriorityTracker: React.FC<{
  id: string;
  icon: React.ElementType;
  status: 'pending' | 'submitted' | 'active';
}> = ({ id, icon: Icon, status }) => (
  <div
    className={clsx(
      'flex h-12 w-28 items-center justify-between rounded-md border-2 p-3 shadow-inner',
      status === 'active' && 'border-orange-500 bg-orange-900/30',
      status !== 'active' && 'border-gray-700 bg-gray-800',
      status === 'pending' && 'opacity-60'
    )}
  >
    <span className="text-sm font-bold text-gray-300">{id}</span>
    <div
      className={clsx(
        'flex h-6 w-6 items-center justify-center rounded-full',
        status === 'submitted' && 'bg-green-500 text-gray-900',
        status === 'pending' && 'bg-gray-700 text-gray-400',
        status === 'active' && 'bg-orange-400 text-gray-900'
      )}
    >
      {status === 'submitted' && <Check size={16} />}
      {status === 'pending' && <Hourglass size={14} />}
      {status === 'active' && <Icon size={16} />}
    </div>
  </div>
);

// --- The Main Page Component ---

export const HowToPlayPage: React.FC = () => {
  return (
    <div className="w-full bg-gray-950 text-gray-200">
      {/* Header */}
      <section className="bg-gray-900 py-16 px-6 text-center">
        <h1 className="text-5xl font-bold text-white">How to Play</h1>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400">
          Welcome to the Benevolent Order. Your goal is simple: have the most
          Victory Points (VP) by the time the game ends. How you get them...
          is a secret.
        </p>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl p-6">
        {/* === SECTION 1: YOUR SECRET IDENTITY === */}
        <IconHeader icon={EyeOff} title="Your Secret Identity" />
        <p className="mt-4 mb-8 text-lg text-gray-300">
          At the start of each game, you are secretly given{' '}
          <strong className="text-white">three</strong> things. These define
          who you are, what you want, and when you act. Never reveal them.
        </p>

        <div className="relative">
          <StepCard number="1" title="The Role (Your Agenda)">
            Your Role is your main objective. It determines which game-ending
            condition you are trying to achieve. There are three possibilities:
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <RoleCard
                icon={HelpCircle}
                title="True Believer"
                color="border-green-500"
                description="Your goal is to fulfill the main Prophecy (e.g., land on a specific space and Interact)."
              />
              <RoleCard
                icon={AlertTriangle}
                title="Heretic"
                color="border-red-500"
                description="Your goal is to trigger the Doomsday Condition (e.g., land on a specific 'hazard' space)."
              />
              <RoleCard
                icon={ShieldQuestion}
                title="Opportunist"
                color="border-blue-500"
                description="You ignore the main conflict. Your goal is to complete your *own* secret personal goal."
              />
            </div>
          </StepCard>

          <StepCard number="2" title="The Sub-Role (Your Bonus)">
            Your Sub-Role provides a unique way to score bonus VP during the
            game.
            <br />
            <br />
            For example,{' '}
            <strong className="text-white">The Waster</strong> might gain +5 VP
            every time the Harbinger doesn't move at all in a round.
            <strong className="text-white"> The Fixer</strong> might gain +5 VP
            for removing a negative Complication.
            <br />
            <br />
            Pay attention to your Sub-Role to maximize your score.
          </StepCard>

          <StepCard number="3" title="The Identity (Your Token)">
            Your Identity (e.g.,{' '}
            <strong className="text-white">"The Eye"</strong>,{' '}
            <strong className="text-white">"The Hand"</strong>) is a public
            token in the <strong className="text-white">Priority Track</strong>
            .
            <br />
            <br />
            Only <strong className="text-white">you</strong> know which token
            is yours. This token determines <strong className="text-white">
              WHEN
            </strong>{' '}
            your action resolves.
          </StepCard>
        </div>

        {/* === SECTION 2: THE GAME ROUND === */}
        <IconHeader icon={Clock} title="The Game Round" className="mt-16" />
        <p className="mt-4 mb-8 text-lg text-gray-300">
          The game is played in rounds. Each round has four phases.
        </p>

        <div className="relative">
          <StepCard number="1" title="The Plan">
            Look at the board, your hand of 4 Command Cards, and your secret
            goals. Decide what you want to do. Do you move towards your goal?
            Sabotage another player? Or play a card to gather information?
          </StepCard>

          <StepCard number="2" title="The Submission">
            Everyone secretly selects and "locks in" one Command Card from
            their hand.
            <br />
            <br />
            <div className="flex space-x-4">
              <FakeCommandCard name="Move 3" effect="Move 3 spaces." />
              <FakeCommandCard
                name="Deny"
                effect="Prevent the next action from having any effect."
              />
            </div>
          </StepCard>

          <StepCard number="3" title="The Resolution (The Core!)">
            This is the heart of the game. The{' '}
            <strong className="text-white">Priority Track</strong> at the top
            of the screen shows the public Identity Tokens.
            <br />
            <br />
            <strong className="text-orange-400">
              Actions resolve one by one, from Priority 1 to the end.
            </strong>
            <br />
            <br />
            <div className="space-y-3 rounded-lg bg-gray-900 p-4">
              <p className="text-sm text-gray-400">
                EXAMPLE: It's the start of the Resolution phase...
              </p>
              <div className="flex flex-wrap gap-2">
                <FakePriorityTracker
                  id="The Eye"
                  icon={User}
                  status="active"
                />
                <FakePriorityTracker
                  id="The Hand"
                  icon={User}
                  status="submitted"
                />
                <FakePriorityTracker
                  id="The Key"
                  icon={User}
                  status="pending"
                />
              </div>
              <p className="text-gray-300">
                1. <strong className="text-white">"The Eye"</strong> is in
                Priority 1. Their card is revealed and resolves first.
                <br />
                2. After it's done,{' '}
                <strong className="text-white">"The Hand"</strong> resolves.
                <br />
                3. Then, <strong className="text-white">"The Key"</strong>{' '}
                resolves.
              </p>
              <hr className="border-gray-700" />
              <p className="text-gray-300">
                <strong className="text-orange-400">
                  At the end of the round, the track rotates.
                </strong>{' '}
                Priority 1 ("The Eye") moves to the *end* of the line, and
                "The Hand" becomes the new Priority 1 for the next round.
              </p>
            </div>
          </StepCard>

          <StepCard number="4" title="The Deduction">
            This is the *real* game. You just saw{' '}
            <strong className="text-white">"The Eye"</strong> play a{' '}
            <strong className="text-white">`Move 3`</strong> card that sent
            the Harbinger right into a hazard.
            <br />
            <br />
            You know <strong className="text-white">what</strong> happened,
            but you don't know <strong className="text-white">who</strong>{' '}
            controls "The Eye". Was it a mistake? Or was it sabotage?
            <br />
            <br />
            Use the chat, watch your suspects, and remember: your token is
            always changing position.
          </StepCard>
        </div>

        {/* === SECTION 3: CORE CONCEPTS === */}
        <IconHeader
          icon={Brain}
          title="Core Concepts"
          className="mt-16"
        />

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <Card className="border-gray-700 bg-gray-900">
            <CardHeader>
              <IconHeader icon={Move} title="Moving the Harbinger" />
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>
                Movement is complex. Move cards give you a total number of
                Movement Points (MP), which are spent on a mix of straight
                (orthogonal) and diagonal steps.
              </p>
              <p>
                The key rule is:
                <strong className="text-white">
                  {' '}
                  You must spend at least half of your steps moving straight.
                </strong>
              </p>
              <ul className="list-disc space-y-2 pl-5 text-white">
                <li>
                  <strong className="text-orange-400">Move 1</strong> = 1 MP (1
                  straight, 0 diagonal)
                </li>
                <li>
                  <strong className="text-orange-400">Move 2</strong> = 2 MP (1
                  straight, 1 diagonal)
                </li>
                <li>
                  <strong className="text-orange-400">Move 3</strong> = 3 MP (2
                  straight, 1 diagonal)
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-gray-700 bg-gray-900">
            <CardHeader>
              <IconHeader icon={Hand} title="Interacting" />
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>
                Playing an <strong className="text-white">`Interact`</strong>{' '}
                card lets you use things on the Harbinger's current space.
              </p>
              <ul className="list-disc space-y-2 pl-5 text-white">
                <li>
                  <strong className="text-orange-400">Objects:</strong>{' '}
                  One-time use items. Their effects are powerful and often
                  random.
                </li>
                <li>
                  <strong className="text-orange-400">NPCs:</strong>{' '}
                  Characters on the board. Interacting with them is a gamble
                  with a random positive or negative outcome.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <Card className="mt-8 border-gray-700 bg-gray-900">
          <CardHeader>
            <IconHeader icon={Zap} title="Modifiers & Complications" />
          </CardHeader>
          <CardContent className="space-y-4 text-gray-300">
            <p>
              Many cards modify other actions.{' '}
              <strong className="text-white">`Charge`</strong> makes the next
              Move card stronger, while{' '}
              <strong className="text-white">`Deny`</strong> cancels the
              next action entirely.
            </p>
            <p>
              <strong className="text-red-400">Complications</strong> are
              random events that add new rules to the board, like "All Move
              cards have -1 value" or "A stalker is now following the
              Harbinger."
            </p>
          </CardContent>
        </Card>

        {/* === SECTION 4: HOW TO WIN === */}
        <IconHeader icon={Award} title="How to Win" className="mt-16" />
        <p className="mt-4 mb-8 text-lg text-gray-300">
          The game ends immediately when one of the main goals is completed:
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <RoleCard
            icon={ShieldCheck}
            title="Prophecy Fulfilled"
            color="border-green-700"
            description="A True Believer succeeds. All True Believers get +20 VP."
          />
          <RoleCard
            icon={ShieldAlert}
            title="Doomsday Triggered"
            color="border-red-700"
            description="A Heretic succeeds. All Heretics get +20 VP."
          />
          <RoleCard
            icon={ShieldQuestion}
            title="Opportunist Goal Met"
            color="border-blue-700"
            description="An Opportunist completes their personal goal. They get +30 VP."
          />
        </div>
        <p className="mt-8 text-center text-2xl font-bold text-white">
          After the game ends, all players reveal their secret Roles and
          Sub-Roles.
        </p>
        <p className="mt-4 text-center text-xl text-gray-300">
          Final scores are calculated:
        </p>
        <p className="mt-2 text-center text-3xl font-bold text-orange-400">
          Main Goal VP + Sub-Role VP = Total VP
        </p>
        <p className="mt-4 text-center text-2xl font-bold text-white">
          The player with the highest individual VP wins!
        </p>
      </div>
    </div>
  );
};