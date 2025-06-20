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
  const { content, loading } = useContent();

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
    { id: 'globalRules', title: 'Global Rules', icon: <Shield className="w-5 h-5" /> },
    { id: 'faqs', title: 'FAQs', icon: <AlertTriangle className="w-5 h-5" /> }
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
                    {howToPlayContent.gameOverview?.title || "Game Overview"}
                  </h2>
                  <div className="prose prose-slate prose-invert max-w-none">
                    <p className="text-slate-300 leading-relaxed mb-4 body-font">
                      {howToPlayContent.gameOverview?.content || ""}
                    </p>
                    <h3 className="text-xl font-semibold text-white mb-2 custom-font">The Shared Character: A Unified Perspective</h3>
                    <p className="text-slate-300 leading-relaxed mb-4 body-font">
                      {howToPlayContent.gameOverview?.sharedCharacter || ""}
                    </p>
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
                    {howToPlayContent.gameFlow?.title || "Game Flow and Phases"}
                  </h2>
                  <div className="space-y-6">
                    {howToPlayContent.gameFlow?.phases.map((phase: any, index: number) => (
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
                    {howToPlayContent.playerRoles?.title || "Player Roles"}
                  </h2>
                  <p className="text-slate-300 mb-6 body-font">
                    {howToPlayContent.playerRoles?.description || ""}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {howToPlayContent.playerRoles?.roles.map((role: any, index: number) => (
                      <div key={index} className="bg-slate-800/50 rounded-lg p-6 game-card">
                        <div className="flex items-center mb-4">
                          <div className={`${role.color} mr-3`}>
                            {role.name === 'Collaborator' && <Shield className="w-6 h-6" />}
                            {role.name === 'Rogue' && <Eye className="w-6 h-6" />}
                            {role.name === 'Saboteur' && <AlertTriangle className="w-6 h-6" />}
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
                    {howToPlayContent.rulesAndMechanics?.programmingActions.title || "Universal Actions"}
                  </h2>
                  <p className="text-slate-300 mb-6 body-font">
                    {howToPlayContent.rulesAndMechanics?.programmingActions.description || ""}
                  </p>
                  <div className="space-y-6">
                    {howToPlayContent.rulesAndMechanics?.programmingActions.actions.map((action: any, index: number) => (
                      <div key={index} className="bg-slate-800/50 rounded-lg p-6 game-card">
                        <div className="flex items-center mb-3">
                          <div className="text-orange-500 mr-3">
                            {action.name === 'Move' && <RotateCcw className="w-5 h-5" />}
                            {action.name === 'Search' && <Eye className="w-5 h-5" />}
                            {action.name === 'Interact' && <Target className="w-5 h-5" />}
                            {action.name === 'Special Actions' && <Zap className="w-5 h-5" />}
                          </div>
                          <h3 className="text-xl font-bold text-white custom-font">
                            {action.name}
                          </h3>
                        </div>
                        <p className="text-slate-300 mb-4 body-font">
                          {action.description}
                        </p>
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
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-white mb-4 custom-font">
                      {howToPlayContent.rulesAndMechanics?.invalidActions.title || "Handling Invalid Actions"}
                    </h3>
                    <ul className="space-y-2 text-slate-300 body-font">
                      {howToPlayContent.rulesAndMechanics?.invalidActions.items.map((item: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-orange-500 mr-2">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
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
                    {howToPlayContent.rulesAndMechanics?.movementSystem.title || "Movement System"}
                  </h2>
                  <div className="prose prose-slate prose-invert max-w-none">
                    <p className="text-slate-300 leading-relaxed mb-4 body-font">
                      {howToPlayContent.rulesAndMechanics?.movementSystem.description || ""}
                    </p>
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
                    {howToPlayContent.intentionTags?.title || "Intention Tags"}
                  </h2>
                  <div className="prose prose-slate prose-invert max-w-none mb-8">
                    <p className="text-slate-300 leading-relaxed mb-4 body-font">
                      {howToPlayContent.intentionTags?.description || ""}
                    </p>
                  </div>
                  
                  <div className="space-y-8">
                    {Object.entries(howToPlayContent.intentionTags?.tagsByRole || {}).map(([role, tags]: [string, any]) => (
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
                    {howToPlayContent.globalRules?.title || "Global Game Rules"}
                  </h2>
                  <div className="space-y-4">
                    {howToPlayContent.globalRules?.rules.map((rule: string, index: number) => (
                      <div key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-slate-300 body-font">{rule}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* FAQs Section */}
            {expandedSection === 'faqs' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center custom-font">
                    <AlertTriangle className="w-6 h-6 mr-3 text-orange-500" />
                    {howToPlayContent.faqs?.title || "Frequently Asked Questions"}
                  </h2>
                  
                  <div className="space-y-8">
                    {howToPlayContent.faqs?.categories.map((category: any, catIndex: number) => (
                      <div key={catIndex}>
                        <h3 className="text-xl font-bold text-white mb-4 custom-font">
                          {category.name}
                        </h3>
                        <div className="space-y-4">
                          {category.questions.map((faq: any, faqIndex: number) => (
                            <div key={faqIndex} className="bg-slate-800/50 rounded-lg p-4 game-card">
                              <h4 className="text-lg font-semibold text-white mb-2 custom-font">
                                {faq.question}
                              </h4>
                              <p className="text-slate-300 body-font">
                                {faq.answer}
                              </p>
                            </div>
                          ))}
                        </div>
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
            {howToPlayContent.quickStartGuide?.title || "Quick Start Guide"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howToPlayContent.quickStartGuide?.steps.map((step: any, index: number) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-orange-500 custom-font">{index + 1}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 custom-font">{step.title}</h3>
                <p className="text-slate-400 text-sm body-font">
                  {step.description}
                </p>
              </div>
            ))}
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