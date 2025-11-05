// src/components/game/RulesReferenceModal.tsx

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  Brain, EyeOff, Target, AlertTriangle, HelpCircle, Clock,
  Move, Hand, Zap, Award, ShieldCheck, ShieldAlert, ShieldQuestion,
  User, Check, Hourglass, X
} from 'lucide-react';
import clsx from 'clsx';

interface RulesReferenceModalProps {
  onClose: () => void;
}

// --- Reusable Helper Components (Copied from HowToPlayPage) ---

const IconHeader: React.FC<{
  icon: React.ElementType;
  title: string;
  className?: string;
}> = ({ icon: Icon, title, className = 'text-orange-400' }) => (
  <div className="flex items-center space-x-3">
    <Icon className={clsx('h-6 w-6 flex-shrink-0', className)} />
    <h2 className="text-2xl font-bold text-white">{title}</h2>
  </div>
);

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

export const RulesReferenceModal: React.FC<RulesReferenceModalProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <Card
        className="game-card deep-shadow w-full max-w-4xl h-[90vh] flex flex-col slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl game-title">Rules Reference</CardTitle>
            <CardDescription className="text-gray-300">
              A quick guide to the game.
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </Button>
        </CardHeader>
        
        {/* --- Scrollable Content --- */}
        <CardContent className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {/* === SECTION 1: YOUR SECRET IDENTITY === */}
          <IconHeader icon={EyeOff} title="Your Secret Identity" />
          <p className="mt-4 mb-8 text-lg text-gray-300">
            At the start of each game, you are secretly given{' '}
            <strong className="text-white">three</strong> things:
          </p>
          <div className="space-y-4">
            <p><strong className="text-white">1. The Role (Your Agenda):</strong> Your main objective.</p>
            <div className="grid gap-4 md:grid-cols-3">
              <RoleCard
                icon={HelpCircle}
                title="True Believer"
                color="border-green-500"
                description="Fulfill the main Prophecy (e.g., land on a specific space)."
              />
              <RoleCard
                icon={AlertTriangle}
                title="Heretic"
                color="border-red-500"
                description="Trigger the Doomsday Condition (e.g., land on a 'hazard' space)."
              />
              <RoleCard
                icon={ShieldQuestion}
                title="Opportunist"
                color="border-blue-500"
                description="Ignore the main conflict and complete your *own* secret personal goal."
              />
            </div>
            <p><strong className="text-white">2. The Sub-Role (Your Bonus):</strong> A unique way to score bonus VP (e.g., "Gain +5 VP every time the Harbinger doesn't move").</p>
            <p><strong className="text-white">3. The Identity (Your Token):</strong> A public token in the <strong className="text-white">Priority Track</strong> (e.g., "The Eye"). Only you know which one is yours. This determines *when* your action resolves.</p>
          </div>

          {/* === SECTION 2: THE GAME ROUND === */}
          <IconHeader icon={Clock} title="The Game Round" className="mt-12" />
          <p className="mt-4 mb-8 text-lg text-gray-300">
            Each round has four phases:
          </p>
          <ol className="list-decimal space-y-4 pl-5 text-gray-300">
            <li><strong className="text-white">Plan:</strong> Look at your 4 Command Cards and secret goals.</li>
            <li><strong className="text-white">Submission:</strong> Secretly "lock in" one Command Card.</li>
            <li><strong className="text-white">Resolution:</strong> Actions resolve one by one according to the <strong className="text-orange-400">Priority Track</strong>. At the end of the round, the track rotates (Priority 1 moves to the end).</li>
            <li><strong className="text-white">Deduction:</strong> Watch what happens and who might be responsible.</li>
          </ol>
          
          {/* === SECTION 3: CORE CONCEPTS === */}
          <IconHeader icon={Brain} title="Core Concepts" className="mt-12" />
          
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <Card className="border-gray-700 bg-gray-900">
              <CardHeader><IconHeader icon={Move} title="Movement" /></CardHeader>
              <CardContent className="space-y-2 text-gray-300">
                <p>You must spend at least half of your steps moving straight (orthogonal).</p>
                <ul className="list-disc space-y-1 pl-5 text-white">
                  <li><strong className="text-orange-400">Move 1:</strong> 1 straight</li>
                  <li><strong className="text-orange-400">Move 2:</strong> 1 straight, 1 diagonal</li>
                  <li><strong className="text-orange-400">Move 3:</strong> 2 straight, 1 diagonal</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-900">
              <CardHeader><IconHeader icon={Hand} title="Interacting" /></CardHeader>
              <CardContent className="space-y-2 text-gray-300">
                <p>Playing an <strong className="text-white">`Interact`</strong> card lets you use things on the Harbinger's current space.</p>
                <ul className="list-disc space-y-1 pl-5 text-white">
                  <li><strong className="text-orange-400">Objects:</strong> One-time use items.</li>
                  <li><strong className="text-orange-400">NPCs:</strong> Characters with random outcomes.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          {/* === COMMAND CARDS === */}
          <Card className="mt-8 border-gray-700 bg-gray-900">
            <CardHeader><IconHeader icon={Hand} title="The Command Cards" /></CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <div className="overflow-x-auto">
                <table className="w-full min-w-full text-left">
                  <thead className="text-orange-400">
                    <tr>
                      <th className="py-2 pr-4 font-semibold">Card</th>
                      <th className="py-2 pr-4 font-semibold">Effect</th>
                      <th className="py-2 pl-4 font-semibold border-l border-gray-700">Card</th>
                      <th className="py-2 pr-4 font-semibold">Effect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700 text-gray-300">
                    <tr>
                      <td className="py-2 pr-4 font-medium text-white">Move 1, 2, 3</td>
                      <td className="py-2 pr-4">Move 1, 2, or 3 spaces.</td>
                      <td className="py-2 pl-4 font-medium text-white border-l border-gray-700">Homage</td>
                      <td className="py-2 pr-4">Repeat the previously resolved action.</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-white">Hesitate</td>
                      <td className="py-2 pr-4">Next Move card is -1 value.</td>
                      <td className="py-2 pl-4 font-medium text-white border-l border-gray-700">Foresight</td>
                      <td className="py-2 pr-4">Preemptively copy the next action.</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-white">Charge</td>
                      <td className="py-2 pr-4">Next Move card is +1 value.</td>
                      <td className="py-2 pl-4 font-medium text-white border-l border-gray-700">Deny</td>
                      <td className="py-2 pr-4">Prevent the next action from having any effect.</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-white">Rethink</td>
                      <td className="py-2 pr-4">Cancel the previously resolved action.</td>
                      <td className="py-2 pl-4 font-medium text-white border-l border-gray-700">Empower</td>
                      <td className="py-2 pr-4">If next is Move, increase value by +2.</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-white">Impulse</td>
                      <td className="py-2 pr-4">Move to a random adjacent space.</td>
                      <td className="py-2 pl-4 font-medium text-white border-l border-gray-700">Degrade</td>
                      <td className="py-2 pr-4">If next is Move, decrease value by -1.</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-white">Interact</td>
                      <td className="py-2 pr-4">Interact with Object/NPC on current space.</td>
                      <td className="py-2 pl-4 font-medium text-white border-l border-gray-700">Inhibit</td>
                      <td className="py-2 pr-4">The next Interact action will have no effect.</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-white">Buffer</td>
                      <td className="py-2 pr-4">Do Nothing.</td>
                      <td className="py-2 pl-4 font-medium text-white border-l border-gray-700">Gamble</td>
                      <td className="py-2 pr-4">All remaining actions are now randomly assigned...</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-white">Hail Mary</td>
                      <td className="py-2 pr-4">All players’ hands are now redrawn.</td>
                      <td className="py-2 pl-4 font-medium text-white border-l border-gray-700">Reload</td>
                      <td className="py-2 pr-4">Redraw your hand and play an action at random.</td>
                    </tr>
                    </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* === SECTION 4: HOW TO WIN === */}
          <IconHeader icon={Award} title="How to Win" className="mt-12" />
          <p className="mt-4 mb-8 text-lg text-gray-300">
            The game ends when a main goal is completed. VP is tallied. Highest individual VP wins.
          </p>
          <p className="mt-4 text-center text-xl text-brand-orange">
            Main Goal VP + Sub-Role VP = Total VP
          </p>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button className="game-button" onClick={onClose}>Close</Button>
        </CardFooter>
      </Card>
    </div>
  );
};