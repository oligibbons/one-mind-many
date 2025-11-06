import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { useGameStore } from '../../stores/useGameStore';
import { usePlayerContextStore } from '../../stores/usePlayerContextStore';
import { Scenario, GameState, GamePlayer } from '../../types/game';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';

// Import all the game components
import { GameBoard } from '../../components/game/GameBoard';
import { PriorityTrack } from '../../components/game/PriorityTrack';
import { ComplicationTrack } from '../../components/game/ComplicationTrack';
import { PlayerHand } from '../../components/game/PlayerHand';
import { PrivateDashboard } from '../../components/game/PrivateDashboard';
import { ChatBox } from '../../components/game/ChatBox';
import { InGameMenuModal } from '../../components/game/InGameMenuModal';
import { RulesReferenceModal } from '../../components/game/RulesReferenceModal';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';

/**
 * Generates a complete dummy game state for the sandbox.
 */
const generateDummyState = (
  scenario: Scenario,
  adminUser: GamePlayer['profile']
) => {
  // 1. Create Dummy Players
  const adminPlayer: GamePlayer = {
    id: adminUser.id,
    username: adminUser.username || 'Admin Player',
    vp: 0,
    hand: [
      { id: 'action_1', name: 'Sample Action', type: 'global' },
      { id: 'action_2', name: 'Test Scenario Action', type: 'scenario' },
      { id: 'action_3', name: 'Another Action', type: 'global' },
    ],
    role: 'Seeker',
    sub_role: 'Default',
    secret_identity: 'Not set',
    personal_goal: { title: 'Test Goal', description: 'Survive.' },
    is_ready: true,
    is_disconnected: false,
    submitted_action: null,
    profile: adminUser,
  };

  const dummyPlayers: GamePlayer[] = [
    adminPlayer,
    {
      id: 'dummy-2',
      username: 'Dummy-Harbinger',
      vp: 0,
      hand: [],
      role: 'Harbinger',
      sub_role: 'Default',
      secret_identity: 'Not set',
      personal_goal: { title: 'Test Goal', description: '...' },
      is_ready: true,
      is_disconnected: false,
      submitted_action: null,
      profile: { id: 'dummy-2', username: 'Dummy-Harbinger' },
    },
    {
      id: 'dummy-3',
      username: 'Dummy-Opportunist',
      vp: 0,
      hand: [],
      role: 'Opportunist',
      sub_role: 'Default',
      secret_identity: 'Not set',
      personal_goal: { title: 'Test Goal', description: '...' },
      is_ready: true,
      is_disconnected: false,
      submitted_action: null,
      profile: { id: 'dummy-3', username: 'Dummy-Opportunist' },
    },
    {
      id: 'dummy-4',
      username: 'Dummy-Seeker-2',
      vp: 0,
      hand: [],
      role: 'Seeker',
      sub_role: 'Default',
      secret_identity: 'Not set',
      personal_goal: { title: 'Test Goal', description: '...' },
      is_ready: true,
      is_disconnected: false,
      submitted_action: null,
      profile: { id: 'dummy-4', username: 'Dummy-Seeker-2' },
    },
  ];

  // 2. Create Dummy Game State
  const dummyGameState: GameState = {
    id: 'test-game',
    host_id: 'admin',
    scenario_id: scenario.id,
    status: 'active',
    current_round: 1,
    harbinger_position: [
      { x: Math.floor(scenario.board_size_x / 2), y: 0, id: 'harbinger' },
    ],
    stalker_position: { x: 0, y: 0 },
    priority_track: dummyPlayers.map((p) => ({
      id: p.id,
      username: p.username,
    })),
    active_complications: ['Test Complication 1', 'Test Complication 2'],
    game_log: [
      {
        type: 'system',
        message: 'Test game sandbox initialized.',
        timestamp: new Date().toISOString(),
      },
      {
        type: 'info',
        message: `Scenario "${scenario.name}" loaded.`,
        timestamp: new Date().toISOString(),
      },
    ],
    game_objects: scenario.locations || [], // Use real locations from scenario
    npcs: [],
    board_modifiers: { swapped: [], impassable: [] },
    is_public: false,
    lobby_code: 'TEST',
    scenario: scenario, // Embed the full scenario
  };

  // 3. Reset and Populate Stores
  useGameStore.getState().reset();
  usePlayerContextStore.getState().reset();

  useGameStore.getState().setPlayers(dummyPlayers);
  useGameStore.getState().setGameState(dummyGameState);
  usePlayerContextStore.getState().setPlayerId(adminPlayer.id);

  toast.success(`Test sandbox loaded for "${scenario.name}"!`);
};

