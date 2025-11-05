// server/services/GameEngine.ts

import {
    GameState,
    PrivatePlayerState,
    PublicPlayerState,
    PrioritySlot,
    SecretIdentity,
    PlayerRole,
    PlayerSubRole,
    CommandCard,
    BoardSpace,
    SubmittedAction,
    Location,
    GameObject,
    GameNPC,
    CardName,
  } from '../../src/types/game';
  import {
    SCENARIO_DATA,
    SECRET_IDENTITIES,
    PLAYER_ROLES,
    SUB_ROLES,
    createNewDeck,
    OPPORTUNIST_GOALS,
    OBJECT_DATA,
    NPC_DATA,
    COMPLICATION_DATA,
    COMMAND_CARDS,
  } from '../data/gameData';
  import { shuffle, sample, sampleSize, random } from 'lodash';
  import { v4 as uuid } from 'uuid';
  
  export class GameEngine {
    /**
     * Sets up a brand new game.
     */
    static setupGame(
      playerUserIds: string[],
      playerUsernames: { [userId: string]: string },
      scenarioName: 'wanting-beggar'
    ): { gameState: GameState; privatePlayerStates: PrivatePlayerState[] } {
      
      const scenario = SCENARIO_DATA[scenarioName];
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
      const playerRoles: Record<string, { role: PlayerRole; subRole: PlayerSubRole; goal?: any }> = {};
      shuffledPlayerIds.forEach(playerId => {
        const role = sample(PLAYER_ROLES)!;
        const subRole = sample(SUB_ROLES[role])!;
        let goal;
        if (role === 'Opportunist' && subRole === 'The Data Broker') {
          goal = {
            type: 'Data Broker',
            locations: sample(OPPORTUNIST_GOALS['Data Broker'])!,
            visited: [],
          };
        }
        playerRoles[playerId] = { role, subRole, goal };
      });
  
      // 3. Create and deal hands
      let deck = shuffle(createNewDeck());
      const playerHands: Record<string, CommandCard[]> = {};
      shuffledPlayerIds.forEach(playerId => {
        playerHands[playerId] = deck.splice(0, 4);
      });
  
      // 4. Place Objects and NPCs
      const occupiedSpaces = new Set(scenario.locations.map(loc => `${loc.position.x},${loc.position.y}`));
      occupiedSpaces.add(`${scenario.startPosition.x},${scenario.startPosition.y}`);
      
      const getEmptySpace = (): BoardSpace => {
        while (true) {
          const x = random(1, scenario.boardSize.x);
          const y = random(1, scenario.boardSize.y);
          const key = `${x},${y}`;
          if (!occupiedSpaces.has(key)) {
            occupiedSpaces.add(key);
            return { x, y };
          }
        }
      };
  
      // Place 6-8 random objects
      const objectCount = sample([6, 7, 8])!;
      const objectsToPlace = sampleSize(scenario.objectPool, objectCount);
      const boardObjects: GameObject[] = objectsToPlace.map(name => ({
        id: uuid(),
        name,
        position: getEmptySpace(),
        interacted: false,
      }));
  
      // Place static and random NPCs
      const boardNPCs: GameNPC[] = [];
      const staticNPCs = scenario.npcPool.filter(name => NPC_DATA[name].positive !== 'Randomly Appears'); // GDD quirk
      const randomNPCs = scenario.npcPool.filter(name => NPC_DATA[name].positive === 'Randomly Appears'); // GDD quirk - This is not in GDD, assuming a property
      
      // This is a guess based on GDD structure. Let's adjust.
      // GDD: "The Slumbering Vagrant" (Static Goal), "Gossip Karen" (Static), etc.
      // "A Very Important Dog" (Randomly Appears)
      const staticNpcLocations: Record<string, string> = {
        'The Slumbering Vagrant': 'Squalid Bench',
        'Gossip Karen': 'Deja Brew Coffee Shop',
        'Agnes, the Cat Lady': 'Bazaar of Gross-eries',
        'Anxious Businessman': 'Boutique of Useless Trinkets',
      };
      
      scenario.npcPool.forEach(name => {
        const locName = staticNpcLocations[name];
        if (locName) {
          const loc = scenario.locations.find(l => l.name === locName)!;
          boardNPCs.push({
            id: uuid(),
            name,
            position: loc.position,
            interacted: false,
          });
        }
      });
  
      // Place 3 random NPCs (from the "Randomly Appears" pool)
      const randomNpcPool = scenario.npcPool.filter(name => !staticNpcLocations[name]);
      const npcsToPlace = sampleSize(randomNpcPool, 3);
      npcsToPlace.forEach(name => {
        boardNPCs.push({
          id: uuid(),
          name,
          position: getEmptySpace(),
          interacted: false,
        });
      });
  
      // 5. Create Player States
      const privatePlayerStates: PrivatePlayerState[] = [];
      const publicPlayerStates: PublicPlayerState[] = [];
  
      shuffledPlayerIds.forEach((playerId, i) => {
        const { role, subRole, goal } = playerRoles[playerId];
        const privateState: PrivatePlayerState = {
          id: uuid(),
          userId: playerId,
          username: playerUsernames[playerId],
          hand: playerHands[playerId],
          role: role,
          subRole: subRole,
          secretIdentity: identities[i],
          vp: 0,
          personalGoal: goal || null,
        };
        privatePlayerStates.push(privateState);
  
        publicPlayerStates.push({
          id: privateState.id,
          userId: playerId,
          username: playerUsernames[playerId],
          vp: 0,
          submittedAction: false,
        });
      });
  
      // 6. Create initial GameState
      const gameState: GameState = {
        id: gameId,
        status: 'active',
        currentRound: 1,
        scenario: {
          name: scenario.name,
          locations: scenario.locations,
        },
        harbingerPosition: scenario.startPosition,
        priorityTrack: priorityTrack,
        activeComplications: [],
        boardObjects: boardObjects,
        boardNPCs: boardNPCs,
        players: publicPlayerStates,
        gameLog: [`Game started with ${numPlayers} players.`],
      };
  
      return { gameState, privatePlayerStates };
    }
  
    /**
     * Resolves a complete game round.
     */
    static resolveRound(
      currentState: GameState,
      allPlayerStates: PrivatePlayerState[], // We need private states for VP
      submittedActions: SubmittedAction[]
    ): { nextState: GameState; nextPrivateStates: PrivatePlayerState[] } {
      
      let nextState = JSON.parse(JSON.stringify(currentState)) as GameState;
      let nextPrivateStates = JSON.parse(JSON.stringify(allPlayerStates)) as PrivatePlayerState[];
      
      nextState.gameLog.push(`--- Round ${nextState.currentRound} Begin ---`);
  
      // 1. Sort actions by current priority
      const sortedActions = submittedActions.sort((a, b) => {
        const priorityA = nextState.priorityTrack.findIndex(p => p.playerId === a.playerId);
        const priorityB = nextState.priorityTrack.findIndex(p => p.playerId === b.playerId);
        return priorityA - priorityB;
      });
  
      // 2. Create a processing queue
      let actionQueue = [...sortedActions];
      let processedActions: SubmittedAction[] = [];
      
      // 3. Set up round-based state modifiers
      let roundModifiers = {
        moveValue: 0,
        nextActionDenied: false,
        nextInteractInhibited: false,
        nextMoveValue: 0,
        skipNextMove: false,
        foresight: null as SubmittedAction | null,
        nextActionCopied: false,
      };
  
      // 4. Process the action queue sequentially
      while (actionQueue.length > 0) {
        const action = actionQueue.shift()!;
        const actingPlayer = nextPrivateStates.find(p => p.userId === action.playerId)!;
        const actingToken = nextState.priorityTrack.find(p => p.playerId === action.playerId)!.identity;
        
        nextState.gameLog.push(`Priority ${actingToken} (${actingPlayer.username}) plays ${action.card.name}.`);
  
        // 4a. Handle Foresight (preemptive copy)
        if (roundModifiers.foresight && !roundModifiers.nextActionCopied) {
          nextState.gameLog.push(`${roundModifiers.foresight.playerId} uses Foresight to copy ${action.card.name}.`);
          actionQueue.unshift({ ...roundModifiers.foresight, card: action.card });
          roundModifiers.nextActionCopied = true; // Only copies one
        }
  
        // 4b. Handle Deny
        if (roundModifiers.nextActionDenied) {
          nextState.gameLog.push(`Action is Denied!`);
          roundModifiers.nextActionDenied = false;
          processedActions.push(action);
          if (actingPlayer.subRole === 'The Instigator') actingPlayer.vp += 5;
          continue;
        }
        
        // 4c. Handle Inhibit
        if (roundModifiers.nextInteractInhibited && action.card.name === 'Interact') {
          nextState.gameLog.push(`Action is Inhibited!`);
          roundModifiers.nextInteractInhibited = false;
          processedActions.push(action);
          continue;
        }
  
        // 4d. Handle Card Logic
        switch (action.card.name) {
          // --- MOVEMENT ---
          case 'Move 1':
          case 'Move 2':
          case 'Move 3':
            if (roundModifiers.skipNextMove) {
              nextState.gameLog.push(`Movement skipped by "Empty Can of Beans".`);
              roundModifiers.skipNextMove = false;
              break;
            }
            const baseMove = parseInt(action.card.name.split(' ')[1]);
            const totalMove = Math.max(0, baseMove + roundModifiers.moveValue + roundModifiers.nextMoveValue);
            roundModifiers.moveValue = 0; // Card-specific modifiers reset
            roundModifiers.nextMoveValue = 0;
            
            if (totalMove > 0) {
              // This is complex. We'd emit an event to the client 'request:move'
              // and wait for their 'response:move'
              // For now, we'll just move randomly
              // TODO: Replace with player-driven move
              const validMoves = this.calculateValidMoves(nextState.harbingerPosition, totalMove, nextState.scenario.boardSize);
              if (validMoves.length > 0) {
                nextState.harbingerPosition = sample(validMoves)!;
                nextState.gameLog.push(`Harbinger moves to ${nextState.harbingerPosition.x}, ${nextState.harbingerPosition.y}`);
              } else {
                nextState.gameLog.push(`Harbinger had ${totalMove} MP but nowhere to move.`);
              }
            }
            break;
          case 'Impulse':
            const adj = this.getAdjacentSpaces(nextState.harbingerPosition, nextState.scenario.boardSize);
            nextState.harbingerPosition = sample(adj)!;
            nextState.gameLog.push(`Harbinger moves by Impulse to ${nextState.harbingerPosition.x}, ${nextState.harbingerPosition.y}`);
            break;
  
          // --- MOVE MODIFIERS ---
          case 'Hesitate':
            roundModifiers.nextMoveValue -= 1;
            break;
          case 'Charge':
            roundModifiers.nextMoveValue += 1;
            break;
          case 'Empower':
            roundModifiers.nextMoveValue += 2;
            break;
          case 'Degrade':
            roundModifiers.nextMoveValue -= 1;
            break;
  
          // --- ACTION CONTROL ---
          case 'Deny':
            roundModifiers.nextActionDenied = true;
            if (actingPlayer.subRole === 'The Instigator') actingPlayer.vp += 5;
            break;
          case 'Rethink':
            const lastAction = processedActions.pop();
            if (lastAction) {
              nextState.gameLog.push(`Rethink cancels ${lastAction.card.name}.`);
              // TODO: Add complex "undo" logic. This is very hard.
              // For now, it just logs and removes from "processed"
            }
            if (actingPlayer.subRole === 'The Instigator') actingPlayer.vp += 5;
            break;
          case 'Homage':
            const lastCard = processedActions[processedActions.length - 1]?.card;
            if (lastCard) {
              nextState.gameLog.push(`Homage copies ${lastCard.name}.`);
              actionQueue.unshift({ ...action, card: lastCard });
            }
            break;
          case 'Foresight':
            roundModifiers.foresight = action;
            roundModifiers.nextActionCopied = false;
            break;
          case 'Inhibit':
            roundModifiers.nextInteractInhibited = true;
            break;
          
          // --- INTERACTION ---
          case 'Interact':
            const result = this.handleInteraction(nextState, actingPlayer);
            nextState = result.nextState;
            if (result.actingPlayer) {
               const playerIndex = nextPrivateStates.findIndex(p => p.userId === actingPlayer.userId);
               nextPrivateStates[playerIndex] = result.actingPlayer;
            }
            // Check for "The Waster" sub-role
            // TODO: Need to store previous round's position
            break;
  
          // --- CHAOS ---
          case 'Gamble':
            nextState.gameLog.push(`GAMBLE! All remaining actions are randomized!`);
            const remainingPlayers = actionQueue.map(a => a.playerId);
            const remainingHands = nextPrivateStates
              .filter(p => remainingPlayers.includes(p.userId))
              .flatMap(p => p.hand);
            
            let newQueue: SubmittedAction[] = [];
            for (const action of actionQueue) {
              const randomCard = sample(remainingHands)!;
              // Remove card from pool
              remainingHands.splice(remainingHands.indexOf(randomCard), 1);
              newQueue.push({ ...action, card: randomCard });
            }
            actionQueue = newQueue;
            if (actingPlayer.subRole === 'The Instigator') actingPlayer.vp += 5;
            break;
            
          case 'Hail Mary':
            nextState.gameLog.push(`HAIL MARY! All hands are redrawn!`);
            let newDeck = shuffle(createNewDeck());
            nextPrivateStates.forEach(p => {
              p.hand = newDeck.splice(0, 4);
            });
            break;
            
          case 'Reload':
            nextState.gameLog.push(`${actingPlayer.username} uses Reload!`);
            let deck = shuffle(createNewDeck());
            actingPlayer.hand = deck.splice(0, 4);
            const randomCard = sample(actingPlayer.hand)!;
            actionQueue.unshift({ ...action, card: randomCard });
            break;
  
          case 'Buffer':
            nextState.gameLog.push(`...does nothing.`);
            break;
        }
        processedActions.push(action);
      }
      
      // 5. --- End of Round ---
      nextState = this.applyEndOfRoundEffects(nextState, nextPrivateStates);
      nextState = this.checkWinConditions(nextState, nextPrivateStates);
      
      // 5a. Rotate Priority Track
      const firstPriority = nextState.priorityTrack.shift()!;
      nextState.priorityTrack.push(firstPriority);
      nextState.gameLog.push(`Priority Track rotates. ${firstPriority.identity} moves to last.`);
  
      // 5b. Increment round
      nextState.currentRound += 1;
      
      // 5c. Refill hands every 3 rounds
      if (nextState.currentRound % 3 === 0) {
        nextState.gameLog.push(`Refilling all player hands.`);
        let deck = shuffle(createNewDeck());
        nextPrivateStates.forEach(p => {
          p.hand = deck.splice(0, 4);
        });
      }
  
      // 5d. Reset player 'submittedAction' status
      nextState.players.forEach(p => p.submittedAction = false);
  
      return { nextState, nextPrivateStates };
    }
    
    /**
     * (NEW) Handles the complex "Interact" card
     */
    static handleInteraction(
      currentState: GameState,
      actingPlayer: PrivatePlayerState
    ): { nextState: GameState; actingPlayer: PrivatePlayerState | null } {
      let nextState = currentState;
      const posKey = `${nextState.harbingerPosition.x},${nextState.harbingerPosition.y}`;
      
      // Check for NPC
      const npc = nextState.boardNPCs.find(n => `${n.position.x},${n.position.y}` === posKey);
      if (npc) {
        nextState.gameLog.push(`Interacting with NPC: ${npc.name}`);
        const data = NPC_DATA[npc.name as keyof typeof NPC_DATA];
        const outcome = Math.random() < 0.5 ? 'positive' : 'negative';
        nextState.gameLog.push(`Outcome: ${outcome}!`);
        
        // TODO: Implement all NPC effects
        if (npc.name === 'Gossip Karen' && outcome === 'negative') {
          const bank = nextState.scenario.locations.find(l => l.name === 'Collapsital One Bank')!;
          nextState.harbingerPosition = this.moveTowards(nextState.harbingerPosition, bank.position);
        }
        npc.interacted = true;
        return { nextState, actingPlayer };
      }
      
      // Check for Object
      const obj = nextState.boardObjects.find(o => `${o.position.x},${o.position.y}` === posKey);
      if (obj) {
        nextState.gameLog.push(`Interacting with Object: ${obj.name}`);
        const data = OBJECT_DATA[obj.name as keyof typeof OBJECT_DATA];
        
        // TODO: Implement all Object effects
        if (obj.name === 'A Very Large Rock') {
          if (actingPlayer.role === 'True Believer') {
            nextState.players.forEach(p => p.vp += 2);
          } else if (actingPlayer.role === 'Heretic') {
            nextState.players.forEach(p => p.vp -= 2); // This affects all players
          } else {
            actingPlayer.vp += 1;
            nextState.players.filter(p => p.userId !== actingPlayer.userId).forEach(p => p.vp -= 1);
          }
        }
        obj.interacted = true; // Objects are one-use
        nextState.boardObjects = nextState.boardObjects.filter(o => o.id !== obj.id);
        return { nextState, actingPlayer };
      }
      
      nextState.gameLog.push(`Interacted with... nothing.`);
      return { nextState, actingPlayer };
    }
    
    /**
     * (NEW) Handles end of round logic (VP, Complications)
     */
    static applyEndOfRoundEffects(
      currentState: GameState,
      privateStates: PrivatePlayerState[]
    ): GameState {
      let nextState = currentState;
      
      // Check Sub-Role VPs
      privateStates.forEach(p => {
        if (p.subRole === 'The Guide') {
          // TODO: Need to define "Safe Zones"
        }
      });
  
      // Handle Complications
      // TODO: Tick down durations, remove expired
      
      // 20% chance of new Complication
      if (Math.random() < 0.20 && nextState.activeComplications.length < 3) {
        const scenario = SCENARIO_DATA['wanting-beggar'];
        const newCompName = sample(scenario.complicationPool)!;
        const compData = COMPLICATION_DATA[newCompName as keyof typeof COMPLICATION_DATA];
        nextState.activeComplications.push({
          id: uuid(),
          name: newCompName,
          effect: compData.effect,
          duration: compData.duration,
        });
        nextState.gameLog.push(`New Complication added: ${newCompName}!`);
      }
      
      return nextState;
    }
    
    /**
     * (NEW) Checks for win/fail conditions
     */
    static checkWinConditions(
      currentState: GameState,
      privateStates: PrivatePlayerState[]
    ): GameState {
      const scenario = SCENARIO_DATA['wanting-beggar'];
      const posKey = `${currentState.harbingerPosition.x},${currentState.harbingerPosition.y}`;
      
      // Doomsday Condition
      const doomsdayLoc = scenario.locations.find(l => l.name === scenario.doomsdayCondition.location)!;
      if (posKey === `${doomsdayLoc.position.x},${doomsdayLoc.position.y}`) {
        nextState.gameLog.push(`DOOMSDAY! The Harbinger entered ${doomsdayLoc.name}!`);
        nextState.status = 'finished';
        return nextState;
      }
      
      // Main Prophecy
      // TODO: Check if "Interact" was the action
      
      // Global Fail
      const globalFailLoc = scenario.locations.find(l => l.name === scenario.globalFailCondition.location)!;
      if (posKey === `${globalFailLoc.position.x},${globalFailLoc.position.y}` && currentState.currentRound >= scenario.globalFailCondition.maxRound) {
        nextState.gameLog.push(`GLOBAL FAIL! Time ran out!`);
        nextState.status = 'finished';
        return nextState;
      }
      
      return currentState;
    }
    
    /**
     * (NEW) Gets adjacent spaces
     */
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
    
    /**
     * (NEW) Helper to move 1 space towards a target
     */
    static moveTowards(start: BoardSpace, end: BoardSpace): BoardSpace {
      const dx = Math.sign(end.x - start.x);
      const dy = Math.sign(end.y - start.y);
      return { x: start.x + dx, y: start.y + dy };
    }
  
    /**
     * (NEW) Calculates all valid moves based on GDD rules.
     */
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
      const visited = new Set<string>(); // "x,y,o,d"
      visited.add(`${startPos.x},${startPos.y},0,0`);
  
      const orthMoves = [{x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0}, {x: -1, y: 0}];
      const diagMoves = [{x: 1, y: 1}, {x: 1, y: -1}, {x: -1, y: 1}, {x: -1, y: -1}];
      
      while (queue.length > 0) {
        const { pos, o, d } = queue.shift()!;
        const totalSteps = o + d;
        
        if (totalSteps === mp) {
          if (o >= minOrthogonal && d <= maxDiagonal) {
            validEndSpaces.push(pos);
          }
          continue; // Reached max steps
        }
        
        // Try Orthogonal moves
        for (const move of orthMoves) {
          const nextPos = { x: pos.x + move.x, y: pos.y + move.y };
          const nextO = o + 1;
          const nextD = d;
          const stateKey = `${nextPos.x},${nextPos.y},${nextO},${nextD}`;
          
          if (nextPos.x >= 1 && nextPos.x <= boardSize.x && nextPos.y >= 1 && nextPos.y <= boardSize.y && !visited.has(stateKey)) {
            visited.add(stateKey);
            queue.push({ pos: nextPos, o: nextO, d: nextD });
          }
        }
        
        // Try Diagonal moves (if allowed)
        if (d < maxDiagonal) {
          for (const move of diagMoves) {
            const nextPos = { x: pos.x + move.x, y: pos.y + move.y };
            const nextO = o;
            const nextD = d + 1;
            const stateKey = `${nextPos.x},${nextPos.y},${nextO},${nextD}`;
            
            if (nextPos.x >= 1 && nextPos.x <= boardSize.x && nextPos.y >= 1 && nextPos.y <= boardSize.y && !visited.has(stateKey)) {
              visited.add(stateKey);
              queue.push({ pos: nextPos, o: nextO, d: nextD });
            }
          }
        }
      }
      
      // De-duplicate final positions
      const uniqueSpaces = Array.from(new Set(validEndSpaces.map(p => `${p.x},${p.y}`)))
        .map(s => ({ x: parseInt(s.split(',')[0]), y: parseInt(s.split(',')[1]) }));
  
      return uniqueSpaces;
    }
  }