// src/pages/HowToPlayPage.tsx

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

const RuleSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <Card className="border-gray-700 bg-gray-800 text-gray-200">
    <CardHeader>
      <CardTitle className="text-xl text-orange-400">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4 text-gray-300">{children}</CardContent>
  </Card>
);

export const HowToPlayPage: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-4xl p-8 text-white">
      <Button
        as={Link}
        to="/menu"
        variant="outline"
        className="mb-6"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Menu
      </Button>

      <h1 className="mb-8 text-4xl font-bold">How to Play: One Mind, Many</h1>

      <div className="space-y-6">
        <RuleSection title="The Core Concept">
          <p>
            Welcome to the Benevolent Order of Zany Obligations (BOZOs). You are
            one of 3-6 players controlling a single shared pawn, The Harbinger.
            Your goal is to guide (or misguide) this pawn to fulfill a secret
            agenda.
          </p>
          <p>
            The problem? Every player has a different goal, and nobody knows
            who is who.
          </p>
        </RuleSection>

        <RuleSection title="1. The "Hidden Priority" System">
          <p>
            This is the heart of the game. At the start, each player is
            secretly dealt a <strong>Secret Identity</strong> (e.g., The Eye,
            The Hand).
          </p>
          <p>
            A matching set of <strong>Public Priority Tokens</strong> is
            placed on the Priority Track. This track shows the turn order for
            the round.
          </p>
          <p>
            Each round, all players secretly lock in an action card. Actions
            are then resolved one by one, starting with Priority 1.
          </p>
          <p>
            <strong>The Twist:</strong> At the end of the round, the #1 token
            rotates to the last slot. You only know *which token* just moved
            the pawn, not *which player* controls that token. Your job is to
            deduce who is who by watching their actions and matching them to
            their chat behavior.
          </p>
        </RuleSection>

        <RuleSection title="2. Player Roles & Agendas">
          <p>
            You will be secretly assigned one of three roles. There can be
            any number of each.
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong className="text-green-400">The True Believer:</strong>{' '}
              Wins if the Main Prophecy is fulfilled (+20 VP).
            </li>
            <li>
              <strong className="text-red-400">The Heretic:</strong> Wins if
              the Doomsday Condition is met (+20 VP).
            </li>
            <li>
              <strong className="text-blue-400">The Opportunist:</strong>{' '}
              Wins if their secret Personal Goal is met (+30 VP).
            </li>
          </ul>
          <p>
            You also get a <strong>Sub-Role</strong> for bonus points, like
            "The Guide" (VP for landing on Safe Zones) or "The Instigator"
            (VP for playing Deny cards).
          </p>
        </RuleSection>

        <RuleSection title="3. Movement: The Orthogonal Priority">
          <p>Movement is complex. All moves must follow two rules:</p>
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong>Orthogonal Priority:</strong> At least half (rounded up)
              of your total move *must* be in straight lines (N, S, E, W).
            </li>
            <li>
              <strong>Diagonal Tax:</strong> For every 2 MP your card
              generates, you unlock the ability to use 1 diagonal step.
            </li>
          </ul>
          <p className="font-bold">Examples:</p>
          <ul className="list-inside list-disc space-y-1 text-sm">
            <li>
              <strong>Move 1:</strong> 1 MP = 1 Orthogonal step. 0 Diagonal
              steps allowed.
            </li>
            <li>
              <strong>Move 2:</strong> 2 MP = 1 Orthogonal step (min), 1
              Diagonal step (max).
            </li>
            <li>
              <strong>Move 3:</strong> 3 MP = 2 Orthogonal steps (min), 1
              Diagonal step (max).
            </li>
            <li>
              <strong>Move 5:</strong> 5 MP = 3 Orthogonal steps (min), 2
              Diagonal steps (max).
            </li>
          </ul>
        </RuleSection>

        <RuleSection title="4. Complications, Objects & NPCs">
          <p>
            The board is a chaotic place.
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong>Complications:</strong> Random events that change the
              rules, like "Gaggle of Feral Youths" which makes areas of the
              board dangerous.
            </li>
            <li>
              <strong>Objects:</strong> Interact with these for powerful
              one-time effects, like "The Rubber Duck" (Move 1) or "The
              Other Sock" (all players redraw their hands).
            </li>
            <li>
              <strong>NPCs:</strong> Powerful characters with unpredictable
              effects. Interacting with "Gossip Karen" might let you see
              upcoming Complications, or it might move the Harbinger toward
              the Doomsday location.
            </li>
          </ul>
        </RuleSection>

        <RuleSection title="Winning the Game">
          <p>
            The game ends when a True Believer fulfills the Prophecy, a
            Heretic triggers the Doomsday, or an Opportunist completes their
            Personal Goal.
          </p>
          <p>
            When an end condition is met, all players reveal their Roles. The
            player(s) who completed their primary goal gain their massive VP
            bonus.
          </p>
          <p>
            All players tally their VP from Sub-Roles and Side Objectives. The
            player with the <strong>highest individual VP</strong> wins.
          </p>
          <p className="font-bold">
            Trust no one. Watch the tokens. And good luck.
          </p>
        </RuleSection>
      </div>
    </div>
  );
};