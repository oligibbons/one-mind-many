// server/data/gameData.ts

import {
    CardName,
    PlayerRole,
    PlayerSubRole,
    SecretIdentity,
  } from "../../src/types/game";
  import { v4 as uuid } from "uuid";
  
  /**
   * Helper function to create a unique card instance.
   */
  const createCard = (name: CardName, effect: string) => ({
    id: uuid(),
    name,
    effect,
  });
  
  // --- Core Game Definitions ---
  
  export const SECRET_IDENTITIES: SecretIdentity[] = [
    "The Eye", "The Hand", "The Key", "The Grip",
    "The Chain", "The Bolt", "The Hook", "The Compass",
  ];
  
  export const PLAYER_ROLES: PlayerRole[] = [
    "True Believer", "Heretic", "Opportunist"
  ];
  
  export const SUB_ROLES: Record<PlayerRole, PlayerSubRole[]> = {
    "True Believer": ["The Guide", "The Fixer"],
    "Heretic": ["The Instigator", "The Waster"],
    "Opportunist": ["The Data Broker", "The Mimic"],
  };
  
  // --- Command Card Definitions ---
  
  export const COMMAND_CARDS: Record<CardName, { effect: string }> = {
    "Move 1": { effect: "Move 1 space." },
    "Move 2": { effect: "Move 2 spaces." },
    "Move 3": { effect: "Move 3 spaces." },
    "Homage": { effect: "Repeat the previously resolved action." },
    "Hesitate": { effect: "Next Move card is -1 value." },
    "Foresight": { effect: "Preemptively copy the next action." },
    "Charge": { effect: "Next Move card is +1 value." },
    "Deny": { effect: "Prevent the next action from having any effect." },
    "Rethink": { effect: "Cancel the previously resolved action." },
    "Empower": { effect: "If next is Move, increase value by +2." },
    "Impulse": { effect: "Move to a random adjacent space." },
    "Degrade": { effect: "If next is Move, decrease value by -1." },
    "Interact": { effect: "Interact with Object/NPC on current space." },
    "Inhibit": { effect: "The next Interact action will have no effect." },
    "Buffer": { effect: "Do Nothing." },
    "Gamble": { effect: "All remaining actions are now randomly assigned from each players’ hand." },
    "Hail Mary": { effect: "All players’ hands are now redrawn." },
    "Reload": { effect: "Redraw your hand and play an action at random." },
  };
  
  /**
   * Defines the master deck. We can adjust the count of each card for balance.
   */
  export const DECK_TEMPLATE: CardName[] = [
    // More movement
    "Move 1", "Move 1", "Move 1", "Move 1",
    "Move 2", "Move 2", "Move 2",
    "Move 3", "Move 3",
    // Modifiers
    "Hesitate", "Hesitate",
    "Charge", "Charge",
    "Empower",
    "Degrade",
    // Control/Chaos
    "Deny", "Deny",
    "Rethink", "Rethink",
    "Homage",
    "Foresight",
    // Interaction
    "Interact", "Interact", "Interact",
    "Inhibit",
    // Other
    "Buffer", "Buffer",
    "Impulse",
    "Gamble",
    "Hail Mary",
    "Reload",
  ];
  
  /**
   * Creates a new, shuffled deck instance for a game.
   */
  export const createNewDeck = () => {
    const deck = DECK_TEMPLATE.map(name =>
      createCard(name, COMMAND_CARDS[name].effect)
    );
    // This will be shuffled before dealing
    return deck;
  };
  
  // --- Scenario 1: "The Prophecy of the Wanting Beggar" ---
  // We can add more scenarios here later
  
  export const SCENARIO_DATA = {
    "wanting-beggar": {
      name: "The Prophecy of the Wanting Beggar",
      boardSize: { x: 12, y: 12 },
      startPosition: { x: 5, y: 5 }, // "The Park in the Centre"
      locations: [
        { name: "Collapsital One Bank", position: { x: 1, y: 1 } },
        { name: "Deja Brew Coffee Shop", position: { x: 1, y: 6 } },
        { name: "Bazaar of Gross-eries", position: { x: 1, y: 11 } },
        { name: "Squalid Bench", position: { x: 6, y: 11 } },
        { name: "The Park in the Centre", position: { x: 5, y: 5 } },
        { name: "Boutique of Useless Trinkets", position: { x: 11, y: 1 } },
        { name: "Statue of Despairing Monks", position: { x: 11, y: 11 } },
      ],
      mainProphecy: {
        start_loc: "The Park in the Centre",
        end_loc: "Squalid Bench",
        action: "Interact",
      },
      doomsdayCondition: {
        location: "Collapsital One Bank",
      },
      globalFailCondition: {
        location: "Statue of Despairing Monks",
        maxRound: 10,
      },
      // Pools of available content for this scenario
      complicationPool: [
        "Protect and Serve", "Gaggle of Feral Youths", "Worm Hole",
        "Stink Hole", "Carbon Copy", "Paradigm Shift", "Intrepid Stalker",
        "Schmog", "Pigeon Barrage", "Unsolicited Advice",
      ],
      objectPool: [
        "The Rubber Duck", "A Single Sock", "Empty Can of Beans", "Warped Penny",
        "Lost House Key", "Mysterious Red Thread", "A Very Large Rock",
        "Grandad’s Lost Reading Glasses", "Backwards Clock", "The Other Sock",
        "Crumpled Bus Ticket", "Unmarked Bag of White Powder",
      ],
      npcPool: [
        "The Slumbering Vagrant", "Gossip Karen", "Agnes, the Cat Lady",
        "Anxious Businessman", "A Very Important Dog", "Mediocre Street Musician",
        "The Local Mayor", "Bewildered Tourist", "Enigmatic Preacher",
      ],
    },
  };