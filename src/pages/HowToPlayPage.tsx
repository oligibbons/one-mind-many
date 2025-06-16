import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Target, Zap, Shield, Eye, Brain, 
  ChevronRight, ChevronDown, Play, Book, 
  AlertTriangle, CheckCircle, RotateCcw
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useContent } from '../contexts/ContentContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const HowToPlayPage = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');
  const [ruleContent, setRuleContent] = useState<any>(null);
  const { content, loading } = useContent();

  useEffect(() => {
    // In a real implementation, this would fetch from the CMS
    setRuleContent({
      overview: {
        title: "Overview of One Mind, Many",
        content: `In One Mind, Many, deception meets strategy in a gripping social deduction game. Players take turns programming actions for a shared character, navigating through dynamic, AI-driven scenarios where survival depends on cunning teamwork. But beware—the saboteur, secretly working against the group, has their own hidden objectives, subtly undermining the mission while blending in with the team.

Each scenario unfolds in a richly immersive world, from daring prison breaks to sinister research facilities. With limited resources, unpredictable NPCs, and escalating challenges, every decision carries weight. The AI moderator provides real-time environmental updates, ensuring players always know their options while maintaining the narrative's intrigue.

Unique to One Mind, Many is its emphasis on environmental interaction and contextual storytelling. Players can move, search, interact, and even attempt sabotage—but every action must align with the situation's logic, overseen by the AI for fairness. As tensions rise and trust erodes, alliances are tested.`
      },
      gameFlow: {
        title: "Game Flow and Phases",
        phases: [
          {
            name: "Introduction",
            description: "After a game has started, an introduction is shown to all players. This includes the very first piece of narrative to set the scene. Individually, players are secretly and randomly assigned a role, Main Goal, Side Quests, and role-based actions. The introduction is only shown at the start of the game, prior to turn 1."
          },
          {
            name: "Programming Phase",
            description: "Players individually and secretly programme their actions for the coming turn. Each player must choose an action and a target. Actions are selected via dedicated action buttons, while targets are selected via dropdown menus. Once all players have programmed an action, we move to the Resolution Phase."
          },
          {
            name: "Resolution Phase",
            description: "Player actions are resolved in turn order. Before resolution, each player secretly selects a valid Intention Tag. The AI Narrator provides context-relevant descriptions and updates the game state. Turn order cycles after each round until the End Game is triggered."
          },
          {
            name: "End Game",
            description: "Triggered when either a global fail state is achieved or players achieve their Main Goal. Points from Main Goals and Side Quests are tallied, and an end screen shows game breakdown, player reveals, and leaderboard."
          }
        ]
      },
      roles: {
        title: "Player Roles",
        roles: [
          {
            name: "Collaborator",
            description: "A positive role where players work toward the shared character's well-intentioned goals",
            color: "text-green-400",
            icon: <Shield className="w-6 h-6" />,
            intentionTags: ["Assist", "Negotiate", "Investigate", "Collect", "Repair"],
            specialRules: ["Can interact with NPCs and objects to progress group goals", "Limited to one repair action per turn"]
          },
          {
            name: "Rogue",
            description: "A neutral role where players are only out for themselves, morally ambiguous",
            color: "text-yellow-400",
            icon: <Eye className="w-6 h-6" />,
            intentionTags: ["Infiltrate", "Scout", "Bypass", "Manipulate", "Distract"],
            specialRules: ["Can interact with locations and objects to uncover secrets or create new paths"]
          },
          {
            name: "Saboteur",
            description: "A negative role where players actively work against the Collaborators",
            color: "text-red-400",
            icon: <AlertTriangle className="w-6 h-6" />,
            intentionTags: ["Disrupt", "Obstruct", "Mislead", "Tamper", "Sabotage"],
            specialRules: ["Can perform sabotage actions", "Sabotage actions only once every two turns", "Must leave ambiguous outcomes"]
          }
        ]
      },
      actions: {
        title: "Universal Actions",
        actions: [
          {
            name: "Move",
            description: "Moves the shared character one space towards their target location. The target can only be a location.",
            icon: <RotateCcw className="w-5 h-5" />,
            validTargets: ["Location"],
            restrictions: "None"
          },
          {
            name: "Interact",
            description: "Makes the shared character interact with an object, location, hazard, or NPC.",
            icon: <Target className="w-5 h-5" />,
            validTargets: ["Object", "Location", "Hazard", "NPC"],
            restrictions: "Requires valid target and matching intention tag"
          },
          {
            name: "Search",
            description: "Makes the shared character search their target location, object or NPC.",
            icon: <Eye className="w-5 h-5" />,
            validTargets: ["Location", "Container"],
            restrictions: "Limited to locations or containers"
          }
        ]
      },
      movement: {
        title: "Movement System",
        content: `Moving across the map is an important aspect of the game. The Shared Character can only move when instructed by a Move action. The map is separated into locations, each connected to other locations and featuring different Move Token values.

Each location has a Move Token value that determines how many Move actions are needed to traverse it. Smaller locations (like a small room) may have a Move Token of 1, while larger locations (like a large valley) may have a Move Token of 6.

Each location is split into a grid according to their Move Token value. With each Move action, the character moves along the grid towards their target location. If multiple players target different locations, the character's position updates accordingly.

When the shared character reaches the edge of the grid, the next move action in that direction causes them to leave their current location and enter the target location.`
      },
      intentionTags: {
        title: "Intention Tags",
        content: `Intention Tags are selected during the Resolution Phase and appear as a modal when a player's action is about to be resolved. They signify the player's intention and impact how the Shared Character's actions affect the narrative.

Some Intention Tags are only valid when certain actions or targets are selected during the Programming Phase. Only valid Intention Tags are displayed to the player. Intention Tags are secret, and the AI Narrator will not reveal them to other players.`,
        tags: {
          collaborator: [
            { name: "Assist", description: "Help another character or support group objectives", actions: ["Interact"], targets: ["Any"] },
            { name: "Negotiate", description: "Attempt diplomatic interaction with NPCs", actions: ["Interact"], targets: ["NPC"] },
            { name: "Investigate", description: "Carefully examine for clues or information", actions: ["Interact", "Search"], targets: ["Any"] },
            { name: "Collect", description: "Gather or retrieve objects", actions: ["Interact"], targets: ["Object"] },
            { name: "Repair", description: "Fix damaged objects or systems", actions: ["Interact"], targets: ["Object"] }
          ],
          rogue: [
            { name: "Infiltrate", description: "Gain access through stealth or deception", actions: ["Interact"], targets: ["Any"] },
            { name: "Scout", description: "Gather information about the area or NPCs", actions: ["Any"], targets: ["Location", "NPC"] },
            { name: "Bypass", description: "Avoid or circumvent obstacles", actions: ["Any"], targets: ["Hazard", "NPC"] },
            { name: "Manipulate", description: "Influence or control targets for personal gain", actions: ["Interact"], targets: ["NPC", "Object", "Hazard"] },
            { name: "Distract", description: "Draw attention away from other activities", actions: ["Any"], targets: ["NPC"] }
          ],
          saboteur: [
            { name: "Disrupt", description: "Interfere with ongoing activities", actions: ["Interact"], targets: ["Any"] },
            { name: "Obstruct", description: "Block or hinder progress", actions: ["Interact"], targets: ["Any"] },
            { name: "Mislead", description: "Provide false information or misdirection", actions: ["Any"], targets: ["NPC"] },
            { name: "Tamper", description: "Secretly alter or damage objects", actions: ["Interact"], targets: ["Object"] },
            { name: "Sabotage", description: "Deliberately undermine group objectives", actions: ["Any"], targets: ["Any"] }
          ]
        }
      },
      globalRules: {
        title: "Global Game Rules",
        rules: [
          "Each player can program only one action per turn",
          "Actions are resolved based on a cycling turn order",
          "Players may adapt their actions in the resolution phase if the initial target is invalid",
          "Saboteurs may only perform sabotage actions once every two turns",
          "All roles have specific action tags they can use",
          "Invalid actions require the player to choose a new, valid action",
          "Unresolved actions result in a skipped turn with appropriate feedback"
        ]
      }
    });
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sections = [
    { id: 'overview', title: 'Game Overview', icon: <Book className="w-5 h-5" /> },
    { id: 'gameFlow', title: 'Game Flow & Phases', icon: <Play className="w-5 h-5" /> },
    { id: 'roles', title: 'Player Roles', icon: <Users className="w-5 h-5" /> },
    { id: 'actions', title: 'Universal Actions', icon: <Zap className="w-5 h-5" /> },
    { id: 'movement', title: 'Movement System', icon: <RotateCcw className="w-5 h-5" /> },
    { id: 'intentionTags', title: 'Intention Tags', icon: <Target className="w-5 h-5" /> },
    { id: 'globalRules', title: 'Global Rules', icon: <Shield className="w-5 h-5" /> }
  ];

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading rules..." />;
  }

  const howToPlayContent = content.howtoplay || {};

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 custom-font">
              {howToPlayContent.page_title || "How to Play"}
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto body-font">
              {howToPlayContent.page_description || "Master the art of deception and strategy in One Mind, Many. Learn the rules, understand the roles, and dominate the game."}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* HTML Content Section */}
        {howToPlayContent.html_content && (
          <div className="mb-12">
            <div dangerouslySetInnerHTML={{ __html: howToPlayContent.html_content }} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h3 className="text-lg font-bold text-white mb-4 custom-font">Table of Contents</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      expandedSection === section.id
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center">
                      {section.icon}
                      <span className="ml-3 text-sm font-medium custom-font">{section.title}</span>
                    </div>
                    {expandedSection === section.id ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Overview Section */}
            {expandedSection === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center custom-font">
                    <Book className="w-6 h-6 mr-3 text-orange-500" />
                    {ruleContent.overview.title}
                  </h2>
                  <div className="prose prose-slate prose-invert max-w-none">
                    {ruleContent.overview.content.split('\n\n').map((paragraph: string, index: number) => (
                      <p key={index} className="text-slate-300 leading-relaxed mb-4 body-font">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Game Flow Section */}
            {expandedSection === 'gameFlow' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center custom-font">
                    <Play className="w-6 h-6 mr-3 text-orange-500" />
                    {ruleContent.gameFlow.title}
                  </h2>
                  <div className="space-y-6">
                    {ruleContent.gameFlow.phases.map((phase: any, index: number) => (
                      <div key={index} className="border-l-4 border-orange-500 pl-6">
                        <h3 className="text-xl font-semibold text-white mb-2 custom-font">
                          {index + 1}. {phase.name}
                        </h3>
                        <p className="text-slate-300 leading-relaxed body-font">
                          {phase.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Roles Section */}
            {expandedSection === 'roles' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center custom-font">
                    <Users className="w-6 h-6 mr-3 text-orange-500" />
                    {ruleContent.roles.title}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {ruleContent.roles.roles.map((role: any, index: number) => (
                      <div key={index} className="bg-slate-800/50 rounded-lg p-6 game-card">
                        <div className="flex items-center mb-4">
                          <div className={`${role.color} mr-3`}>
                            {role.icon}
                          </div>
                          <h3 className={`text-xl font-bold ${role.color} custom-font`}>
                            {role.name}
                          </h3>
                        </div>
                        <p className="text-slate-300 mb-4 body-font">
                          {role.description}
                        </p>
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-400 mb-2 custom-font">Intention Tags:</h4>
                            <div className="flex flex-wrap gap-1">
                              {role.intentionTags.map((tag: string) => (
                                <span key={tag} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded custom-font">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-400 mb-2 custom-font">Special Rules:</h4>
                            <ul className="text-xs text-slate-300 space-y-1 body-font">
                              {role.specialRules.map((rule: string, ruleIndex: number) => (
                                <li key={ruleIndex}>• {rule}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Actions Section */}
            {expandedSection === 'actions' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center custom-font">
                    <Zap className="w-6 h-6 mr-3 text-orange-500" />
                    {ruleContent.actions.title}
                  </h2>
                  <div className="space-y-6">
                    {ruleContent.actions.actions.map((action: any, index: number) => (
                      <div key={index} className="bg-slate-800/50 rounded-lg p-6 game-card">
                        <div className="flex items-center mb-3">
                          <div className="text-orange-500 mr-3">
                            {action.icon}
                          </div>
                          <h3 className="text-xl font-bold text-white custom-font">
                            {action.name}
                          </h3>
                        </div>
                        <p className="text-slate-300 mb-4 body-font">
                          {action.description}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-400 mb-2 custom-font">Valid Targets:</h4>
                            <div className="flex flex-wrap gap-1">
                              {action.validTargets.map((target: string) => (
                                <span key={target} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded custom-font">
                                  {target}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-400 mb-2 custom-font">Restrictions:</h4>
                            <p className="text-xs text-slate-300 body-font">{action.restrictions}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Movement Section */}
            {expandedSection === 'movement' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center custom-font">
                    <RotateCcw className="w-6 h-6 mr-3 text-orange-500" />
                    {ruleContent.movement.title}
                  </h2>
                  <div className="prose prose-slate prose-invert max-w-none">
                    {ruleContent.movement.content.split('\n\n').map((paragraph: string, index: number) => (
                      <p key={index} className="text-slate-300 leading-relaxed mb-4 body-font">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Intention Tags Section */}
            {expandedSection === 'intentionTags' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center custom-font">
                    <Target className="w-6 h-6 mr-3 text-orange-500" />
                    {ruleContent.intentionTags.title}
                  </h2>
                  <div className="prose prose-slate prose-invert max-w-none mb-8">
                    {ruleContent.intentionTags.content.split('\n\n').map((paragraph: string, index: number) => (
                      <p key={index} className="text-slate-300 leading-relaxed mb-4 body-font">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  
                  <div className="space-y-8">
                    {Object.entries(ruleContent.intentionTags.tags).map(([role, tags]: [string, any]) => (
                      <div key={role}>
                        <h3 className="text-xl font-bold text-white mb-4 capitalize custom-font">
                          {role} Intention Tags
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {tags.map((tag: any, index: number) => (
                            <div key={index} className="bg-slate-800/50 rounded-lg p-4 game-card">
                              <h4 className="text-lg font-semibold text-white mb-2 custom-font">
                                {tag.name}
                              </h4>
                              <p className="text-slate-300 text-sm mb-3 body-font">
                                {tag.description}
                              </p>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-xs font-semibold text-slate-400 custom-font">Actions: </span>
                                  <span className="text-xs text-slate-300 body-font">{tag.actions.join(', ')}</span>
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-slate-400 custom-font">Targets: </span>
                                  <span className="text-xs text-slate-300 body-font">{tag.targets.join(', ')}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Global Rules Section */}
            {expandedSection === 'globalRules' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center custom-font">
                    <Shield className="w-6 h-6 mr-3 text-orange-500" />
                    {ruleContent.globalRules.title}
                  </h2>
                  <div className="space-y-4">
                    {ruleContent.globalRules.rules.map((rule: string, index: number) => (
                      <div key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-slate-300 body-font">{rule}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Quick Start Guide */}
        <Card className="p-8 mt-12 game-card">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center custom-font">
            <Brain className="w-6 h-6 mr-3 text-orange-500" />
            Quick Start Guide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-500 custom-font">1</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 custom-font">Join a Game</h3>
              <p className="text-slate-400 text-sm body-font">
                Create or join a lobby, select a scenario, and wait for other players
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-500 custom-font">2</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 custom-font">Learn Your Role</h3>
              <p className="text-slate-400 text-sm body-font">
                Understand your secret role, goals, and available intention tags
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-500 custom-font">3</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 custom-font">Play Strategically</h3>
              <p className="text-slate-400 text-sm body-font">
                Program actions, choose intentions, and work toward your goals
              </p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Button
              onClick={() => window.location.href = '/game/play'}
              leftIcon={<Play size={18} />}
              size="lg"
              className="game-button"
            >
              Start Playing Now
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HowToPlayPage;