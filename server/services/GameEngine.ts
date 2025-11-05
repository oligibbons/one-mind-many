// server/services/GameEngine.ts

import {
    GameState,
    PrivatePlayerState,
    PrioritySlot,
    SubmittedAction,
    BoardSpace,
    GameObject,
    GameNPC,
    ActiveComplication,
    CommandCard,
    Scenario, // <-- NEW: Import the full Scenario type
    PlayerRole,
    CardName,
  } from '../../src/types/game';
  import {
    SECRET_IDENTITIES,
    PLAYER_ROLES,
    SUB_ROLES,
    createNewDeck,
  } from '../data/gameData'; // <-- We ONLY import universal constants
  import { shuffle, sample, sampleSize, random, cloneDeep } from 'lodash';
  import { v4 as uuid } from 'uuid';
  
  // Defines the "in-progress" state of a round, now with the scenario
  export interface TurnState {
    scenario: Scenario; // <-- NEW: The scenario is now part of the turn
    state: GameState;
    privateStates: PrivatePlayerState[];
    actionQueue: SubmittedAction[];
    processedActions: SubmittedAction[];
    modifiers: {
      moveValue: number;
      nextActionDenied: boolean;
      nextInteractInhibited: boolean;
      skipNextMove: boolean;
      foresight: SubmittedAction | null;
      nextActionCopied: boolean;
      awaitingMoveFromPlayerId: string | null;
      pendingMoveValue: number;
    };
    previousHarbingerPosition: BoardSpace;
  }
  
  export class GameEngine {
    /**
     * Sets up a brand new game from a Scenario object.
     */
    static setupGame(
      playerUserIds: string[],
      playerUsernames: { [userId: string]: string },
      scenario: Scenario // <-- CHANGED: We now pass the full scenario
    ): { gameState: GameState; privatePlayerStates: PrivatePlayerState[] } {
      
      const gameId = uuid();
  
      // 1. Get player setup
      const shuffledPlayerIds = shuffle(playerUserIds);
      const numPlayers = shuffledPlayerIds.length;
      const identities = SECRET_IDENTITIES.slice(0, numPlayers);
      const priorityTrack: PrioritySlot[] = shuffledPlayerIds.map((playerId, i) => ({
        playerId: playerId,
        identity: identities[i],
      }));
  
      // 2. Assign Roles, Sub-Roles, and Goals
      const playerRoles: Record<string, { role: any; subRole: any; goal?: any }> = {};
      shuffledPlayerIds.forEach((playerId) => {
        const role = sample(PLAYER_ROLES)!;
        const subRole = sample(SUB_ROLES[role])!;
        let goal;
        if (role === 'Opportunist' && subRole === 'The Data Broker') {
          goal = {
            type: 'Data Broker',
            // Read from the scenario JSON
            locations: sample(scenario.opportunist_goals['Data Broker'])!,
            visited: [],
          };
        }
        playerRoles[playerId] = { role, subRole, goal };
      });
  
      // 3. Create and deal hands
      let deck = shuffle(createNewDeck());
      const playerHands: Record<string, CommandCard[]> = {};
      shuffledPlayerIds.forEach((playerId) => {
        playerHands[playerId] = deck.splice(0, 4);
      });
  
      // 4. Place Objects and NPCs
      const startPos = scenario.locations.find(l => l.name === "The Park in the Centre")!.position;
      const occupiedSpaces = new Set(
        scenario.locations.map((loc) => `${loc.position.x},${loc.position.y}`)
      );
      occupiedSpaces.add(`${startPos.x},${startPos.y}`);
      
      const getEmptySpace = (): BoardSpace => {
        while (true) {
          const x = random(1, scenario.board_size_x);
          const y = random(1, scenario.board_size_y);
          const key = `${x},${y}`;
          if (!occupiedSpaces.has(key)) {
            occupiedSpaces.add(key);
            return { x, y };
          }
        }
      };
      
      const objectCount = sample([6, 7, 8])!;
      // Read from scenario JSON
      const objectsToPlace = sampleSize(Object.keys(scenario.object_effects), objectCount);
      const boardObjects: GameObject[] = objectsToPlace.map((name) => ({
        id: uuid(), name, position: getEmptySpace(), interacted: false,
      }));
  
      // Place static and random NPCs
      const boardNPCs: GameNPC[] = [];
      const staticNpcLocations: Record<string, string> = {
        'The Slumbering Vagrant': 'Squalid Bench',
        'Gossip Karen': 'Deja Brew Coffee Shop',
        'Agnes, the Cat Lady': 'Bazaar of Gross-eries',
        'Anxious Businessman': 'Boutique of Useless Trinkets',
      };
      const npcPool = Object.keys(scenario.npc_effects);
      
      npcPool.forEach((name) => {
        const locName = staticNpcLocations[name];
        if (locName) {
          const loc = scenario.locations.find((l) => l.name === locName)!;
          boardNPCs.push({ id: uuid(), name, position: loc.position, interacted: false });
        }
      });
      
      const randomNpcPool = npcPool.filter((name) => !staticNpcLocations[name]);
      const npcsToPlace = sampleSize(randomNpcPool, 3); // 3 random NPCs
      npcsToPlace.forEach((name) => {
        boardNPCs.push({ id: uuid(), name, position: getEmptySpace(), interacted: false });
      });
  
      // 5. Create Player States
      const privatePlayerStates: PrivatePlayerState[] = [];
      const publicPlayerStates: PublicPlayerState[] = [];
      shuffledPlayerIds.forEach((playerId, i) => {
        const { role, subRole, goal } = playerRoles[playerId];
        const privateState: PrivatePlayerState = {
          id: uuid(), userId: playerId, username: playerUsernames[playerId],
          hand: playerHands[playerId], role: role, subRole: subRole,
          secretIdentity: identities[i], vp: 0, personalGoal: goal || null,
        };
        privatePlayerStates.push(privateState);
        publicPlayerStates.push({
          id: privateState.id, userId: playerId, username: playerUsernames[playerId],
          vp: 0, submittedAction: false,
        });
      });
  
      // 6. Create initial GameState
      const gameState: GameState = {
        id: gameId, status: 'active', currentRound: 1,
        scenario: { // GameState stores a *subset* of scenario data
          id: scenario.id,
          name: scenario.name,
          locations: scenario.locations,
          boardSize: { x: scenario.board_size_x, y: scenario.board_size_y },
        },
        harbingerPosition: startPos,
        priorityTrack: priorityTrack, activeComplications: [],
        boardObjects: boardObjects, boardNPCs: boardNPCs,
        players: publicPlayerStates, gameLog: [`Game started with ${numPlayers} players.`],
      };
      return { gameState, privatePlayerStates };
    }
  
    /**
     * (NEW) Initializes a new turn state for round resolution.
     */
    static startRoundResolution(
      currentState: GameState,
      allPlayerStates: PrivatePlayerState[],
      submittedActions: SubmittedAction[],
      scenario: Scenario // <-- NEW: Pass in the scenario
    ): TurnState {
      const sortedActions = submittedActions.sort((a, b) => {
        const priorityA = currentState.priorityTrack.findIndex(p => p.playerId === a.playerId);
        const priorityB = currentState.priorityTrack.findIndex(p => p.playerId === b.playerId);
        return priorityA - priorityB;
      });
  
      return {
        scenario: scenario, // <-- NEW
        state: cloneDeep(currentState),
        privateStates: cloneDeep(allPlayerStates),
        actionQueue: sortedActions,
        processedActions: [],
        modifiers: {
          moveValue: 0,
          nextActionDenied: false,
          nextInteractInhibited: false,
          skipNextMove: false,
          foresight: null,
          nextActionCopied: false,
          awaitingMoveFromPlayerId: null,
          pendingMoveValue: 0,
        },
        previousHarbingerPosition: cloneDeep(currentState.harbingerPosition),
      };
    }
  
    /**
     * (NEW) Processes a single action from the queue.
     */
    static processSingleAction(
      turnState: TurnState,
      action: SubmittedAction
    ): { nextTurnState: TurnState; pause: any } {
      let { scenario, state, privateStates, actionQueue, processedActions, modifiers, previousHarbingerPosition } = turnState;
      let actingPlayer = privateStates.find(p => p.userId === action.playerId)!;
      const actingToken = state.priorityTrack.find(p => p.playerId === action.playerId)!.identity;
  
      state.gameLog.push(`Priority ${actingToken} (${actingPlayer.username}) plays ${action.card.name}.`);
  
      // --- Check for Complication Effects ---
      const gaggle = state.activeComplications.find(c => c.name === 'Gaggle of Feral Youths');
      if (gaggle && this.isNear(state.harbingerPosition, 'The Park in the Centre', 3, state.scenario.locations)) {
        if (action.card.name.startsWith('Move')) {
          modifiers.moveValue -= 1;
          state.gameLog.push(`Gaggle of Feral Youths: Move value -1.`);
        }
      }
      // TODO: Add "Intrepid Stalker" logic here
  
      // --- Handle Action Modifiers ---
      if (modifiers.foresight && !modifiers.nextActionCopied) {
        state.gameLog.push(`${modifiers.foresight.playerId} uses Foresight to copy ${action.card.name}.`);
        actionQueue.unshift({ ...modifiers.foresight, card: action.card });
        modifiers.nextActionCopied = true;
        const foresightPlayer = privateStates.find(p => p.userId === modifiers.foresight!.playerId)!;
        if (foresightPlayer.subRole === 'The Mimic' && actingPlayer.role === 'True Believer') {
          foresightPlayer.vp += scenario.sub_role_definitions['The Mimic'].vp;
        }
      }
      if (modifiers.nextActionDenied) {
        state.gameLog.push(`Action is Denied!`);
        modifiers.nextActionDenied = false;
        processedActions.push(action);
        if (actingPlayer.subRole === 'The Instigator') actingPlayer.vp += scenario.sub_role_definitions['The Instigator'].vp;
        return { nextTurnState: turnState, pause: null };
      }
      if (modifiers.nextInteractInhibited && action.card.name === 'Interact') {
        state.gameLog.push(`Action is Inhibited!`);
        modifiers.nextInteractInhibited = false;
        processedActions.push(action);
        return { nextTurnState: turnState, pause: null };
      }
  
      // --- Handle Card Logic ---
      switch (action.card.name) {
        case 'Move 1':
        case 'Move 2':
        case 'Move 3':
          if (modifiers.skipNextMove) {
            state.gameLog.push(`Movement skipped by "Empty Can of Beans".`);
            modifiers.skipNextMove = false;
            break;
          }
          const baseMove = parseInt(action.card.name.split(' ')[1]);
          const totalMove = Math.max(0, baseMove + modifiers.moveValue);
          modifiers.moveValue = 0; // Reset *permanent* modifiers
  
          if (totalMove > 0) {
            const validMoves = this.calculateValidMoves(state.harbingerPosition, totalMove, state.scenario.boardSize);
            if (validMoves.length > 0) {
              modifiers.awaitingMoveFromPlayerId = action.playerId;
              modifiers.pendingMoveValue = totalMove;
              state.gameLog.push(`Awaiting move of ${totalMove} from ${actingPlayer.username}...`);
              const pauseData = { playerId: action.playerId, actingUsername: actingPlayer.username, validMoves: validMoves };
              return { nextTurnState: turnState, pause: pauseData }; // PAUSE
            } else {
              state.gameLog.push(`Harbinger had ${totalMove} MP but nowhere to move.`);
            }
          }
          break;
        case 'Impulse':
          const adj = this.getAdjacentSpaces(state.harbingerPosition, state.scenario.boardSize);
          if(adj.length > 0) {
            state.harbingerPosition = sample(adj)!;
            state.gameLog.push(`Harbinger moves by Impulse to ${state.harbingerPosition.x}, ${state.harbingerPosition.y}`);
          }
          break;
        case 'Hesitate': modifiers.moveValue -= 1; break;
        case 'Charge': modifiers.moveValue += 1; break;
        case 'Empower': modifiers.moveValue += 2; break;
        case 'Degrade': modifiers.moveValue -= 1; break;
        case 'Deny':
          modifiers.nextActionDenied = true;
          if (actingPlayer.subRole === 'The Instigator') actingPlayer.vp += scenario.sub_role_definitions['The Instigator'].vp;
          break;
        case 'Rethink':
          const lastAction = processedActions.pop();
          if (lastAction) {
            state.gameLog.push(`Rethink cancels ${lastAction.card.name}.`);
            // TODO: Implement "Undo" logic
          }
          if (actingPlayer.subRole === 'The Instigator') actingPlayer.vp += scenario.sub_role_definitions['The Instigator'].vp;
          break;
        case 'Homage':
          const lastCard = processedActions[processedActions.length - 1]?.card;
          if (lastCard) {
            state.gameLog.push(`Homage copies ${lastCard.name}.`);
            actionQueue.unshift({ ...action, card: lastCard });
            if (actingPlayer.subRole === 'The Mimic') {
              const originalPlayerId = processedActions[processedActions.length - 1].playerId;
              const originalPlayerRole = privateStates.find(p => p.userId === originalPlayerId)!.role;
              if (originalPlayerRole === 'True Believer') {
                actingPlayer.vp += scenario.sub_role_definitions['The Mimic'].vp;
              }
            }
          }
          break;
        case 'Foresight': modifiers.foresight = action; modifiers.nextActionCopied = false; break;
        case 'Inhibit': modifiers.nextInteractInhibited = true; break;
        case 'Interact':
          this.handleInteraction(turnState, action);
          break;
        case 'Gamble':
          state.gameLog.push(`GAMBLE! All remaining actions are randomized!`);
          const remainingPlayers = actionQueue.map(a => a.playerId);
          const remainingHands = privateStates
            .filter(p => remainingPlayers.includes(p.userId))
            .flatMap(p => p.hand);
          let newQueue: SubmittedAction[] = [];
          for (const act of actionQueue) {
            const randomCard = sample(remainingHands)!;
            remainingHands.splice(remainingHands.indexOf(randomCard), 1);
            newQueue.push({ ...act, card: randomCard });
          }
          actionQueue = newQueue;
          if (actingPlayer.subRole === 'The Instigator') actingPlayer.vp += scenario.sub_role_definitions['The Instigator'].vp;
          break;
        case 'Hail Mary':
          state.gameLog.push(`HAIL MARY! All hands are redrawn!`);
          let newDeck = shuffle(createNewDeck());
          privateStates.forEach(p => { p.hand = newDeck.splice(0, 4); });
          break;
        case 'Reload':
          state.gameLog.push(`${actingPlayer.username} uses Reload!`);
          let deck = shuffle(createNewDeck());
          actingPlayer.hand = deck.splice(0, 4);
          const randomCard = sample(actingPlayer.hand)!;
          actionQueue.unshift({ ...action, card: randomCard });
          break;
        case 'Buffer': state.gameLog.push(`...does nothing.`); break;
      }
      
      processedActions.push(action);
      return { nextTurnState: turnState, pause: null }; // CONTINUE
    }
    
    static processSubmittedMove(
      turnState: TurnState,
      position: BoardSpace
    ): { nextTurnState: TurnState } {
      const { state, modifiers } = turnState;
      state.harbingerPosition = position;
      state.gameLog.push(`Harbinger moves to ${position.x}, ${position.y}`);
      modifiers.awaitingMoveFromPlayerId = null;
      modifiers.pendingMoveValue = 0;
      return { nextTurnState: turnState };
    }
  
    static handleInteraction(turnState: TurnState, action: SubmittedAction) {
      const { scenario, state, privateStates, modifiers, actionQueue } = turnState;
      const actingPlayer = privateStates.find(p => p.userId === action.playerId)!;
      const posKey = `${state.harbingerPosition.x},${state.harbingerPosition.y}`;
      
      // Check for NPC
      const npc = state.boardNPCs.find(n => `${n.position.x},${n.position.y}` === posKey);
      if (npc && !npc.interacted) {
        state.gameLog.push(`Interacting with NPC: ${npc.name}`);
        const data = scenario.npc_effects[npc.name];
        const outcome = Math.random() < 0.5 ? 'positive' : 'negative';
        state.gameLog.push(`Outcome: ${outcome}! (${data[outcome]})`);
        npc.interacted = true;
        
        switch (npc.name) {
          case 'The Slumbering Vagrant':
            privateStates.filter(p => p.role === 'True Believer').forEach(p => p.vp += 3);
            break;
          case 'Gossip Karen':
            if (outcome === 'positive') state.gameLog.push(`(Event for ${actingPlayer.username}: Look at Complication deck)`); // TODO: Emit
            else {
              const bank = scenario.locations.find(l => l.name === 'Collapsital One Bank')!;
              state.harbingerPosition = this.moveTowards(state.harbingerPosition, bank.position);
            }
            break;
          case 'Agnes, the Cat Lady':
            if (outcome === 'positive') modifiers.moveValue += state.activeComplications.length;
            else {
              const bench = scenario.locations.find(l => l.name === 'Squalid Bench')!;
              state.harbingerPosition = this.moveTowards(state.harbingerPosition, bench.position);
            }
            break;
          // ... ALL other NPC logic ...
        }
        return;
      }
      
      // Check for Object
      const obj = state.boardObjects.find(o => `${o.position.x},${o.position.y}` === posKey);
      if (obj) {
        state.gameLog.push(`Interacting with Object: ${obj.name}`);
        state.boardObjects = state.boardObjects.filter(o => o.id !== obj.id); // One-use
        const data = scenario.object_effects[obj.name];
        state.gameLog.push(`Effect: ${data.effect}`);
        
        switch (obj.name) {
          case 'The Rubber Duck':
            actionQueue.unshift({ ...action, card: { id: uuid(), name: 'Move 1', effect: 'Move 1 space.' } });
            break;
          case 'Empty Can of Beans':
            modifiers.skipNextMove = true;
            break;
          case 'Warped Penny':
            state.harbingerPosition = this.getEmptySpace(state, scenario);
            break;
          case 'Mysterious Red Thread':
            const lastComp = state.activeComplications.pop();
            if (lastComp) {
              state.gameLog.push(`Removed Complication: ${lastComp.name}`);
              privateStates.forEach(p => {
                if (p.subRole === 'The Fixer') p.vp += scenario.sub_role_definitions['The Fixer'].vp;
              });
            }
            break;
          case 'A Very Large Rock':
            if (actingPlayer.role === 'True Believer') privateStates.forEach(p => p.vp += (p.role === 'True Believer' ? 2 : 0));
            else if (actingPlayer.role === 'Heretic') privateStates.forEach(p => p.vp -= (p.role === 'True Believer' ? 2 : 0));
            else {
              actingPlayer.vp += 1;
              privateStates.forEach(p => p.vp -= (p.userId !== actingPlayer.userId ? 1 : 0));
            }
            break;
          case 'Grandad’s Lost Reading Glasses':
            actingPlayer.hand.push(sample(createNewDeck())!);
            break;
          case 'The Other Sock':
            actionQueue.unshift({ ...action, card: { id: uuid(), name: 'Hail Mary', effect: '...' } });
            break;
          // ... ALL other Object logic ...
        }
        return;
      }
      state.gameLog.push(`Interacted with... nothing.`);
    }
  
    static applyEndOfRoundEffects(
      turnState: TurnState
    ): { nextState: GameState; nextPrivateStates: PrivatePlayerState[] } {
      let { scenario, state, privateStates, previousHarbingerPosition } = turnState;
  
      // Check Sub-Role VPs
      privateStates.forEach(p => {
        // The Waster
        const wasterDef = scenario.sub_role_definitions['The Waster'];
        if (p.subRole === 'The Waster' &&
            state.harbingerPosition.x === previousHarbingerPosition.x &&
            state.harbingerPosition.y === previousHarbingerPosition.y) {
          p.vp += wasterDef.vp;
          state.gameLog.push(`${p.username} gains ${wasterDef.vp} VP (The Waster).`);
        }
        // The Guide
        const guideDef = scenario.sub_role_definitions['The Guide'];
        if (p.subRole === 'The Guide') {
          const safeZone = scenario.locations.find(l => guideDef.locations.includes(l.name));
          if (safeZone && state.harbingerPosition.x === safeZone.position.x && state.harbingerPosition.y === safeZone.position.y) {
            p.vp += guideDef.vp;
            state.gameLog.push(`${p.username} gains ${guideDef.vp} VP (The Guide).`);
          }
        }
      });
      
      // Check Opportunist Goals
      privateStates.forEach(p => {
        if (p.personalGoal?.type === 'Data Broker') {
          const currentLoc = scenario.locations.find(l => 
            l.position.x === state.harbingerPosition.x && l.position.y === state.harbingerPosition.y);
          if (currentLoc && 
              p.personalGoal.locations.includes(currentLoc.name) &&
              !p.personalGoal.visited.includes(currentLoc.name)) {
            p.personalGoal.visited.push(currentLoc.name);
            state.gameLog.push(`${p.username} (Data Broker) visited ${currentLoc.name}!`);
          }
        }
      });
  
      // Handle Complications
      state.activeComplications = state.activeComplications.filter(c => {
        if (c.duration > 0) c.duration -= 1;
        return c.duration !== 0;
      });
      if (Math.random() < 0.20 && state.activeComplications.length < 3) {
        const newCompName = sample(Object.keys(scenario.complication_effects))!;
        const compData = scenario.complication_effects[newCompName];
        state.activeComplications.push({
          id: uuid(), name: newCompName, effect: compData.effect,
          duration: compData.duration,
        });
        state.gameLog.push(`New Complication added: ${newCompName}!`);
        // TODO: Implement "Immediate" complication effects
      }
      
      // Check Win Conditions
      state = this.checkWinConditions(state, privateStates, turnState.processedActions, scenario);
      
      // Rotate Priority Track
      const firstPriority = state.priorityTrack.shift()!;
      state.priorityTrack.push(firstPriority);
      state.gameLog.push(`Priority Track rotates. ${firstPriority.identity} moves to last.`);
      state.currentRound += 1;
      
      // Refill hands
      if ((state.currentRound - 1) % 3 === 0 && state.status === 'active') {
        state.gameLog.push(`Refilling all player hands.`);
        let deck = shuffle(createNewDeck());
        privateStates.forEach(p => { p.hand = deck.splice(0, 4); });
      }
      state.players.forEach(p => p.submittedAction = false);
  
      return { nextState: state, nextPrivateStates: privateStates };
    }
    
    static checkWinConditions(
      currentState: GameState,
      privateStates: PrivatePlayerState[],
      processedActions: SubmittedAction[],
      scenario: Scenario // <-- NEW
    ): GameState {
      if (currentState.status === 'finished') return currentState;
      
      const posKey = `${currentState.harbingerPosition.x},${currentState.harbingerPosition.y}`;
      
      // 1. Doomsday Condition
      const doomsdayLoc = scenario.locations.find(l => l.name === scenario.doomsday_condition.lose_location)!;
      if (posKey === `${doomsdayLoc.position.x},${doomsdayLoc.position.y}`) {
        currentState.gameLog.push(scenario.doomsday_condition.trigger_message);
        return this.endGame(currentState, privateStates, scenario.doomsday_condition.winner);
      }
      
      // 2. Main Prophecy
      const prophecyLoc = scenario.locations.find(l => l.name === scenario.main_prophecy.win_location)!;
      const lastAction = processedActions[processedActions.length - 1];
      if (posKey === `${prophecyLoc.position.x},${prophecyLoc.position.y}` && 
          lastAction?.card.name === scenario.main_prophecy.win_action) {
        currentState.gameLog.push(scenario.main_prophecy.trigger_message);
        return this.endGame(currentState, privateStates, scenario.main_prophecy.winner);
      }
      
      // 3. Opportunist Win
      for (const p of privateStates) {
        if (p.personalGoal?.type === 'Data Broker') {
          if (p.personalGoal.visited.length === p.personalGoal.locations.length) {
            currentState.gameLog.push(`OPPORTUNIST WIN! ${p.username} completed their shopping list!`);
            return this.endGame(currentState, privateStates, 'Opportunist', p.userId);
          }
        }
      }
  
      // 4. Global Fail
      const failCond = scenario.global_fail_condition;
      const globalFailLoc = scenario.locations.find(l => l.name === failCond.lose_location)!;
      if (currentState.currentRound >= failCond.max_round &&
          posKey === `${globalFailLoc.position.x},${globalFailLoc.position.y}`) {
        currentState.gameLog.push(failCond.trigger_message);
        return this.endGame(currentState, privateStates, failCond.winner);
      }
      
      return currentState;
    }
    
    static endGame(
      state: GameState,
      privateStates: PrivatePlayerState[],
      winningRole: PlayerRole | 'Opportunist',
      opportunistWinnerId?: string
    ): GameState {
      state.status = 'finished';
      privateStates.forEach(p => {
        if (p.role === winningRole) p.vp += 20; // TODO: Read VP from scenario JSON
        if (p.role === 'Opportunist' && p.userId === opportunistWinnerId) p.vp += 30;
        const publicPlayer = state.players.find(pp => pp.userId === p.userId)!;
        publicPlayer.vp = p.vp;
      });
      state.gameLog.push("--- GAME OVER ---");
      return state;
    }
  
    // --- Utility Functions (unchanged) ---
  
    static getAdjacentSpaces(pos: BoardSpace, size: BoardSpace): BoardSpace[] {
      const spaces: BoardSpace[] = [];
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          if (x === 0 && y === 0) continue;
          const newX = pos.x + x;
          const newY = pos.y + y;
          if (newX >= 1 && newX <= size.x && newY >= 1 && newY <= size.y) {
            spaces.push({ x: newX, y: newY });
          }
        }
      }
      return spaces;
    }
    
    static getEmptySpace(state: GameState, scenario: Scenario): BoardSpace {
       const occupiedSpaces = new Set(
         scenario.locations.map((loc) => `${loc.position.x},${loc.position.y}`)
       );
       occupiedSpaces.add(`${state.harbingerPosition.x},${state.harbingerPosition.y}`);
       state.boardObjects.forEach(o => occupiedSpaces.add(`${o.position.x},${o.position.y}`));
       state.boardNPCs.forEach(n => occupiedSpaces.add(`${n.position.x},${n.position.y}`));
       while (true) {
         const x = random(1, scenario.board_size_x);
         const y = random(1, scenario.board_size_y);
         const key = `${x},${y}`;
         if (!occupiedSpaces.has(key)) { return { x, y }; }
       }
    }
    
    static moveTowards(start: BoardSpace, end: BoardSpace): BoardSpace {
      const dx = Math.sign(end.x - start.x);
      const dy = Math.sign(end.y - start.y);
      return { x: start.x + dx, y: start.y + dy };
    }
    
    static isNear(pos: BoardSpace, locName: string, distance: number, locations: Location[]): boolean {
      const loc = locations.find(l => l.name === locName);
      if (!loc) return false;
      const dist = Math.max(Math.abs(pos.x - loc.position.x), Math.abs(pos.y - loc.position.y));
      return dist <= distance;
    }
  
    static calculateValidMoves(
      startPos: BoardSpace,
      mp: number,
      boardSize: BoardSpace
    ): BoardSpace[] {
      let minOrthogonal, maxDiagonal;
      switch (mp) {
        case 1: minOrthogonal = 1; maxDiagonal = 0; break;
        case 2: minOrthogonal = 1; maxDiagonal = 1; break;
        case 3: minOrthogonal = 2; maxDiagonal = 1; break;
        case 4: minOrthogonal = 2; maxDiagonal = 2; break;
        case 5: minOrthogonal = 3; maxDiagonal = 2; break;
        default: minOrthogonal = Math.ceil(mp / 2); maxDiagonal = Math.floor(mp / 2);
      }
      const validEndSpaces: BoardSpace[] = [];
      const queue: [{ pos: BoardSpace, o: number, d: number }]= [{ pos: startPos, o: 0, d: 0 }];
      const visited = new Set<string>();
      visited.add(`${startPos.x},${startPos.y},0,0`);
      const orthMoves = [{x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0}, {x: -1, y: 0}];
      const diagMoves = [{x: 1, y: 1}, {x: 1, y: -1}, {x: -1, y: 1}, {x: -1, y: -1}];
      while (queue.length > 0) {
        const { pos, o, d } = queue.shift()!;
        const totalSteps = o + d;
        if (totalSteps <= mp && o >= Math.ceil(totalSteps / 2) && d <= Math.floor(totalSteps / 2)) {
           if (totalSteps > 0) validEndSpaces.push(pos);
        }
        if (totalSteps === mp) continue;
        for (const move of orthMoves) {
          const nextPos = { x: pos.x + move.x, y: pos.y + move.y };
          const nextO = o + 1;
          const nextD = d;
          const stateKey = `${nextPos.x},${nextPos.y},${nextO},${nextD}`;
          if (nextPos.x >= 1 && nextPos.x <= boardSize.x && nextPos.y >= 1 && nextPos.y <= boardSize.y && !visited.has(stateKey)) {
            if (nextO + nextD <= mp) {
              visited.add(stateKey);
              queue.push({ pos: nextPos, o: nextO, d: nextD });
            }
          }
        }
        for (const move of diagMoves) {
          const nextPos = { x: pos.x + move.x, y: pos.y + move.y };
          const nextO = o;
          const nextD = d + 1;
          const stateKey = `${nextPos.x},${nextPos.y},${nextO},${nextD}`;
          if (nextPos.x >= 1 && nextPos.x <= boardSize.x && nextPos.y >= 1 && nextPos.y <= boardSize.y && !visited.has(stateKey)) {
             if (nextO + nextD <= mp && nextD <= maxDiagonal) {
               visited.add(stateKey);
               queue.push({ pos: nextPos, o: nextO, d: nextD });
             }
          }
        }
      }
      const uniqueSpaces = Array.from(new Set(validEndSpaces.map(p => `${p.x},${p.y}`)))
        .map(s => ({ x: parseInt(s.split(',')[0]), y: parseInt(s.split(',')[1]) }));
      return uniqueSpaces;
    }
  }