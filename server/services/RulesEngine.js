class RulesEngine {
  constructor() {
    this.rules = new Map();
    this.loadDefaultRules();
  }

  loadDefaultRules() {
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
      description: 'Turn order cycles after each round, moving the first player to the back',
      category: 'resolution',
      parameters: {},
      active: true,
      validate: () => true // This is handled by game logic, not validation
    });

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