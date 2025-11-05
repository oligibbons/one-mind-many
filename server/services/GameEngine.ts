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
    Scenario,
    PlayerRole,
    CardName,
    Location,
    PublicPlayerState,
    GameResults, // <-- NEW IMPORT
    PlayerResult, // <-- NEW IMPORT
  } from '../../src/types/game';
  import {
    SECRET_IDENTITIES,
    PLAYER_ROLES,
    createNewDeck,
    COMMAND_CARDS,
  } from '../data/gameData';
  import { shuffle, sample, sampleSize, random, cloneDeep } from 'lodash';
  import { v4 as uuid } from 'uuid';
  
  // (Keep the existing TurnState interface)
  export interface TurnState {
    scenario: Scenario;
    state: GameState;
    privateStates: PrivatePlayerState[];
    playerStates: PublicPlayerState[];
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
      nextMoveValueModifier: number;
      nextActionProtected: boolean;
    };
    previousHarbingerPosition: BoardSpace;
  }
  
  export class GameEngine {
    // --- (setupGame function is unchanged) ---
    static setupGame(
      playerUserIds: string[],
      playerUsernames: { [userId: string]: string },
      scenario: Scenario
    ): { gameState: GameState; privatePlayerStates: PrivatePlayerState[] } {
      const gameId = uuid();
      const shuffledPlayerIds = shuffle(playerUserIds);
      const numPlayers = shuffledPlayerIds.length;
      const identities = SECRET_IDENTITIES.slice(0, numPlayers);
      const priorityTrack: PrioritySlot[] = shuffledPlayerIds.map(
        (playerId, i) => ({
          playerId: playerId,
          identity: identities[i],
        })
      );
  
      const playerRoles: Record<
        string,
        { role: any; subRole: any; goal?: any }
      > = {};
      
      const rolesToAssign = shuffle([
          ...Array(numPlayers).fill(null).map(() => sample(PLAYER_ROLES)!)
      ]);
      const subRolesToAssign = shuffle([
          ...Array(numPlayers).fill(null).map(() => sample(Object.keys(scenario.sub_role_definitions))!)
      ]);
  
      shuffledPlayerIds.forEach((playerId, i) => {
        const role = rolesToAssign[i];
        const subRole = subRolesToAssign[i];
        let goal;
        if (role === 'Opportunist' && subRole === 'The Data Broker') {
          goal = {
            type: 'Data Broker',
            locations: sample(scenario.opportunist_goals['Data Broker'])!,
            visited: [],
          };
        }
        playerRoles[playerId] = { role, subRole, goal };
      });
  
      let deck = shuffle(createNewDeck());
      const playerHands: Record<string, CommandCard[]> = {};
      shuffledPlayerIds.forEach((playerId) => {
        playerHands[playerId] = deck.splice(0, 4);
      });
  
      const startPos = scenario.locations.find(
        (l) => l.name === 'The Park in the Centre'
      )!.position;
      
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
      const objectsToPlace = sampleSize(
        Object.keys(scenario.object_effects),
        objectCount
      );
      const boardObjects: GameObject[] = objectsToPlace.map((name) => ({
        id: uuid(),
        name,
        position: getEmptySpace(),
        interacted: false,
      }));
  
      const boardNPCs: GameNPC[] = [];
      const npcPool = Object.keys(scenario.npc_effects);
  
      npcPool.forEach((name) => {
        const locName = scenario.npc_effects[name].static_location;
        if (locName) {
          const loc = scenario.locations.find((l) => l.name === locName)!;
          if (loc) {
            boardNPCs.push({
              id: uuid(),
              name,
              position: loc.position,
              interacted: false,
            });
          }
        }
      });
  
      const randomNpcPool = npcPool.filter(
        (name) => !scenario.npc_effects[name].static_location
      );
      const npcsToPlace = sampleSize(randomNpcPool, 3);
      npcsToPlace.forEach((name) => {
        boardNPCs.push({
          id: uuid(),
          name,
          position: getEmptySpace(),
          interacted: false,
        });
      });
  
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
          is_disconnected: false,
        });
      });
  
      const gameState: GameState = {
        id: gameId,
        status: 'active',
        currentRound: 1,
        scenario: {
          id: scenario.id,
          name: scenario.name,
          locations: scenario.locations,
          boardSize: { x: scenario.board_size_x, y: scenario.board_size_y },
        },
        harbingerPosition: startPos,
        stalkerPosition: null,
        boardModifiers: { impassable: [], swapped: [] },
        priorityTrack: priorityTrack,
        activeComplications: [],
        boardObjects: boardObjects,
        boardNPCs: boardNPCs,
        players: publicPlayerStates,
        gameLog: [`Game started with ${numPlayers} players.`],
        hostId: playerUserIds[0], // <-- Assign hostId
      };
      return { gameState, privatePlayerStates };
    }
  
    // --- (startRoundResolution is unchanged) ---
    static startRoundResolution(
      currentState: GameState,
      allPlayerStates: PrivatePlayerState[],
      allPublicStates: PublicPlayerState[],
      submittedActions: SubmittedAction[],
      scenario: Scenario
    ): TurnState {
      const sortedActions = submittedActions.sort((a, b) => {
          const priorityA = currentState.priorityTrack.findIndex(
            (p) => p.playerId === a.playerId
          );
          const priorityB = currentState.priorityTrack.findIndex(
            (p) => p.playerId === b.playerId
          );
          return priorityA - priorityB;
        });
    
        return {
          scenario: scenario,
          state: cloneDeep(currentState),
          privateStates: cloneDeep(allPlayerStates),
          playerStates: cloneDeep(allPublicStates),
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
            nextMoveValueModifier: 0,
            nextActionProtected: false,
          },
          previousHarbingerPosition: cloneDeep(currentState.harbingerPosition),
        };
    }
  
    // --- (processSingleAction is unchanged) ---
    static processSingleAction(
      turnState: TurnState,
      action: SubmittedAction
    ): { nextTurnState: TurnState; pause: any } {
      let {
          scenario,
          state,
          privateStates,
          playerStates,
          actionQueue,
          processedActions,
          modifiers,
        } = turnState;
        
        const actingPlayerPrivate = privateStates.find(
          (p) => p.userId === action.playerId
        )!;
        const actingPlayerPublic = playerStates.find(
          (p) => p.userId === action.playerId
        )!;
        const actingToken = state.priorityTrack.find(
          (p) => p.playerId === action.playerId
        )!.identity;
    
        if (actingPlayerPublic.is_disconnected) {
            state.gameLog.push(`Priority ${actingToken} (${actingPlayerPrivate.username}) is disconnected. Playing 'Buffer'.`);
            action.card = { id: uuid(), name: 'Buffer', effect: 'Do Nothing.' };
        } else {
            state.gameLog.push(
              `Priority ${actingToken} (${actingPlayerPrivate.username}) plays ${action.card.name}.`
            );
        }
    
        for (const comp of state.activeComplications) {
            const compData = scenario.complication_effects[comp.name];
            if (compData.trigger?.type === 'ACTION_PLAYED') {
                const cardMatches = compData.trigger.cards ? compData.trigger.cards.includes(action.card.name) : true;
                if (cardMatches) {
                    const conditionMet = this.checkCondition(turnState, compData.trigger.condition);
                    if (conditionMet) {
                        state.gameLog.push(`Complication ${comp.name} triggers!`);
                        this.applyEffect(turnState, actingPlayerPrivate, compData.effect);
                    }
                }
            }
        }
        
        if (state.stalkerPosition && 
            this.isPosEqual(state.harbingerPosition, state.stalkerPosition)) {
            if (action.card.name.startsWith('Move')) {
                state.gameLog.push('The Intrepid Stalker blocks all movement!');
                processedActions.push(action);
                return { nextTurnState: turnState, pause: null };
            }
        }
    
        if (modifiers.foresight && !modifiers.nextActionCopied) {
          state.gameLog.push(
            `${modifiers.foresight.playerId} uses Foresight to copy ${action.card.name}.`
          );
          actionQueue.unshift({ ...modifiers.foresight, card: action.card });
          modifiers.nextActionCopied = true;
          
          const foresightPlayer = privateStates.find(
            (p) => p.userId === modifiers.foresight!.playerId
          )!;
          const mimicDef = scenario.sub_role_definitions['The Mimic'];
          if (
            foresightPlayer.subRole === 'The Mimic' &&
            mimicDef.trigger.event === 'copy_true_believer' &&
            actingPlayerPrivate.role === 'True Believer'
          ) {
            foresightPlayer.vp += mimicDef.vp;
          }
        }
        
        if (modifiers.nextActionProtected && (action.card.name === 'Deny' || action.card.name === 'Rethink')) {
            state.gameLog.push(`Action is protected! It cannot be Denied or Rethought.`);
            modifiers.nextActionProtected = false;
        } else if (modifiers.nextActionDenied) {
          state.gameLog.push(`Action is Denied!`);
          modifiers.nextActionDenied = false;
          processedActions.push(action);
          const instigatorDef = scenario.sub_role_definitions['The Instigator'];
          if (actingPlayerPrivate.subRole === 'The Instigator' && instigatorDef.trigger.cards.includes(action.card.name))
            actingPlayerPrivate.vp += instigatorDef.vp;
          return { nextTurnState: turnState, pause: null };
        }
        
        if (modifiers.nextInteractInhibited && action.card.name === 'Interact') {
          state.gameLog.push(`Action is Inhibited!`);
          modifiers.nextInteractInhibited = false;
          processedActions.push(action);
          return { nextTurnState: turnState, pause: null };
        }
    
        switch (action.card.name) {
          case 'Move 1':
          case 'Move 2':
          case 'Move 3':
            if (modifiers.skipNextMove) {
              state.gameLog.push(`Movement skipped.`);
              modifiers.skipNextMove = false;
              break;
            }
            const baseMove = parseInt(action.card.name.split(' ')[1]);
            const totalMove = Math.max(0, baseMove + modifiers.moveValue + modifiers.nextMoveValueModifier);
            modifiers.moveValue = 0; 
            modifiers.nextMoveValueModifier = 0;
    
            if (totalMove > 0) {
              const validMoves = this.calculateValidMoves(
                state.harbingerPosition,
                totalMove,
                state.scenario.boardSize,
                state.boardModifiers
              );
              if (validMoves.length > 0) {
                modifiers.awaitingMoveFromPlayerId = action.playerId;
                modifiers.pendingMoveValue = totalMove;
                state.gameLog.push(
                  `Awaiting move of ${totalMove} from ${actingPlayerPrivate.username}...`
                );
                const pauseData = {
                  playerId: action.playerId,
                  actingUsername: actingPlayerPrivate.username,
                  validMoves: validMoves,
                };
                return { nextTurnState: turnState, pause: pauseData }; // PAUSE
              } else {
                state.gameLog.push(
                  `Harbinger had ${totalMove} MP but nowhere to move.`
                );
              }
            }
            break;
          case 'Impulse':
            const adj = this.getAdjacentSpaces(
              state.harbingerPosition,
              state.scenario.boardSize,
              state.boardModifiers
            );
            if (adj.length > 0) {
              state.harbingerPosition = sample(adj)!;
              state.gameLog.push(
                `Harbinger moves by Impulse to ${state.harbingerPosition.x}, ${state.harbingerPosition.y}`
              );
            }
            break;
          case 'Hesitate': modifiers.moveValue -= 1; break;
          case 'Charge': modifiers.moveValue += 1; break;
          case 'Empower': modifiers.moveValue += 2; break;
          case 'Degrade': modifiers.moveValue -= 1; break;
          case 'Deny':
            modifiers.nextActionDenied = true;
            if (actingPlayerPrivate.subRole === 'The Instigator')
              actingPlayerPrivate.vp += scenario.sub_role_definitions['The Instigator'].vp;
            break;
          case 'Rethink':
            const lastAction = processedActions.pop();
            if (lastAction) {
              state.gameLog.push(`Rethink cancels ${lastAction.card.name}.`);
            }
            if (actingPlayerPrivate.subRole === 'The Instigator')
              actingPlayerPrivate.vp += scenario.sub_role_definitions['The Instigator'].vp;
            break;
          case 'Homage':
            const lastCard =
              processedActions[processedActions.length - 1]?.card;
            if (lastCard) {
              state.gameLog.push(`Homage copies ${lastCard.name}.`);
              actionQueue.unshift({ ...action, card: lastCard });
              if (actingPlayerPrivate.subRole === 'The Mimic') {
                const originalPlayerId =
                  processedActions[processedActions.length - 1].playerId;
                const originalPlayerRole = privateStates.find(
                  (p) => p.userId === originalPlayerId
                )!.role;
                if (originalPlayerRole === 'True Believer') {
                  actingPlayerPrivate.vp +=
                    scenario.sub_role_definitions['The Mimic'].vp;
                }
              }
            }
            break;
          case 'Foresight':
            modifiers.foresight = action;
            modifiers.nextActionCopied = false;
            break;
          case 'Inhibit': modifiers.nextInteractInhibited = true; break;
          case 'Interact':
            this.handleInteraction(turnState, action);
            break;
          case 'Gamble':
            state.gameLog.push(
              `GAMBLE! All remaining actions are randomized!`
            );
            const remainingPlayers = actionQueue.map((a) => a.playerId);
            const remainingHands = privateStates
              .filter((p) => remainingPlayers.includes(p.userId))
              .flatMap((p) => p.hand);
            let newQueue: SubmittedAction[] = [];
            for (const act of actionQueue) {
              const randomCard = sample(remainingHands)!;
              if (randomCard) {
                remainingHands.splice(remainingHands.indexOf(randomCard), 1);
                newQueue.push({ ...act, card: randomCard });
              }
            }
            turnState.actionQueue = newQueue; 
            if (actingPlayerPrivate.subRole === 'The Instigator')
              actingPlayerPrivate.vp +=
                scenario.sub_role_definitions['The Instigator'].vp;
            break;
          case 'Hail Mary':
            state.gameLog.push(`HAIL MARY! All hands are redrawn!`);
            let newDeck = shuffle(createNewDeck());
            privateStates.forEach((p) => {
              p.hand = newDeck.splice(0, 4);
            });
            break;
          case 'Reload':
            state.gameLog.push(`${actingPlayerPrivate.username} uses Reload!`);
            let deck = shuffle(createNewDeck());
            actingPlayerPrivate.hand = deck.splice(0, 4);
            const randomCard = sample(actingPlayerPrivate.hand)!;
            actionQueue.unshift({ ...action, card: randomCard });
            break;
          case 'Buffer':
            state.gameLog.push(`...does nothing.`);
            break;
        }
    
        processedActions.push(action);
        return { nextTurnState: turnState, pause: null };
    }
  
    // --- (processSubmittedMove is unchanged) ---
    static processSubmittedMove(
      turnState: TurnState,
      position: BoardSpace
    ): { nextTurnState: TurnState } {
      const { state, modifiers } = turnState;
        state.harbingerPosition = position;
        state.gameLog.push(
          `Harbinger moves to ${position.x}, ${position.y}`
        );
        modifiers.awaitingMoveFromPlayerId = null;
        modifiers.pendingMoveValue = 0;
        return { nextTurnState: turnState };
    }
  
    // --- (handleInteraction is unchanged) ---
    static handleInteraction(turnState: TurnState, action: SubmittedAction) {
      const { scenario, state } = turnState;
        const actingPlayer = turnState.privateStates.find(
          (p) => p.userId === action.playerId
        )!;
        const posKey = `${state.harbingerPosition.x},${state.harbingerPosition.y}`;
    
        const npc = state.boardNPCs.find(
          (n) => `${n.position.x},${n.position.y}` === posKey
        );
        if (npc && !npc.interacted) {
          state.gameLog.push(`Interacting with NPC: ${npc.name}`);
          npc.interacted = true;
          const data = scenario.npc_effects[npc.name];
          const outcome = Math.random() < 0.5 ? 'positive' : 'negative';
          const effect = data.effects[outcome];
          
          state.gameLog.push(`Outcome: ${outcome}! (${effect.description})`);
          this.applyEffect(turnState, actingPlayer, effect);
          return;
        }
    
        const obj = state.boardObjects.find(
          (o) => `${o.position.x},${o.position.y}` === posKey
        );
        if (obj) {
          state.gameLog.push(`Interacting with Object: ${obj.name}`);
          state.boardObjects = state.boardObjects.filter(
            (o) => o.id !== obj.id
          );
          
          const data = scenario.object_effects[obj.name];
          const effect = data.effects[Math.floor(Math.random() * data.effects.length)];
    
          state.gameLog.push(`Effect: ${effect.description}`);
          this.applyEffect(turnState, actingPlayer, effect);
          return;
        }
        state.gameLog.push(`Interacted with... nothing.`);
    }
  
    // --- (applyEffect is unchanged) ---
    static applyEffect(turnState: TurnState, actingPlayer: PrivatePlayerState, effect: any) {
      const { state, privateStates, modifiers, actionQueue, scenario } = turnState;
    
        switch (effect.type) {
          case 'ADD_ACTION':
            const cardTemplate = COMMAND_CARDS[effect.cardName as CardName];
            actionQueue.unshift({
              playerId: actingPlayer.userId,
              card: { id: uuid(), name: effect.cardName, effect: cardTemplate.effect },
              priority: 0,
            });
            break;
          
          case 'MODIFY_TURN':
            if (effect.skipNextMove) modifiers.skipNextMove = true;
            if (effect.nextMoveValueModifier) modifiers.nextMoveValueModifier += effect.nextMoveValueModifier;
            if (effect.nextActionProtected) modifiers.nextActionProtected = true;
            if (effect.moveValue) {
                let amount = 0;
                if(typeof effect.moveValue === 'number') {
                    amount = effect.moveValue;
                } else if (effect.moveValue === 'active_complications') {
                    amount = state.activeComplications.length;
                }
                modifiers.moveValue += amount;
            }
            break;
    
          case 'MOVE_TOWARDS':
            const loc = scenario.locations.find(l => l.name === effect.target_location);
            if (loc) {
                for(let i=0; i < (effect.distance || 1); i++) {
                    state.harbingerPosition = this.moveTowards(state.harbingerPosition, loc.position, state.scenario.boardSize, state.boardModifiers);
                }
            }
            break;
            
          case 'WARP':
            if (effect.target === 'random_empty') {
                state.harbingerPosition = this.getEmptySpace(state, scenario);
                state.gameLog.push(`Warped to ${state.harbingerPosition.x}, ${state.harbingerPosition.y}!`);
            }
            break;
            
          case 'REMOVE_COMPLICATION':
            if (effect.target === 'last') {
                const lastComp = state.activeComplications.pop();
                if (lastComp) {
                    state.gameLog.push(`Removed Complication: ${lastComp.name}`);
                    const fixerDef = scenario.sub_role_definitions['The Fixer'];
                    privateStates.forEach((p) => {
                        if (p.subRole === 'The Fixer') p.vp += fixerDef.vp;
                    });
                }
            }
            break;
            
          case 'CONDITIONAL_VP':
            for (const cond of effect.conditions) {
                if (cond.if_role === actingPlayer.role) {
                    if (cond.target_role) {
                        privateStates.filter(p => p.role === cond.target_role).forEach(p => p.vp += cond.amount);
                    }
                    if (cond.target_self) {
                        actingPlayer.vp += cond.target_self;
                    }
                    if (cond.target_others) {
                        privateStates.filter(p => p.userId !== actingPlayer.userId).forEach(p => p.vp += cond.target_others);
                    }
                }
            }
            break;
            
          case 'DRAW_CARD':
            if (effect.target === 'self') {
                for(let i=0; i < (effect.amount || 1); i++) {
                    const newCard = sample(createNewDeck());
                    if (newCard) actingPlayer.hand.push(newCard);
                }
            }
            break;
            
          case 'DISCARD_CARD':
            if (effect.target === 'self' && effect.selection === 'random') {
                for(let i=0; i < (effect.amount || 1); i++) {
                    const cardToRemove = sample(actingPlayer.hand);
                    if(cardToRemove) {
                        actingPlayer.hand = actingPlayer.hand.filter(c => c.id !== cardToRemove.id);
                        state.gameLog.push(`${actingPlayer.username} discarded ${cardToRemove.name}.`);
                    }
                }
            }
            break;
            
          case 'EMIT_EVENT':
            state.gameLog.push(`(Event for ${actingPlayer.username}: ${effect.eventName})`);
            break;
            
          case 'MODIFY_VP':
            if (effect.target === 'role') {
                privateStates.filter(p => p.role === effect.role).forEach(p => p.vp += effect.amount);
            }
            break;
    
          case 'SPAWN_STALKER':
            state.stalkerPosition = cloneDeep(turnState.previousHarbingerPosition);
            state.gameLog.push(`An Intrepid Stalker appears at ${state.stalkerPosition.x}, ${state.stalkerPosition.y}!`);
            break;
        }
    }
      
    // --- (checkCondition is unchanged) ---
    static checkCondition(turnState: TurnState, condition: any): boolean {
      if (!condition) return true;
          
      const { state, previousHarbingerPosition } = turnState;
      switch (condition.type) {
          case 'IS_NEAR':
              return this.isNear(state.harbingerPosition, condition.location, condition.distance, state.scenario.locations);
          case 'IS_ON_LOCATION':
              const loc = state.scenario.locations.find(l => l.name === condition.location);
              if (!loc) return false;
              return this.isPosEqual(state.harbingerPosition, loc.position);
          case 'NO_MOVE':
              return this.isPosEqual(state.harbingerPosition, previousHarbingerPosition);
          default:
              return false;
      }
    }
  
    // --- (applyEndOfRoundEffects is unchanged) ---
    static applyEndOfRoundEffects(
      turnState: TurnState
    ): { 
      nextState: GameState; 
      nextPrivateStates: PrivatePlayerState[];
      gameResults: GameResults | null; // <-- MODIFIED: Return results if game ended
    } {
      let { scenario, state, privateStates, previousHarbingerPosition } =
        turnState;
  
      if (state.stalkerPosition) {
          state.stalkerPosition = cloneDeep(previousHarbingerPosition);
          state.gameLog.push(`The Stalker moves to ${state.stalkerPosition.x}, ${state.stalkerPosition.y}...`);
      }
  
      privateStates.forEach((p) => {
        const subRoleData = scenario.sub_role_definitions[p.subRole];
        if (!subRoleData) return;
  
        if (subRoleData.trigger?.type === 'END_OF_ROUND') {
           const conditionMet = this.checkCondition(turnState, subRoleData.trigger.condition);
           if(conditionMet) {
               p.vp += subRoleData.vp;
               state.gameLog.push(`${p.username} gains ${subRoleData.vp} VP (${p.subRole}).`);
           }
        }
      });
  
      privateStates.forEach((p) => {
        if (p.personalGoal?.type === 'Data Broker') {
          const currentLoc = scenario.locations.find(
            (l) =>
              l.position.x === state.harbingerPosition.x &&
              l.position.y === state.harbingerPosition.y
          );
          if (
            currentLoc &&
            p.personalGoal.locations.includes(currentLoc.name) &&
            !p.personalGoal.visited.includes(currentLoc.name)
          ) {
            p.personalGoal.visited.push(currentLoc.name);
            state.gameLog.push(
              `${p.username} (Data Broker) visited ${currentLoc.name}!`
            );
          }
        }
      });
  
      state.activeComplications = state.activeComplications.filter((c) => {
        if (c.duration > 0) c.duration -= 1;
        return c.duration !== 0;
      });
      
      if (Math.random() < 0.2 && state.activeComplications.length < 3) {
        const newCompName = sample(
          Object.keys(scenario.complication_effects)
        )!;
        const compData = scenario.complication_effects[newCompName];
        
        state.activeComplications.push({
          id: uuid(),
          name: newCompName,
          effect: compData.description,
          duration: compData.duration,
        });
        state.gameLog.push(`New Complication added: ${newCompName}!`);
        
        if (compData.duration === 0 || compData.trigger?.type === 'ON_ADD') {
            const pseudoActor = privateStates[0]; 
            this.applyEffect(turnState, pseudoActor, compData.effect);
        }
      }
  
      // --- MODIFIED: Check Win Conditions ---
      const { nextState, gameResults } = this.checkWinConditions(
        state,
        privateStates,
        turnState.processedActions,
        scenario
      );
      state = nextState; // Get updated state (might be 'finished')
  
      if (state.status === 'active') {
        // Only continue if game is not over
        const firstPriority = state.priorityTrack.shift()!;
        state.priorityTrack.push(firstPriority);
        state.gameLog.push(
          `Priority Track rotates. ${firstPriority.identity} moves to last.`
        );
        state.currentRound += 1;
  
        if ((state.currentRound - 1) % 3 === 0) {
          state.gameLog.push(`Refilling all player hands.`);
          let deck = shuffle(createNewDeck());
          privateStates.forEach((p) => {
            p.hand = deck.splice(0, 4);
          });
        }
        
        state.players.forEach((p) => (p.submittedAction = false));
      }
      
      return { nextState: state, nextPrivateStates: privateStates, gameResults };
    }
  
    // --- (checkWinConditions is unchanged) ---
    static checkWinConditions(
      currentState: GameState,
      privateStates: PrivatePlayerState[],
      processedActions: SubmittedAction[],
      scenario: Scenario
    ): { nextState: GameState, gameResults: GameResults | null } { // <-- MODIFIED
      if (currentState.status === 'finished') return { nextState: currentState, gameResults: null };
  
      const posKey = `${currentState.harbingerPosition.x},${currentState.harbingerPosition.y}`;
      let winner: PlayerRole | 'Opportunist' | null = null;
      let endCondition: string | null = null;
      let opportunistWinnerId: string | undefined = undefined;
  
      const doomsday = scenario.doomsday_condition;
      const doomsdayLoc = scenario.locations.find(
        (l) => l.name === doomsday.lose_location
      )!;
      if (this.isPosEqual(currentState.harbingerPosition, doomsdayLoc.position)) {
        endCondition = doomsday.trigger_message;
        winner = doomsday.winner;
      }
  
      const prophecy = scenario.main_prophecy;
      const prophecyLoc = scenario.locations.find(
        (l) => l.name === prophecy.win_location
      )!;
      const lastAction = processedActions[processedActions.length - 1];
      if (
        !winner &&
        this.isPosEqual(currentState.harbingerPosition, prophecyLoc.position) &&
        lastAction?.card.name === prophecy.win_action
      ) {
        endCondition = prophecy.trigger_message;
        winner = prophecy.winner;
      }
  
      if (!winner) {
        for (const p of privateStates) {
          if (p.personalGoal?.type === 'Data Broker') {
            if (
              p.personalGoal.visited.length ===
              p.personalGoal.locations.length
            ) {
              endCondition = `${p.username} completed their personal goal!`;
              winner = 'Opportunist';
              opportunistWinnerId = p.userId; 
              break;
            }
          }
        }
      }
  
      const failCond = scenario.global_fail_condition;
      const globalFailLoc = scenario.locations.find(
        (l) => l.name === failCond.lose_location
      )!;
      if (
        !winner &&
        currentState.currentRound >= failCond.max_round &&
        this.isPosEqual(currentState.harbingerPosition, globalFailLoc.position)
      ) {
        endCondition = failCond.trigger_message;
        winner = failCond.winner;
      }
      
      if (winner && endCondition) {
        const { nextState, gameResults } = this.endGame(
          currentState, 
          privateStates, 
          winner, 
          endCondition, 
          scenario, 
          opportunistWinnerId
        );
        return { nextState, gameResults };
      }
  
      return { nextState: currentState, gameResults: null };
    }
  
    // --- *** UPDATED FUNCTION: endGame *** ---
    static endGame(
      state: GameState,
      privateStates: PrivatePlayerState[],
      winningRole: PlayerRole | 'Opportunist',
      endCondition: string,
      scenario: Scenario,
      opportunistWinnerId?: string
    ): { nextState: GameState; gameResults: GameResults } { // <-- MODIFIED
      state.status = 'finished';
      state.gameLog.push('--- GAME OVER ---');
      state.gameLog.push(endCondition);
  
      const prophecyVP = scenario.main_prophecy.vp || 20;
      const doomsdayVP = scenario.doomsday_condition.vp || 20;
      const opportunistVP = 30; // GDD: +30 VP
  
      const playerResults: PlayerResult[] = [];
  
      // First, calculate all final VP
      privateStates.forEach(p => {
        let mainGoalVp = 0;
        let subRoleVp = p.vp; // Sub-roles score VP during the game
        
        // Check Opportunist goals (they score regardless of main outcome)
        if (p.role === 'Opportunist' && p.personalGoal?.type === 'Data Broker') {
           if (p.personalGoal.visited.length === p.personalGoal.locations.length) {
              state.gameLog.push(`${p.username} (Opportunist) completed their goal! +${opportunistVP} VP`);
              mainGoalVp = opportunistVP; 
           }
        }
        
        // Award main goal VP
        if (p.role === winningRole && winningRole === 'True Believer') {
          state.gameLog.push(`${p.username} (${p.role}) was on the winning team! +${prophecyVP} VP`);
          mainGoalVp = prophecyVP;
        } else if (p.role === winningRole && winningRole === 'Heretic') {
          state.gameLog.push(`${p.username} (${p.role}) was on the winning team! +${doomsdayVP} VP`);
          mainGoalVp = doomsdayVP;
        }
  
        const totalVp = mainGoalVp + subRoleVp;
        
        // Sync final VP to private AND public states
        p.vp = totalVp;
        const publicPlayer = state.players.find((pp) => pp.userId === p.userId)!;
        publicPlayer.vp = totalVp;
        
        // Add to results object
        playerResults.push({
          userId: p.userId,
          username: p.username,
          secretIdentity: p.secretIdentity,
          role: p.role,
          subRole: p.subRole,
          mainGoalVp: mainGoalVp,
          subRoleVp: subRoleVp,
          totalVp: totalVp,
          personalGoal: p.personalGoal ? {
            description: `Visit: ${p.personalGoal.locations.join(', ')}`,
            completed: p.personalGoal.visited.length === p.personalGoal.locations.length,
          } : undefined,
          rank: 0, // Will be calculated next
        });
      });
  
      // Sort by VP to create leaderboard and assign ranks
      const leaderboard = playerResults.sort((a, b) => b.totalVp - a.totalVp);
      leaderboard.forEach((p, index) => {
        p.rank = index + 1;
        // Handle ties (e.g., if VP is same as previous, rank is same)
        if (index > 0 && p.totalVp === leaderboard[index - 1].totalVp) {
          p.rank = leaderboard[index - 1].rank;
        }
      });
  
      const winner = leaderboard[0];
      state.gameLog.push(`The individual winner is ${winner.username} with ${winner.totalVp} VP!`);
      
      // Create the final GameResults object
      const gameResults: GameResults = {
        summary: {
          winningRole: winningRole,
          endCondition: endCondition,
        },
        leaderboard: leaderboard,
      };
  
      return { nextState: state, gameResults };
    }
  
    // --- (All Utility Functions are unchanged) ---
    static isPosEqual(a: BoardSpace | null, b: BoardSpace | null): boolean {
      if (!a || !b) return false;
      return a.x === b.x && a.y === b.y;
    }
    static isPosInArray(arr: BoardSpace[], pos: BoardSpace): boolean {
      return arr.some(p => this.isPosEqual(p, pos));
    }
    static isOnBoard(pos: BoardSpace, size: BoardSpace): boolean {
      return pos.x >= 1 && pos.x <= size.x && pos.y >= 1 && pos.y <= size.y;
    }
    static getAdjacentSpaces(
      pos: BoardSpace,
      size: BoardSpace,
      modifiers: GameState['boardModifiers']
    ): BoardSpace[] {
      const spaces: BoardSpace[] = [];
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          if (x === 0 && y === 0) continue;
          const newPos = { x: pos.x + x, y: pos.y + y };
          if (this.isOnBoard(newPos, size) && !this.isPosInArray(modifiers.impassable, newPos)) {
            spaces.push(newPos);
          }
        }
      }
      return spaces;
    }
    static getEmptySpace(state: GameState, scenario: Scenario): BoardSpace {
      const occupiedSpaces = new Set(
        scenario.locations.map((loc) => `${loc.position.x},${loc.position.y}`)
      );
      occupiedSpaces.add(
        `${state.harbingerPosition.x},${state.harbingerPosition.y}`
      );
      if(state.stalkerPosition) {
          occupiedSpaces.add(`${state.stalkerPosition.x},${state.stalkerPosition.y}`);
      }
      state.boardObjects.forEach((o) =>
        occupiedSpaces.add(`${o.position.x},${o.position.y}`)
      );
      state.boardNPCs.forEach((n) =>
        occupiedSpaces.add(`${n.position.x},${n.position.y}`)
      );
      state.boardModifiers.impassable.forEach((p) =>
          occupiedSpaces.add(`${p.x},${p.y}`)
      );
  
      while (true) {
        const x = random(1, scenario.board_size_x);
        const y = random(1, scenario.board_size_y);
        const key = `${x},${y}`;
        if (!occupiedSpaces.has(key)) {
          return { x, y };
        }
      }
    }
    static moveTowards(
      start: BoardSpace,
      end: BoardSpace,
      size: BoardSpace,
      modifiers: GameState['boardModifiers']
    ): BoardSpace {
      const dx = Math.sign(end.x - start.x);
      const dy = Math.sign(end.y - start.y);
      const nextPos = { x: start.x + dx, y: start.y + dy };
      if (this.isOnBoard(nextPos, size) && !this.isPosInArray(modifiers.impassable, nextPos)) {
          return nextPos;
      }
      return start;
    }
    static isNear(
      pos: BoardSpace,
      locName: string,
      distance: number,
      locations: Location[]
    ): boolean {
      const loc = locations.find((l) => l.name === locName);
      if (!loc) return false;
      const dist = Math.max(
        Math.abs(pos.x - loc.position.x),
        Math.abs(pos.y - loc.position.y)
      );
      return dist <= distance;
    }
    static calculateValidMoves(
      startPos: BoardSpace,
      mp: number,
      boardSize: BoardSpace,
      modifiers: GameState['boardModifiers']
    ): BoardSpace[] {
      let minOrthogonal, maxDiagonal;
      switch (mp) {
        case 1: minOrthogonal = 1; maxDiagonal = 0; break;
        case 2: minOrthogonal = 1; maxDiagonal = 1; break;
        case 3: minOrthogonal = 2; maxDiagonal = 1; break;
        case 4: minOrthogonal = 2; maxDiagonal = 2; break;
        case 5: minOrthogonal = 3; maxDiagonal = 2; break;
        default:
          minOrthogonal = Math.ceil(mp / 2);
          maxDiagonal = Math.floor(mp / 2);
      }
      const validEndSpaces: BoardSpace[] = [];
      const queue: [{ pos: BoardSpace; o: number; d: number }] = [
        { pos: startPos, o: 0, d: 0 },
      ];
      const visited = new Set<string>();
      visited.add(`${startPos.x},${startPos.y},0,0`);
      const orthMoves = [
        { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 },
      ];
      const diagMoves = [
        { x: 1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: -1, y: -1 },
      ];
      
      const isValidSpace = (pos: BoardSpace) => {
          return this.isOnBoard(pos, boardSize) && !this.isPosInArray(modifiers.impassable, pos);
      }
  
      while (queue.length > 0) {
        const { pos, o, d } = queue.shift()!;
        const totalSteps = o + d;
        
        if (totalSteps > 0 && totalSteps <= mp && o >= Math.ceil(totalSteps / 2) && d <= Math.floor(totalSteps / 2)) {
           validEndSpaces.push(pos);
        }
        
        if (totalSteps === mp) continue;
  
        for (const move of orthMoves) {
          const nextPos = { x: pos.x + move.x, y: pos.y + move.y };
          const nextO = o + 1;
          const nextD = d;
          const stateKey = `${nextPos.x},${nextPos.y},${nextO},${nextD}`;
          if (
            isValidSpace(nextPos) &&
            !visited.has(stateKey) &&
            nextO + nextD <= mp
          ) {
            visited.add(stateKey);
            queue.push({ pos: nextPos, o: nextO, d: nextD });
          }
        }
        
        if (d < maxDiagonal) {
          for (const move of diagMoves) {
            const nextPos = { x: pos.x + move.x, y: pos.y + move.y };
            const nextO = o;
            const nextD = d + 1;
            const stateKey = `${nextPos.x},${nextPos.y},${nextO},${nextD}`;
            if (
              isValidSpace(nextPos) &&
              !visited.has(stateKey) &&
              nextO + nextD <= mp
            ) {
              visited.add(stateKey);
              queue.push({ pos: nextPos, o: nextO, d: nextD });
            }
          }
        }
      }
      const uniqueSpaces = Array.from(
        new Set(validEndSpaces.map((p) => `${p.x},${p.y}`))
      ).map((s) => ({
        x: parseInt(s.split(',')[0]),
        y: parseInt(s.split(',')[1]),
      }));
      return uniqueSpaces;
    }
  }