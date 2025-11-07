// server/data/gameData.ts

import {
    CardName,
    PlayerRole,
    PlayerSubRole,
    SecretIdentity,
    CommandCard,
  } from '../../src/types/game';
  import { v4 as uuid } from 'uuid';
  
  /**
   * Helper function to create a unique card instance.
   */
  const createCard = (name: CardName, effect: string): CommandCard => ({
    id: uuid(),
    name,
    effect,
  });
  
  // --- 1. Core Game Definitions ---
  
  export const SECRET_IDENTITIES: SecretIdentity[] = [
    'The Eye', 'The Hand', 'The Key', 'The Grip',
    'The Chain', 'The Bolt', 'The Hook', 'The Compass',
  ];
  
  export const PLAYER_ROLES: PlayerRole[] = [
    'True Believer', 'Heretic', 'Opportunist'
  ];
  
  // NOTE: This is now legacy. Sub-roles are defined in scenario.sub_role_definitions
  // This is just kept for reference or potential fallback
  export const SUB_ROLES: Record<PlayerRole, PlayerSubRole[]> = {
    'True Believer': ['The Guide', 'The Fixer'],
    'Heretic': ['The Instigator', 'The Waster'],
    'Opportunist': ['The Data Broker', 'The Mimic'],
  };
  
  // --- 2. Command Card Definitions (Universal) ---
  
  export const COMMAND_CARDS: Record<CardName, { effect: string }> = {
    'Move 1': { effect: 'Move 1 space.' },
    'Move 2': { effect: 'Move 2 spaces.' },
    'Move 3': { effect: 'Move 3 spaces.' },
    'Homage': { effect: 'Repeat the previously resolved action.' },
    'Hesitate': { effect: 'Next Move card is -1 value.' },
    'Foresight': { effect: 'Preemptively copy the next action.' },
    'Charge': { effect: 'Next Move card is +1 value.' },
    'Deny': { effect: 'Prevent the next action from having any effect.' },
    'Rethink': { effect: 'Cancel the previously resolved action.' },
    'Empower': { effect: 'If next is Move, increase value by +2.' },
    'Impulse': { effect: 'Move to a random adjacent space.' },
    'Degrade': { effect: 'If next is Move, decrease value by -1.' },
    'Interact': { effect: 'Interact with Object/NPC on current space.' },
    'Inhibit': { effect: 'The next Interact action will have no effect.' },
    'Buffer': { effect: 'Do Nothing.' },
    'Gamble': { effect: 'All remaining actions are now randomly assigned from each players’ hand.' },
    'Hail Mary': { effect: 'All players’ hands are now redrawn.' },
    'Reload': { effect: 'Redraw your hand and play an action at random.' },
    
    // --- FIX: Added Stockpile ---
    'Stockpile': { effect: 'Do not resolve an action this round. Next round, resolve your chosen action a second time at the end of the round.' },
    // --- END FIX ---
  };
  
  export const DECK_TEMPLATE: CardName[] = [
    'Move 1', 'Move 1', 'Move 1', 'Move 1',
    'Move 2', 'Move 2', 'Move 2',
    'Move 3', 'Move 3',
    'Hesitate', 'Hesitate', 'Charge', 'Charge', 'Empower', 'Degrade',
    'Deny', 'Deny', 'Rethink', 'Rethink', 'Homage', 'Foresight',
    'Interact', 'Interact', 'Interact', 'Inhibit',
    'Buffer', 'Buffer', 'Impulse', 'Gamble', 'Hail Mary', 'Reload',
    
    // --- FIX: Added Stockpile ---
    'Stockpile', 'Stockpile',
    // --- END FIX ---
  ];
  
  export const createNewDeck = (): CommandCard[] => {
    // Filter out any card names from the template that aren't defined in COMMAND_CARDS
    const validDeckTemplate = DECK_TEMPLATE.filter(name => COMMAND_CARDS[name]);
    
    // Warn if any cards were filtered
    if (validDeckTemplate.length !== DECK_TEMPLATE.length) {
      console.warn('GameData: Some cards in DECK_TEMPLATE are not defined in COMMAND_CARDS and were filtered out.');
    }

    const deck = validDeckTemplate.map(name =>
      createCard(name, COMMAND_CARDS[name].effect)
    );
    return deck;
  };