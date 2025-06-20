class RulesEngine {
  constructor() {
    this.rules = new Map();
    this.loadDefaultRules();
  }

  loadDefaultRules() {
    // Game Overview Rules (Descriptive)
    this.addRule({
      id: 'game-type',
      type: 'global',
      name: 'Game Type',
      description: 'Cooperative, social hidden role game with programming mechanics for 3-6 players',
      category: 'overview',
      parameters: { 
        minPlayers: 3, 
        maxPlayers: 6, 
        gameType: 'cooperative-social-hidden-role',
        platform: 'mobile-web'
      },
      active: true,
      validate: () => true
    });

    this.addRule({
      id: 'player-roles',
      type: 'global',
      name: 'Player Roles',
      description: 'Players are assigned roles: Collaborators (positive), Saboteurs (negative), or Rogues (neutral)',
      category: 'overview',
      parameters: {
        roleCategories: ['collaborator', 'saboteur', 'rogue'],
        rolesAreSecret: true,
        rolesAreStatic: true
      },
      active: true,
      validate: () => true
    });

    this.addRule({
      id: 'shared-character',
      type: 'global',
      name: 'Shared Character',
      description: 'All players control a single shared character through programmed actions',
      category: 'overview',
      parameters: {
        unifiedActions: true,
        individualIntent: true,
        layeredStrategy: true
      },
      active: true,
      validate: () => true
    });

    // Global Game Rules
    this.addRule({
      id: 'one-action-per-turn',
      type: 'global',
      name: 'One Action Per Turn',
      description: 'Each player can program only one action per turn',
      category: 'programming',
      parameters: { maxActions: 1 },
      active: true,
      validate: (gameState, playerId, action) => {
        const playerActions = gameState.currentTurnActions?.filter(a => a.playerId === playerId) || [];
        return playerActions.length === 0;
      }
    });

    this.addRule({
      id: 'cycling-turn-order',
      type: 'global',
      name: 'Cycling Turn Order',
      description: 'Turn order cycles after each round - first player moves to last position, all others move up one position',
      category: 'resolution',
      parameters: { 
        turnOrderHidden: true,
        cyclingPattern: 'first-to-last'
      },
      active: true,
      validate: () => true
    });

    this.addRule({
      id: 'mandatory-action-programming',
      type: 'global',
      name: 'Mandatory Action Programming',
      description: 'Players cannot skip turns - AI assigns random valid action if no action is programmed',
      category: 'programming',
      parameters: { 
        skipTurnAllowed: false,
        aiAssignsRandomAction: true
      },
      active: true,
      validate: () => true
    });

    this.addRule({
      id: 'invalid-action-reselection',
      type: 'global',
      name: 'Invalid Action Re-selection',
      description: 'Players may adapt their actions in the resolution phase if the initial target is invalid',
      category: 'validation',
      parameters: { allowReselection: true },
      active: true,
      validate: () => true
    });

    this.addRule({
      id: 'unresolved-action-skip',
      type: 'global',
      name: 'Unresolved Action Skip',
      description: 'Unresolved actions result in a skipped turn with appropriate feedback',
      category: 'validation',
      parameters: { skipOnTimeout: true },
      active: true,
      validate: () => true
    });

    this.addRule({
      id: 'disconnection-grace-period',
      type: 'global',
      name: 'Disconnection Grace Period',
      description: 'If a player disconnects, a 60-second grace period allows for reconnection before AI takes over',
      category: 'technical',
      parameters: { 
        gracePeriodSeconds: 60,
        aiTakesOverAfterGracePeriod: true
      },
      active: true,
      validate: () => true
    });

    this.addRule({
      id: 'game-pause-unanimous',
      type: 'global',
      name: 'Unanimous Game Pause',
      description: 'Pausing the game requires unanimous agreement among all players',
      category: 'technical',
      parameters: { 
        pauseRequiresUnanimous: true
      },
      active: true,
      validate: () => true
    });

    this.addRule({
      id: 'static-roles',
      type: 'global',
      name: 'Static Role Assignment',
      description: 'Roles are static and do not change once assigned at the beginning of the game',
      category: 'roles',
      parameters: { 
        rolesCanChange: false
      },
      active: true,
      validate: () => true
    });

    this.addRule({
      id: 'multiple-winners-possible',
      type: 'global',
      name: 'Multiple Winners Possible',
      description: 'Multiple teams can win in the same game if their objectives happen to align',
      category: 'victory',
      parameters: { 
        multipleWinnersPossible: true
      },
      active: true,
      validate: () => true
    });

    this.addRule({
      id: 'no-winners-possible',
      type: 'global',
      name: 'No Winners Possible',
      description: 'If no team achieves their goal, the scenario ends in a loss for all teams',
      category: 'victory',
      parameters: { 
        noWinnersPossible: true
      },
      active: true,
      validate: () => true
    });

    // Role-Specific Rules - Saboteur
    this.addRule({
      id: 'saboteur-cooldown',
      type: 'role',
      name: 'Saboteur Action Cooldown',
      description: 'Saboteurs may only perform sabotage actions once every two turns',
      category: 'action',
      parameters: { cooldownTurns: 2 },
      roles: ['saboteur'],
      active: true,
      validate: (gameState, playerId, action) => {
        if (action.type !== 'sabotage') return true;
        const player = gameState.players.find(p => p.id === playerId);
        if (player?.role !== 'saboteur') return false;
        
        const lastSabotage = gameState.actionHistory
          ?.filter(a => a.playerId === playerId && a.type === 'sabotage')
          ?.sort((a, b) => b.turn - a.turn)[0];
        
        if (!lastSabotage) return true;
        return (gameState.currentTurn - lastSabotage.turn) >= 2;
      }
    });

    this.addRule({
      id: 'saboteur-win-if-revealed',
      type: 'role',
      name: 'Saboteur Win If Revealed',
      description: 'Saboteurs can still win even if their role is revealed, as long as they achieve their objectives',
      category: 'victory',
      parameters: { 
        winPossibleWhenRevealed: true
      },
      roles: ['saboteur'],
      active: true,
      validate: () => true
    });

    // Universal Actions
    this.addRule({
      id: 'move-action-valid',
      type: 'action',
      name: 'Move Action Validation',
      description: 'Move actions must target valid locations',
      category: 'action',
      parameters: { validTargets: ['location'] },
      actions: ['move'],
      active: true,
      validate: (gameState, playerId, action) => {
        if (action.type !== 'move') return true;
        return gameState.locations?.some(loc => loc.id === action.target);
      }
    });

    this.addRule({
      id: 'interact-action-valid',
      type: 'action',
      name: 'Interact Action Validation',
      description: 'Interact actions require valid targets (NPC, object, or location)',
      category: 'action',
      parameters: { validTargets: ['npc', 'object', 'location'] },
      actions: ['interact'],
      active: true,
      validate: (gameState, playerId, action) => {
        if (action.type !== 'interact') return true;
        const validTargets = [
          ...(gameState.npcs || []),
          ...(gameState.objects || []),
          ...(gameState.locations || [])
        ];
        return validTargets.some(target => target.id === action.target);
      }
    });

    this.addRule({
      id: 'search-action-valid',
      type: 'action',
      name: 'Search Action Validation',
      description: 'Search actions limited to locations or containers',
      category: 'action',
      parameters: { validTargets: ['location', 'container'] },
      actions: ['search'],
      active: true,
      validate: (gameState, playerId, action) => {
        if (action.type !== 'search') return true;
        const validTargets = [
          ...(gameState.locations || []),
          ...(gameState.objects?.filter(obj => obj.type === 'container') || [])
        ];
        return validTargets.some(target => target.id === action.target);
      }
    });

    // Role-Specific Rules - Collaborator
    this.addRule({
      id: 'collaborator-intention-tags',
      type: 'role',
      name: 'Collaborator Intention Tags',
      description: 'Collaborators can use: Assist, Negotiate, Investigate, Collect, Repair',
      category: 'intention',
      parameters: {
        validTags: {
          'assist': { actions: ['interact'], targets: ['any'] },
          'negotiate': { actions: ['interact'], targets: ['npc'] },
          'investigate': { actions: ['interact', 'search'], targets: ['any'] },
          'collect': { actions: ['interact'], targets: ['object'] },
          'repair': { actions: ['interact'], targets: ['object'] }
        }
      },
      roles: ['collaborator'],
      active: true,
      validate: (gameState, playerId, action) => {
        const player = gameState.players.find(p => p.id === playerId);
        if (player?.role !== 'collaborator') return true;
        
        const rule = this.rules.get('collaborator-intention-tags');
        const validTags = rule.parameters.validTags;
        const tag = action.intention;
        
        if (!tag || !validTags[tag]) return false;
        
        const tagRules = validTags[tag];
        const actionValid = tagRules.actions.includes(action.type) || tagRules.actions.includes('any');
        const targetValid = tagRules.targets.includes('any') || this.validateTargetType(gameState, action.target, tagRules.targets);
        
        return actionValid && targetValid;
      }
    });

    this.addRule({
      id: 'collaborator-repair-limit',
      type: 'role',
      name: 'Collaborator Repair Limit',
      description: 'Limited to one repair action per turn',
      category: 'action',
      parameters: { maxRepairActions: 1 },
      roles: ['collaborator'],
      active: true,
      validate: (gameState, playerId, action) => {
        if (action.intention !== 'repair') return true;
        const player = gameState.players.find(p => p.id === playerId);
        if (player?.role !== 'collaborator') return true;
        
        const repairActions = gameState.currentTurnActions?.filter(a => 
          a.playerId === playerId && a.intention === 'repair'
        ) || [];
        return repairActions.length === 0;
      }
    });

    // Role-Specific Rules - Rogue
    this.addRule({
      id: 'rogue-intention-tags',
      type: 'role',
      name: 'Rogue Intention Tags',
      description: 'Rogues can use: Infiltrate, Scout, Bypass, Manipulate, Distract',
      category: 'intention',
      parameters: {
        validTags: {
          'infiltrate': { actions: ['interact'], targets: ['any'] },
          'scout': { actions: ['any'], targets: ['location', 'npc'] },
          'bypass': { actions: ['any'], targets: ['hazard', 'npc'] },
          'manipulate': { actions: ['interact'], targets: ['npc', 'object', 'hazard'] },
          'distract': { actions: ['any'], targets: ['npc'] }
        }
      },
      roles: ['rogue'],
      active: true,
      validate: (gameState, playerId, action) => {
        const player = gameState.players.find(p => p.id === playerId);
        if (player?.role !== 'rogue') return true;
        
        const rule = this.rules.get('rogue-intention-tags');
        const validTags = rule.parameters.validTags;
        const tag = action.intention;
        
        if (!tag || !validTags[tag]) return false;
        
        const tagRules = validTags[tag];
        const actionValid = tagRules.actions.includes(action.type) || tagRules.actions.includes('any');
        const targetValid = tagRules.targets.includes('any') || this.validateTargetType(gameState, action.target, tagRules.targets);
        
        return actionValid && targetValid;
      }
    });

    // Role-Specific Rules - Saboteur
    this.addRule({
      id: 'saboteur-intention-tags',
      type: 'role',
      name: 'Saboteur Intention Tags',
      description: 'Saboteurs can use: Disrupt, Obstruct, Mislead, Tamper, Sabotage',
      category: 'intention',
      parameters: {
        validTags: {
          'disrupt': { actions: ['interact'], targets: ['any'] },
          'obstruct': { actions: ['interact'], targets: ['any'] },
          'mislead': { actions: ['any'], targets: ['npc'] },
          'tamper': { actions: ['interact'], targets: ['object'] },
          'sabotage': { actions: ['any'], targets: ['any'] }
        }
      },
      roles: ['saboteur'],
      active: true,
      validate: (gameState, playerId, action) => {
        const player = gameState.players.find(p => p.id === playerId);
        if (player?.role !== 'saboteur') return true;
        
        const rule = this.rules.get('saboteur-intention-tags');
        const validTags = rule.parameters.validTags;
        const tag = action.intention;
        
        if (!tag || !validTags[tag]) return false;
        
        const tagRules = validTags[tag];
        const actionValid = tagRules.actions.includes(action.type) || tagRules.actions.includes('any');
        const targetValid = tagRules.targets.includes('any') || this.validateTargetType(gameState, action.target, tagRules.targets);
        
        return actionValid && targetValid;
      }
    });

    this.addRule({
      id: 'sabotage-ambiguity',
      type: 'action',
      name: 'Sabotage Ambiguity Requirement',
      description: 'Sabotage actions must leave ambiguous outcomes (e.g., damaged but repairable objects)',
      category: 'resolution',
      parameters: { requireAmbiguity: true },
      actions: ['sabotage'],
      active: true,
      validate: () => true // This is enforced during resolution, not validation
    });

    // Movement Rules
    this.addRule({
      id: 'movement-tokens',
      type: 'movement',
      name: 'Movement Token System',
      description: 'Movement across locations requires Move Tokens based on location size',
      category: 'movement',
      parameters: { enforceTokens: true },
      active: true,
      validate: (gameState, playerId, action) => {
        if (action.type !== 'move') return true;
        const currentLocation = gameState.sharedCharacter?.location;
        const targetLocation = gameState.locations?.find(loc => loc.id === action.target);
        
        if (!currentLocation || !targetLocation) return false;
        
        // Check if locations are connected
        return currentLocation.connections?.includes(targetLocation.id) || false;
      }
    });

    // Accessibility Rules
    this.addRule({
      id: 'accessibility-options',
      type: 'global',
      name: 'Accessibility Options',
      description: 'Game includes adjustable text sizes, colorblind-friendly modes, and audio cues',
      category: 'technical',
      parameters: { 
        adjustableTextSizes: true,
        colorblindFriendly: true,
        audioCues: true
      },
      active: true,
      validate: () => true
    });

    // External Communication Rule
    this.addRule({
      id: 'external-communication',
      type: 'global',
      name: 'External Communication',
      description: 'Players are not prohibited from using external voice chat tools to communicate',
      category: 'technical',
      parameters: { 
        allowExternalCommunication: true
      },
      active: true,
      validate: () => true
    });
  }

  addRule(rule) {
    this.rules.set(rule.id, {
      ...rule,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  updateRule(id, updates) {
    const rule = this.rules.get(id);
    if (!rule) return false;
    
    this.rules.set(id, {
      ...rule,
      ...updates,
      updatedAt: new Date()
    });
    return true;
  }

  deleteRule(id) {
    return this.rules.delete(id);
  }

  getRule(id) {
    return this.rules.get(id);
  }

  getAllRules() {
    return Array.from(this.rules.values());
  }

  getRulesByCategory(category) {
    return this.getAllRules().filter(rule => rule.category === category);
  }

  getRulesByRole(role) {
    return this.getAllRules().filter(rule => 
      !rule.roles || rule.roles.includes(role)
    );
  }

  validateAction(gameState, playerId, action) {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      return { valid: false, errors: ['Player not found'] };
    }

    const errors = [];
    const applicableRules = this.getAllRules().filter(rule => {
      if (!rule.active) return false;
      if (rule.roles && !rule.roles.includes(player.role)) return false;
      if (rule.actions && !rule.actions.includes(action.type)) return false;
      return true;
    });

    for (const rule of applicableRules) {
      try {
        if (!rule.validate(gameState, playerId, action)) {
          errors.push(`Rule violation: ${rule.name} - ${rule.description}`);
        }
      } catch (error) {
        console.error(`Error validating rule ${rule.id}:`, error);
        errors.push(`Rule validation error: ${rule.name}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      applicableRules: applicableRules.map(r => ({ id: r.id, name: r.name }))
    };
  }

  validateTargetType(gameState, targetId, allowedTypes) {
    const allTargets = [
      ...(gameState.locations?.map(l => ({ ...l, type: 'location' })) || []),
      ...(gameState.npcs?.map(n => ({ ...n, type: 'npc' })) || []),
      ...(gameState.objects?.map(o => ({ ...o, type: o.type || 'object' })) || []),
      ...(gameState.hazards?.map(h => ({ ...h, type: 'hazard' })) || [])
    ];

    const target = allTargets.find(t => t.id === targetId);
    return target && allowedTypes.includes(target.type);
  }

  getValidIntentionTags(gameState, playerId, action) {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return [];

    const roleRules = this.getRulesByRole(player.role).filter(rule => 
      rule.category === 'intention' && rule.active
    );

    const validTags = [];
    for (const rule of roleRules) {
      const tags = rule.parameters.validTags || {};
      for (const [tagName, tagRules] of Object.entries(tags)) {
        const actionValid = tagRules.actions.includes(action.type) || tagRules.actions.includes('any');
        const targetValid = tagRules.targets.includes('any') || 
          this.validateTargetType(gameState, action.target, tagRules.targets);
        
        if (actionValid && targetValid) {
          validTags.push({
            name: tagName,
            displayName: tagName.charAt(0).toUpperCase() + tagName.slice(1),
            description: this.getIntentionTagDescription(tagName)
          });
        }
      }
    }

    return validTags;
  }

  getIntentionTagDescription(tag) {
    const descriptions = {
      'assist': 'Help another character or support group objectives',
      'negotiate': 'Attempt diplomatic interaction with NPCs',
      'investigate': 'Carefully examine for clues or information',
      'collect': 'Gather or retrieve objects',
      'repair': 'Fix damaged objects or systems',
      'infiltrate': 'Gain access through stealth or deception',
      'scout': 'Gather information about the area or NPCs',
      'bypass': 'Avoid or circumvent obstacles',
      'manipulate': 'Influence or control targets for personal gain',
      'distract': 'Draw attention away from other activities',
      'disrupt': 'Interfere with ongoing activities',
      'obstruct': 'Block or hinder progress',
      'mislead': 'Provide false information or misdirection',
      'tamper': 'Secretly alter or damage objects',
      'sabotage': 'Deliberately undermine group objectives'
    };
    return descriptions[tag] || 'Unknown intention';
  }

  calculateTurnOrder(gameState) {
    const players = gameState.players.filter(p => p.is_alive);
    const currentRound = gameState.round || 1;
    const rotationOffset = (currentRound - 1) % players.length;
    
    return players.map((_, index) => {
      const adjustedIndex = (index + rotationOffset) % players.length;
      return players[adjustedIndex];
    });
  }

  validateGameState(gameState) {
    const errors = [];
    
    // Validate basic game state structure
    if (!gameState.players || !Array.isArray(gameState.players)) {
      errors.push('Invalid players array');
    }
    
    if (!gameState.phase || !['planning', 'action', 'resolution', 'ended'].includes(gameState.phase)) {
      errors.push('Invalid game phase');
    }
    
    if (typeof gameState.turn !== 'number' || gameState.turn < 1) {
      errors.push('Invalid turn number');
    }
    
    if (typeof gameState.round !== 'number' || gameState.round < 1) {
      errors.push('Invalid round number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default RulesEngine;