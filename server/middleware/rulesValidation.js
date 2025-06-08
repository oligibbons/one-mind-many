import RulesEngine from '../services/RulesEngine.js';

const rulesEngine = new RulesEngine();

export const validateActionMiddleware = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { action_type, action_data, target, intention } = req.body;
    const userId = req.user.id;
    
    // Get current game state (this would be fetched from your game service)
    const gameState = await getGameState(gameId);
    
    if (!gameState) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    const action = {
      type: action_type,
      target,
      intention,
      data: action_data
    };
    
    const validation = rulesEngine.validateAction(gameState, userId, action);
    
    if (!validation.valid) {
      return res.status(400).json({
        message: 'Action validation failed',
        errors: validation.errors,
        rules: validation.applicableRules
      });
    }
    
    // Attach validation result to request for use in route handler
    req.actionValidation = validation;
    next();
  } catch (error) {
    console.error('Rules validation middleware error:', error);
    return res.status(500).json({ message: 'Rules validation failed' });
  }
};

export const validateGameStateMiddleware = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const gameState = await getGameState(gameId);
    
    if (!gameState) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    const validation = rulesEngine.validateGameState(gameState);
    
    if (!validation.valid) {
      return res.status(400).json({
        message: 'Invalid game state',
        errors: validation.errors
      });
    }
    
    req.gameState = gameState;
    next();
  } catch (error) {
    console.error('Game state validation middleware error:', error);
    return res.status(500).json({ message: 'Game state validation failed' });
  }
};

// Helper function to get game state (implement based on your data structure)
async function getGameState(gameId) {
  // This should fetch the current game state from your database
  // Including players, current turn, phase, locations, objects, etc.
  // Return mock data for now
  return {
    id: gameId,
    phase: 'planning',
    turn: 1,
    round: 1,
    players: [
      { id: 'player1', role: 'collaborator', is_alive: true },
      { id: 'player2', role: 'saboteur', is_alive: true },
      { id: 'player3', role: 'rogue', is_alive: true }
    ],
    locations: [
      { id: 'loc1', name: 'Prison Cell', connections: ['loc2'] },
      { id: 'loc2', name: 'Corridor', connections: ['loc1', 'loc3'] }
    ],
    objects: [
      { id: 'obj1', name: 'Key', type: 'object' },
      { id: 'obj2', name: 'Toolbox', type: 'container' }
    ],
    npcs: [
      { id: 'npc1', name: 'Guard', type: 'npc' }
    ],
    hazards: [
      { id: 'haz1', name: 'Security Camera', type: 'hazard' }
    ],
    sharedCharacter: {
      location: 'loc1',
      position: { x: 0, y: 0 }
    },
    currentTurnActions: [],
    actionHistory: []
  };
}

export { rulesEngine };