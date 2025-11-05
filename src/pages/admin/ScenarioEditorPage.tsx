// src/pages/admin/ScenarioEditorPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link }_ from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Scenario } from '../../types/game';
import JSONEditor from 'react-json-editor-ajrm';
// @ts-ignore
import locale from 'react-json-editor-ajrm/locale/en';
import { v4 as uuid } from 'uuid';
import { api } from '../../lib/api'; // <-- NEW: Import API helper

// (BLANK_SCENARIO template is unchanged)
const BLANK_SCENARIO = {
  id: uuid(),
  name: 'New Scenario',
  description: 'A brief description of the scenario.',
  is_published: false,
  board_size_x: 12,
  board_size_y: 12,
  locations: [
    { "name": "The Park in the Centre", "position": { "x": 6, "y": 7 } },
    { "name": "Squalid Bench", "position": { "x": 6, "y": 6 } },
    { "name": "Collapsital One Bank", "position": { "x": 1, "y": 1 } },
    { "name": "Deja Brew Coffee Shop", "position": { "x": 12, "y": 1 } },
    { "name": "Bazaar of Gross-eries", "position": { "x": 1, "y": 12 } },
    { "name": "Boutique of Useless Trinkets", "position": { "x": 12, "y": 12 } },
    { "name": "Statue of Despairing Monks", "position": { "x": 1, "y": 6 } }
  ],
  main_prophecy: {
    "win_location": "Squalid Bench",
    "win_action": "Interact",
    "trigger_message": "PROPHECY FULFILLED!",
    "winner": "True Believer",
    "vp": 20
  },
  doomsday_condition: {
    "lose_location": "Collapsital One Bank",
    "trigger_message": "DOOMSDAY!",
    "winner": "Heretic",
    "vp": 20
  },
  global_fail_condition: {
    "lose_location": "Statue of Despairing Monks",
    "max_round": 10,
    "trigger_message": "GLOBAL FAIL! The Monks despair!",
    "winner": "Heretic"
  },
  complication_effects: {
    "Gaggle of Feral Youths": {
      "description": "Move actions have -1 value within 3 spaces of The Park in the Centre.",
      "duration": 3,
      "trigger": {
        "type": "ACTION_PLAYED",
        "cards": ["Move 1", "Move 2", "Move 3"],
        "condition": { "type": "IS_NEAR", "location": "The Park in the Centre", "distance": 3 }
      },
      "effect": { "type": "MODIFY_TURN", "moveValue": -1 }
    },
    "Intrepid Stalker": {
      "description": "A Stalker follows the Harbinger, blocking movement if on the same space.",
      "duration": 3,
      "trigger": { "type": "ON_ADD" },
      "effect": { "type": "SPAWN_STALKER" }
    }
  },
  object_effects: {
    "The Rubber Duck": {
      "effects": [
        { "description": "A strange sense of forward momentum.", "type": "ADD_ACTION", "cardName": "Move 1" }
      ]
    },
    "Empty Can of Beans": {
      "effects": [
        { "description": "Pauses for quiet reflection.", "type": "MODIFY_TURN", "skipNextMove": true }
      ]
    },
    "Warped Penny": {
      "effects": [
        { "description": "Shimmers with unexpected temporal displacement.", "type": "WARP", "target": "random_empty" }
      ]
    },
    "Mysterious Red Thread": {
      "effects": [
        { "description": "Momentarily unraveling chaos.", "type": "REMOVE_COMPLICATION", "target": "last" }
      ]
    },
    "A Very Large Rock": {
      "effects": [
        {
          "description": "A heavy, ethical dilemma...",
          "type": "CONDITIONAL_VP",
          "conditions": [
            { "if_role": "True Believer", "target_role": "True Believer", "amount": 2 },
            { "if_role": "Heretic", "target_role": "True Believer", "amount": -2 },
            { "if_role": "Opportunist", "target_self": 1, "target_others": -1 }
          ]
        }
      ]
    }
  },
  npc_effects: {
    "The Slumbering Vagrant": {
      "static_location": "Squalid Bench",
      "effects": {
        "positive": { "description": "True Believers gain +3 VP.", "type": "MODIFY_VP", "target": "role", "role": "True Believer", "amount": 3 },
        "negative": { "description": "True Believers gain +3 VP.", "type": "MODIFY_VP", "target": "role", "role": "True Believer", "amount": 3 }
      }
    },
    "Gossip Karen": {
      "static_location": "Deja Brew Coffee Shop",
      "effects": {
        "positive": { "description": "You get to look at the top 3 cards of the Complication deck.", "type": "EMIT_EVENT", "eventName": "show_complication_deck" },
        "negative": { "description": "Harbinger moved 1 space toward the Collapsital One Bank.", "type": "MOVE_TOWARDS", "target_location": "Collapsital One Bank", "distance": 1 }
      }
    },
    "Anxious Businessman": {
      "static_location": "Boutique of Useless Trinkets",
      "effects": {
        "positive": { "description": "The next Move action has +1 value.", "type": "MODIFY_TURN", "nextMoveValueModifier": 1 },
        "negative": { "description": "Lose one Command Card randomly from your hand.", "type": "DISCARD_CARD", "target": "self", "amount": 1, "selection": "random" }
      }
    }
  },
  opportunist_goals: {
    "Data Broker": [
      ["Deja Brew Coffee Shop", "Bazaar of Gross-eries", "Boutique of Useless Trinkets"]
    ]
  },
  sub_role_definitions: {
    "The Guide": {
      "vp": 5,
      "trigger": { "type": "END_OF_ROUND", "condition": { "type": "IS_ON_LOCATION", "location": "The Park in the Centre" } }
    },
    "The Fixer": { "vp": 5, "trigger": { "type": "EVENT", "event": "complication_removed" } },
    "The Instigator": { "vp": 5, "trigger": { "type": "EVENT", "event": "card_played", "cards": ["Deny", "Rethink", "Gamble"] } },
    "The Waster": { "vp": 5, "trigger": { "type": "END_OF_ROUND", "condition": { "type": "NO_MOVE" } } },
    "The Mimic": { "vp": 5, "trigger": { "type": "EVENT", "event": "copy_true_believer" } }
  }
};


export const ScenarioEditorPage: React.FC = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();
  // Sockets are no longer needed here
  // const { socket, isConnected } = useSocket(); 
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false); // Tracks if JSON editor is valid

  useEffect(() => {
    // This effect now uses the REST API
    if (scenarioId === 'new') {
      setScenario(BLANK_SCENARIO as any);
      setLoading(false);
    } else {
      const fetchScenario = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/admin/scenario/${scenarioId}`);
          setScenario(response.data);
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to load scenario.');
        }
        setLoading(false);
      };
      fetchScenario();
    }
  }, [scenarioId]);

  const handleSave = async () => {
    if (!scenario || isDirty) {
      setError('JSON is invalid, cannot save.');
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      if (scenarioId === 'new') {
        // Create new scenario
        await api.post('/admin/scenario', scenario);
      } else {
        // Update existing scenario
        await api.put(`/admin/scenario/${scenarioId}`, scenario);
      }
      navigate('/admin/scenarios');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save scenario.');
      setLoading(false);
    }
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
        <Button as={Link} to="/admin/scenarios" variant="outline" className="btn-outline">
          <ArrowLeft size={16} className="mr-2" />
          Back to List
        </Button>
        <h1 className="text-3xl font-bold text-white">Scenario Editor</h1>
        <Button onClick={handleSave} disabled={isDirty || loading} className="game-button">
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
            id={scenario?.id || 'new'}
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