/**
 * The Sandbox component that renders the full game UI.
 */
const TestGameSandbox: React.FC<{
  scenario: Scenario;
  onExit: () => void;
}> = ({ scenario, onExit }) => {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  useEffect(() => {
    if (scenario && user?.profile) {
      // Generate the dummy state when the component mounts
      generateDummyState(scenario, user.profile);
    }
    
    // On unmount, clear the stores
    return () => {
      useGameStore.getState().reset();
      usePlayerContextStore.getState().reset();
    };
  }, [scenario, user]);

  if (!user?.profile) {
    return <LoadingSpinner />;
  }

  // This layout is copied from GamePage.tsx to ensure an identical view
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Bar (with exit button) */}
      <div className="bg-gray-800 p-2 flex justify-between items-center shadow-md z-10">
        <Button onClick={onExit} variant="secondary" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Exit Sandbox
        </Button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-white">
            {scenario.name} (Sandbox Mode)
          </h1>
          <p className="text-sm text-gray-400">Round 1</p>
        </div>
        <div>
          <Button
            onClick={() => setIsRulesOpen(true)}
            variant="secondary"
            size="sm"
            className="mr-2"
          >
            Rules
          </Button>
          <Button
            onClick={() => setIsMenuOpen(true)}
            variant="secondary"
            size="sm"
          >
            Menu
          </Button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-1/4 flex-shrink-0 bg-gray-900 overflow-y-auto p-2 space-y-2">
          <PriorityTrack />
          <ComplicationTrack />
          <ChatBox gameId="test-game" />
        </div>

        {/* Center Panel (Board) */}
        <div className="flex-1 flex items-center justify-center overflow-hidden bg-gray-800 p-2">
          <GameBoard />
        </div>

        {/* Right Panel */}
        <div className="w-1/4 flex-shrink-0 bg-gray-900 overflow-y-auto p-2">
          <PrivateDashboard />
        </div>
      </div>

      {/* Bottom Panel (Hand) */}
      <div className="flex-shrink-0 bg-gray-950 p-2 shadow-inner">
        <PlayerHand />
      </div>

      {/* Modals (Read-only, no real function) */}
      <InGameMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onViewRules={() => {
          setIsMenuOpen(false);
          setIsRulesOpen(true);
        }}
      />
      <RulesReferenceModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />
    </div>
  );
};

/**
 * The main page component for selecting a scenario.
 */
const TestGameViewPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('scenarios')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setScenarios(data || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch scenarios.');
        toast.error(err.message || 'Failed to fetch scenarios.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchScenarios();
  }, []);

  const handleStartSandbox = () => {
    const scenarioToLoad = scenarios.find((s) => s.id === selectedScenarioId);
    if (scenarioToLoad) {
      setActiveScenario(scenarioToLoad);
    } else {
      toast.error('Please select a valid scenario.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  // The Game Sandbox View
  if (activeScenario) {
    return (
      <div className="h-full w-full bg-gray-900 text-white">
        <TestGameSandbox
          scenario={activeScenario}
          onExit={() => {
            setActiveScenario(null);
            toast.info('Exited sandbox mode.');
          }}
        />
      </div>
    );
  }

  // The Scenario Selector View
  return (
    <div className="container mx-auto p-4 text-center">
      <h1
        className="text-4xl font-extrabold mb-10 text-orange-500"
        style={{ fontFamily: "'CustomHeading', system-ui, sans-serif" }}
      >
        Game Sandbox
      </h1>
      <Card className="max-w-md mx-auto p-6 bg-slate-800">
        <h2 className="text-xl font-semibold text-white mb-4">
          Select a Scenario to Test
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          This will load the game UI in a 'read-only' sandbox mode using the
          selected scenario's data. No game logic will be active.
        </p>
        <div className="flex flex-col space-y-4">
          <Select
            value={selectedScenarioId}
            onChange={(e) => setSelectedScenarioId(e.target.value)}
            className="bg-gray-900 text-white"
          >
            <option value="" disabled>
              -- Choose a scenario --
            </option>
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </Select>
          <Button
            onClick={handleStartSandbox}
            disabled={!selectedScenarioId}
            className="w-full"
          >
            Load Sandbox
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TestGameViewPage;