import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

interface ContentContextType {
  content: any;
  loading: boolean;
  error: string | null;
  refreshContent: () => Promise<void>;
}

const ContentContext = createContext<ContentContextType>({
  content: {},
  loading: true,
  error: null,
  refreshContent: async () => {},
});

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

export const ContentProvider = ({ children }: { children: ReactNode }) => {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from API first, but don't require authentication for content
      try {
        const response = await fetch('/api/admin/content', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Don't include auth headers for content - it should be publicly accessible
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setContent(data);
          return;
        }
      } catch (apiError) {
        console.log('API content fetch failed, using fallback content');
      }
      
      // Always fall back to default content if API fails
      setContent(getDefaultContent());
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Failed to load content');
      // Use default content as fallback
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const refreshContent = async () => {
    await fetchContent();
  };

  useEffect(() => {
    fetchContent();
  }, []);

  return (
    <ContentContext.Provider value={{ content, loading, error, refreshContent }}>
      {children}
    </ContentContext.Provider>
  );
};

// Default content fallback
const getDefaultContent = () => ({
  homepage: {
    hero_title: 'One Mind, Many',
    hero_subtitle: 'The ultimate social deduction experience',
    hero_description: 'Navigate through AI-driven scenarios where trust is scarce and survival depends on wit.',
    hero_cta_primary: 'Start Playing',
    hero_cta_secondary: 'How to Play',
    features: [
      {
        title: 'AI Scenarios',
        description: 'Dynamic stories that adapt to your choices',
        icon: 'Brain'
      },
      {
        title: 'Social Deduction',
        description: 'Trust no one, suspect everyone',
        icon: 'Users'
      },
      {
        title: 'Real-time Action',
        description: 'Every decision matters instantly',
        icon: 'Zap'
      }
    ],
    stats: [
      { label: 'Active Players', value: '12,847', icon: 'Users' },
      { label: 'Games Played', value: '89,234', icon: 'Play' },
      { label: 'Success Rate', value: '67%', icon: 'Trophy' }
    ],
    final_cta_title: 'Your Next Adventure Awaits',
    final_cta_description: 'Free to play. Easy to learn. Impossible to master.',
    final_cta_button: 'Start Your Journey'
  },
  howtoplay: {
    page_title: 'How to Play',
    page_description: 'Master the art of deception and strategy in One Mind, Many. Learn the rules, understand the roles, and dominate the game.',
    gameOverview: {
      title: 'Game Overview',
      content: 'One Mind, Many is a cooperative, social hidden role game with programming mechanics. Players (3-6) navigate complex scenarios, solve challenges, and complete objectives while unmasking hidden saboteurs or rogues. The game unfolds within a scenario—a tailored narrative setting with specific objectives, challenges, and player dynamics.',
      sharedCharacter: 'At the heart of One Mind, Many lies the shared character, a single avatar controlled by all players. Every programmed action affects the shared character, creating a collective narrative, while each player\'s action represents their unique strategy and role-driven goals. The shared character masks individual intentions, compelling players to infer motivations from outcomes.'
    },
    gameFlow: {
      title: 'Game Flow and Phases',
      phases: [
        {
          name: 'Setup',
          description: 'Choose a scenario. The Narrator introduces the setting, objectives, and hidden dynamics. Roles are secretly assigned. Categories (Collaborator, Saboteur, Rogue) and specialised roles depend on the scenario. Players do not know the turn order; they must deduce it during gameplay.'
        },
        {
          name: 'Action Phase',
          description: 'Each player programs one action and selects a target (e.g., Move, Search, Interact, or a role-specific action). The players all programme their actions at the same time, and are unaware of the actions programmed by the other player. If a player does not choose an action, the AI randomly assigns a valid action and target.'
        },
        {
          name: 'Resolution Phase',
          description: 'The AI Moderator resolves programmed actions sequentially, based on a predefined turn order, narrating the results without revealing the turn order or player intentions. Before resolution, each player secretly selects a valid Intention Tag.'
        },
        {
          name: 'Dynamic Updates',
          description: 'The environment evolves, with new areas, items, or NPCs introduced.'
        },
        {
          name: 'Victory Conditions',
          description: 'Collaborators Win: Complete the group objective. Saboteurs Win: Successfully disrupt the group. Rogues Win: Fulfill their individual goal. Please note: It is possible for players of different role types to win together, so long as specific scenario-based criteria are met.'
        }
      ]
    },
    rulesAndMechanics: {
      title: 'Rules and Mechanics',
      programmingActions: {
        title: 'Programming Actions',
        description: 'Each turn, players program the shared character\'s actions:',
        actions: [
          {
            name: 'Move',
            description: 'Transition to another location.',
            validTargets: ['Location']
          },
          {
            name: 'Search',
            description: 'Investigate an area or object for useful items or clues.',
            validTargets: ['Location', 'Container']
          },
          {
            name: 'Interact',
            description: 'Engage with NPCs or environment elements.',
            validTargets: ['Object', 'Location', 'Hazard', 'NPC']
          },
          {
            name: 'Special Actions',
            description: 'Scenario-specific actions tied to roles or objectives.',
            validTargets: ['Varies by scenario']
          }
        ]
      },
      invalidActions: {
        title: 'Handling Invalid Actions',
        items: [
          'Move Actions: Prompt players to reselect valid targets.',
          'Other Actions: Either reassigned to a valid target or ignored, depending on the context.'
        ]
      },
      turnOrder: {
        title: 'Turn Order',
        description: 'Turn order remains obscured, though follows a consistent pattern. If a player\'s action is resolved first in one round, their action will be resolved last in the next round. The player who was second in the same resolution phase during the first round will now have their action resolved first in the next round, and the turn order for the rest of players moves up the queue accordingly. This process of cycling the turn order continues for the entire game. While turn order isn\'t revealed to players, they are encouraged to deduce it through contextual clues, NPC reactions, communication with other players, and observed outcomes.'
      },
      dynamicEnvironments: {
        title: 'Dynamic Environments',
        description: 'Scenarios feature evolving settings, including:',
        items: [
          'Hazards: Environmental dangers that require strategic navigation.',
          'NPCs: Characters with complex behaviors influenced by player actions.',
          'Time-Sensitive Elements: Objectives or challenges that expire if not addressed promptly.'
        ]
      },
      disconnections: {
        title: 'Disconnections',
        items: [
          'If a player disconnects, a 60-second grace period allows for reconnection.',
          'Afterward, the AI temporarily assumes their role, making neutral decisions.'
        ]
      },
      movementSystem: {
        title: 'Movement System',
        description: 'Moving across the map is an important aspect of the game. The Shared Character can only move when instructed by a Move action. The map is separated into locations, each connected to other locations and featuring different Move Token values. Each location has a Move Token value that determines how many Move actions are needed to traverse it. Smaller locations (like a small room) may have a Move Token of 1, while larger locations (like a large valley) may have a Move Token of 6. Each location is split into a grid according to their Move Token value. With each Move action, the character moves along the grid towards their target location. If multiple players target different locations, the character\'s position updates accordingly. When the shared character reaches the edge of the grid, the next move action in that direction causes them to leave their current location and enter the target location.'
      }
    },
    playerRoles: {
      title: 'Player Roles',
      description: 'Players are assigned one of three role categories, each with unique objectives and playstyles:',
      roles: [
        {
          name: 'Collaborator',
          description: 'A positive role where players work toward the shared character\'s well-intentioned goals',
          color: 'text-green-400',
          intentionTags: ['Assist', 'Negotiate', 'Investigate', 'Collect', 'Repair'],
          specialRules: ['Can interact with NPCs and objects to progress group goals', 'Limited to one repair action per turn']
        },
        {
          name: 'Rogue',
          description: 'A neutral role where players are only out for themselves, morally ambiguous',
          color: 'text-yellow-400',
          intentionTags: ['Infiltrate', 'Scout', 'Bypass', 'Manipulate', 'Distract'],
          specialRules: ['Can interact with locations and objects to uncover secrets or create new paths']
        },
        {
          name: 'Saboteur',
          description: 'A negative role where players actively work against the Collaborators',
          color: 'text-red-400',
          intentionTags: ['Disrupt', 'Obstruct', 'Mislead', 'Tamper', 'Sabotage'],
          specialRules: ['Can perform sabotage actions', 'Sabotage actions only once every two turns', 'Must leave ambiguous outcomes']
        }
      ]
    },
    intentionTags: {
      title: 'Intention Tags',
      description: 'Intention Tags are selected during the Resolution Phase and appear as a modal when a player\'s action is about to be resolved. They signify the player\'s intention and impact how the Shared Character\'s actions affect the narrative. Some Intention Tags are only valid when certain actions or targets are selected during the Programming Phase. Only valid Intention Tags are displayed to the player. Intention Tags are secret, and the AI Narrator will not reveal them to other players.',
      tagsByRole: {
        collaborator: [
          { name: 'Assist', description: 'Help another character or support group objectives', actions: ['Interact'], targets: ['Any'] },
          { name: 'Negotiate', description: 'Attempt diplomatic interaction with NPCs', actions: ['Interact'], targets: ['NPC'] },
          { name: 'Investigate', description: 'Carefully examine for clues or information', actions: ['Interact', 'Search'], targets: ['Any'] },
          { name: 'Collect', description: 'Gather or retrieve objects', actions: ['Interact'], targets: ['Object'] },
          { name: 'Repair', description: 'Fix damaged objects or systems', actions: ['Interact'], targets: ['Object'] }
        ],
        rogue: [
          { name: 'Infiltrate', description: 'Gain access through stealth or deception', actions: ['Interact'], targets: ['Any'] },
          { name: 'Scout', description: 'Gather information about the area or NPCs', actions: ['Any'], targets: ['Location', 'NPC'] },
          { name: 'Bypass', description: 'Avoid or circumvent obstacles', actions: ['Any'], targets: ['Hazard', 'NPC'] },
          { name: 'Manipulate', description: 'Influence or control targets for personal gain', actions: ['Interact'], targets: ['NPC', 'Object', 'Hazard'] },
          { name: 'Distract', description: 'Draw attention away from other activities', actions: ['Any'], targets: ['NPC'] }
        ],
        saboteur: [
          { name: 'Disrupt', description: 'Interfere with ongoing activities', actions: ['Interact'], targets: ['Any'] },
          { name: 'Obstruct', description: 'Block or hinder progress', actions: ['Interact'], targets: ['Any'] },
          { name: 'Mislead', description: 'Provide false information or misdirection', actions: ['Any'], targets: ['NPC'] },
          { name: 'Tamper', description: 'Secretly alter or damage objects', actions: ['Interact'], targets: ['Object'] },
          { name: 'Sabotage', description: 'Deliberately undermine group objectives', actions: ['Any'], targets: ['Any'] }
        ]
      }
    },
    globalRules: {
      title: 'Global Game Rules',
      rules: [
        'Each player can program only one action per turn',
        'Actions are resolved based on a cycling turn order',
        'Players may adapt their actions in the resolution phase if the initial target is invalid',
        'Saboteurs may only perform sabotage actions once every two turns',
        'All roles have specific action tags they can use',
        'Invalid actions require the player to choose a new, valid action',
        'Unresolved actions result in a skipped turn with appropriate feedback',
        'If a player disconnects, a 60-second grace period allows for reconnection',
        'Pausing the game requires unanimous agreement among players',
        'Roles are static and do not change once assigned',
        'Saboteurs can still win even if their role is revealed',
        'Multiple teams can win in the same game if their objectives happen to align',
        'If no team achieves their goal, the scenario ends in a loss for all teams'
      ]
    },
    tipsForSuccess: {
      title: 'Tips for Success',
      tips: [
        'Deduction is Key: Pay attention to action outcomes and narrative cues to uncover hidden roles.',
        'Strategise Collaboratively: Open dialogue is essential, but don\'t trust too easily.',
        'Adapt to the Environment: Respond dynamically to hazards and NPC behaviours.'
      ]
    },
    glossary: {
      title: 'Glossary of Terms',
      terms: [
        { term: 'Scenario', definition: 'A unique game setting with specific objectives, roles, and challenges.' },
        { term: 'Programming', definition: 'The process of selecting actions for the shared character.' },
        { term: 'Collaborators', definition: 'Players aligned with the group objective.' },
        { term: 'Saboteurs', definition: 'Hidden antagonists aiming to disrupt the group.' },
        { term: 'Rogues', definition: 'Players with individual, neutral goals.' },
        { term: 'Narrator', definition: 'The AI-driven storytelling engine that guides gameplay and resolves actions.' },
        { term: 'Intention Tag', definition: 'A descriptor that signifies a player\'s intention for their programmed action.' },
        { term: 'Move Token', definition: 'A value that determines how many Move actions are needed to traverse a location.' }
      ]
    },
    faqs: {
      title: 'Frequently Asked Questions',
      categories: [
        {
          name: 'General Gameplay',
          questions: [
            {
              question: 'Can I skip my turn?',
              answer: 'No. If you don\'t program an action, the AI assigns a random valid action and target.'
            },
            {
              question: 'Are roles revealed during the game?',
              answer: 'Roles remain hidden unless explicitly revealed by a scenario-specific mechanic, deduction, or intentional communication (for strategic reasons).'
            }
          ]
        },
        {
          name: 'Shared Character',
          questions: [
            {
              question: 'What happens when two players program conflicting actions?',
              answer: 'The AI resolves conflicts in the programmed turn order. Invalid targets are reassigned or ignored.'
            }
          ]
        },
        {
          name: 'Dynamic Environment',
          questions: [
            {
              question: 'Can NPCs change their behavior mid-game?',
              answer: 'Yes. NPCs dynamically react to the shared character\'s actions and the unfolding scenario.'
            }
          ]
        },
        {
          name: 'Narrative and Progression',
          questions: [
            {
              question: 'What happens if we fail a critical objective?',
              answer: 'Failing a critical objective may result in a game loss or introduce new obstacles.'
            },
            {
              question: 'Can the Saboteur win even if they are revealed?',
              answer: 'Yes, if the Saboteur achieves their secret objectives despite being revealed, they still win.'
            },
            {
              question: 'How do we know if we\'re nearing victory or defeat?',
              answer: 'The narrative progression will provide cues, such as escalating tension, increased obstacles, or explicit win/lose conditions.'
            }
          ]
        },
        {
          name: 'Turn Order',
          questions: [
            {
              question: 'How is turn order determined?',
              answer: 'Turn order is predefined but remains obscured. Players must deduce it from context and observed outcomes.'
            },
            {
              question: 'Does turn order change during the game?',
              answer: 'Turn order is dynamic but follows a fixed pattern. If a player\'s action is resolved first in one round, their next action will be resolved last, and everyone else\'s turn order is moved higher in the queue. For example, Round 1 sees the order of P1, P2, P3, P4. Round 2 now updates to the order of P2, P3, P4, P1. This pattern continues for the entire game.'
            }
          ]
        },
        {
          name: 'Roles',
          questions: [
            {
              question: 'What are the role categories?',
              answer: 'Roles fall into three categories: Collaborators (positive, working toward group objectives), Saboteurs (negative, secretly opposing the group), and Rogues (neutral, pursuing independent goals).'
            },
            {
              question: 'Can roles be reassigned mid-game?',
              answer: 'No. Roles are static and do not change once assigned.'
            },
            {
              question: 'What happens if a player reveals their role?',
              answer: 'Revealing a role is allowed but can influence how other players perceive and interact with you.'
            }
          ]
        },
        {
          name: 'Win Conditions',
          questions: [
            {
              question: 'Can multiple teams win in the same game?',
              answer: 'Technically yes, though this only happens if the teams are assigned objectives that happen to align.'
            },
            {
              question: 'What happens if no team achieves their goal?',
              answer: 'If no one meets their win conditions, the scenario ends in a loss for all teams.'
            }
          ]
        },
        {
          name: 'Scenarios',
          questions: [
            {
              question: 'Are scenarios replayable?',
              answer: 'Yes. Scenarios are designed for replayability, with dynamic elements and branching narratives creating different outcomes.'
            },
            {
              question: 'Can new scenarios be added?',
              answer: 'Players are unable to add new scenarios, however the Development Team will be updating the pool of scenarios continually.'
            },
            {
              question: 'Do scenarios have difficulty ratings?',
              answer: 'Scenarios include difficulty levels to help players choose one that matches their skill and experience.'
            }
          ]
        },
        {
          name: 'Technical',
          questions: [
            {
              question: 'What happens if a player disconnects?',
              answer: 'The game allows a 60-second grace period for reconnection. Afterward, the AI takes over their turn, making neutral decisions.'
            },
            {
              question: 'Can the game be paused?',
              answer: 'Yes, but pausing requires unanimous agreement among players.'
            },
            {
              question: 'Are there accessibility options?',
              answer: 'Yes, including adjustable text sizes, colorblind-friendly modes, and audio cues.'
            },
            {
              question: 'Can players communicate outside the game\'s text chat?',
              answer: 'While the game is restricted to text-based chat, player\'s are not prohibited from using external voice chat tools to communicate.'
            }
          ]
        }
      ]
    },
    quickStartGuide: {
      title: 'Quick Start Guide',
      steps: [
        {
          title: 'Join a Game',
          description: 'Create or join a lobby, select a scenario, and wait for other players'
        },
        {
          title: 'Learn Your Role',
          description: 'Understand your secret role, goals, and available intention tags'
        },
        {
          title: 'Play Strategically',
          description: 'Program actions, choose intentions, and work toward your goals'
        }
      ]
    }
  },
  global: {
    site_name: 'One Mind, Many',
    site_description: 'The ultimate social deduction game',
    contact_email: 'contact@onemindmany.com',
    social_links: {
      github: '#',
      twitter: '#',
      discord: '#'
    }
  }
});