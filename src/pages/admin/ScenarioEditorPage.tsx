// src/pages/admin/ScenarioEditorPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Scenario } from '../../types/game';
import JSONEditor from 'react-json-editor-ajrm'; // The editor you installed
// @ts-ignore
import locale from 'react-json-editor-ajrm/locale/en';
import { v4 as uuid } from 'uuid';

// A blank template for creating new scenarios
const BLANK_SCENARIO: Scenario = {
  id: uuid(),
  name: 'New Scenario',
  description: 'A brief description of the scenario.',
  is_published: false,
  board_size_x: 12,
  board_size_y: 12,
  locations: [{ name: 'Start', position: { x: 6, y: 6 } }],
  main_prophecy: {
    win_location: 'Start',
    win_action: 'Interact',
    trigger_message: 'PROPHECY FULFILLED!',
    winner: 'True Believer',
  },
  doomsday_condition: {
    lose_location: 'Start',
    trigger_message: 'DOOMSDAY!',
    winner: 'Heretic',
  },
  global_fail_condition: {
    lose_location: 'Start',
    max_round: 10,
    trigger_message: 'GLOBAL FAIL!',
    winner: 'Heretic',
  },
  complication_effects: {
    'Example Complication': { duration: 3, effect: 'Something bad happens.' },
  },
  object_effects: {
    'Example Object': { effect: 'Something cool happens.' },
  },
  npc_effects: {
    'Example NPC': { positive: 'Something good.', negative: 'Something bad.' },
  },
  opportunist_goals: {
    'Data Broker': [['Start', 'Start', 'Start']],
  },
  sub_role_definitions: {
    "The Guide": { "type": "location_vp", "location_tag": "Safe Zone", "vp": 5, "locations": ["Start"]},
    "The Fixer": { "type": "event_vp", "event": "complication_removed", "vp": 5},
    "The Instigator": { "type": "card_play_vp", "cards": ["Deny", "Rethink", "Gamble"], "vp": 5},
    "The Waster": { "type": "location_vp", "location_tag": "previous_space", "vp": 5},
    "The Mimic": { "type": "event_vp", "event": "copy_true_believer", "vp": 5}
  },
};

export const ScenarioEditorPage: React.FC = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false); // Track if JSON is valid

  useEffect(() => {
    if (!socket || !isConnected) return;

    // --- Socket Listeners ---
    const onScenarioDetails = (data: Scenario) => {
      setScenario(data);
      setLoading(false);
    };
    
    const onScenarioSaved = () => {
      navigate('/admin/scenarios'); // Go back to list on success
    };
    
    const onAdminError = (data: { message: string }) => {
      setError(data.message);
      setLoading(false);
    };

    socket.on('admin:scenario_details', onScenarioDetails);
    socket.on('admin:scenario_saved', onScenarioSaved);
    socket.on('error:admin', onAdminError);

    // --- Initial Data Fetch ---
    if (scenarioId === 'new') {
      setScenario(BLANK_SCENARIO);
      setLoading(false);
    } else {
      socket.emit('admin:get_scenario_details', { scenarioId });
    }

    return () => {
      socket.off('admin:scenario_details', onScenarioDetails);
      socket.off('admin:scenario_saved', onScenarioSaved);
      socket.off('error:admin', onAdminError);
    };
  }, [socket, isConnected, scenarioId, navigate]);

  const handleSave = () => {
    if (!socket || !scenario || isDirty) {
      setError('JSON is invalid, cannot save.');
      return;
    }
    setLoading(true);
    setError(null);
    socket.emit('admin:save_scenario', { scenario });
  };

  const handleJsonChange = (e: any) => {
    if (e.error) {
      setIsDirty(true);
      setError(`JSON Error: ${e.error.reason} on line ${e.error.line}`);
    } else {
      setIsDirty(false);
      setError(null);
      setScenario(e.jsObject);
    }
  };

  if (loading || !scenario) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <Button as={Link} to="/admin/scenarios" variant="outline">
          <ArrowLeft size={16} className="mr-2" />
          Back to List
        </Button>
        <h1 className="text-3xl font-bold text-white">Scenario Editor</h1>
        <Button onClick={handleSave} disabled={isDirty || loading}>
          <Save size={16} className="mr-2" />
          {loading ? 'Saving...' : 'Save Scenario'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 flex items-center rounded-md border border-red-700 bg-red-900/40 p-3 text-red-300">
          <AlertTriangle size={16} className="mr-2" />
          {error}
        </div>
      )}

      <Card className="border-gray-700 bg-gray-800">
        <CardContent className="p-0">
          <JSONEditor
            id={scenario.id}
            placeholder={scenario}
            onChange={handleJsonChange}
            locale={locale}
            height="80vh"
            width="100%"
            theme="dark_vscode_tribute"
            colors={{
              primitive: '#E0B453',
              string: '#CE9178',
              number: '#B5CEA8',
              boolean: '#569CD6',
              background: '#1E1E1E',
              surface: '#252526',
              text: '#D4D4D4',
            }}
            style={{
              container: { borderRadius: '0.5rem' },
              outerBox: { borderRadius: '0.5rem' },
              contentBox: { borderRadius: '0.5rem' },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};