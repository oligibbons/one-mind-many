// src/types/game.d.ts

// --- Core Game Entities ---

export interface BoardSpace {
    x: number;
    y: number;
  }
  export interface Location {
    name: string;
    position: BoardSpace;
  }
  export interface GameObject {
    id: string;
    name: string;
    position: BoardSpace;
    interacted: boolean;
  }
  export interface GameNPC {
    id: string;
    name: string;
    position: BoardSpace;
    interacted: boolean;
  }
  export interface ActiveComplication {
    id: string;
    name: string;
    effect: string;
    duration: number;
  }
  
  // --- Player-Specific Types ---
  
  export type SecretIdentity =
    | 'The Eye'
    | 'The Hand'
    | 'The Key'
    | 'The Grip'
    | 'The Chain'
    | 'The Bolt'
    | 'The Hook'
    | 'The Compass';
  export type PlayerRole = 'True Believer' | 'Heretic' | 'Opportunist';
  export type PlayerSubRole =
    | 'The Guide'
    | 'The Fixer'
    | 'The Instigator'
    | 'The Waster'
    | 'The Data Broker'
    | 'The Mimic';
  export type CardName =
    | 'Move 1'
    | 'Move 2'
    | 'Move 3'
    | 'Homage'
    | 'Hesitate'
    | 'Foresight'
    | 'Charge'
    | 'Deny'
    | 'Rethink'
    | 'Empower'
    | 'Impulse'
    | 'Degrade'
    | 'Interact'
    | 'Inhibit'
    | 'Buffer'
    | 'Gamble'
    | 'Hail Mary'
    | 'Reload';
  export interface CommandCard {
    id: string;
    name: CardName;
    effect: string;
  }
  export interface PrioritySlot {
    playerId: string;
    identity: SecretIdentity;
  }
  export interface SubmittedAction {
    playerId: string;
    card: CommandCard;
    priority: number;
  }
  
  // --- NEW: Full Scenario Definition (from DB) ---
  // This is now fully data-driven to support the new GameEngine
  
  export interface Scenario {
    id: string;
    name: string;
    description: string;
    is_published: boolean;
    board_size_x: number;
    board_size_y: number;
    locations: Location[];
    main_prophecy: {
      win_location: string;
      win_action: string;
      trigger_message: string;
      winner: PlayerRole;
      vp: number; // <-- Added VP
    };
    doomsday_condition: {
      lose_location: string;
      trigger_message: string;
      winner: PlayerRole;
      vp: number; // <-- Added VP
    };
    global_fail_condition: {
      lose_location: string;
      max_round: number;
      trigger_message: string;
      winner: PlayerRole;
    };
    // NEW: Data-driven effect definitions
    complication_effects: Record<
      string,
      {
        description: string;
        duration: number; // 0 = immediate, -1 = permanent
        trigger: any; // e.g., { "type": "ACTION_PLAYED", "condition": { ... } }
        effect: any; // e.g., { "type": "MODIFY_TURN", "moveValue": -1 }
      }
    >;
    object_effects: Record<
      string,
      {
        effects: any[]; // Array of possible effects, e.g., [{ "description": "...", "type": "ADD_ACTION", "cardName": "Move 1" }]
      }
    >;
    npc_effects: Record<
      string,
      {
        static_location?: string; // Optional static location
        effects: {
          positive: any; // e.g., { "description": "...", "type": "MODIFY_VP", "amount": 3 }
          negative: any; // e.g., { "description": "...", "type": "MOVE_TOWARDS", "target_location": "..." }
        };
      }
    >;
    opportunist_goals: {
      'Data Broker': string[][];
    };
    sub_role_definitions: Record<
      string,
      {
        vp: number;
        trigger: any; // e.g., { "type": "END_OF_ROUND", "condition": { "type": "NO_MOVE" } }
      }
    >;
  }
  
  // --- Player & Game State ---
  
  export interface PrivatePlayerState {
    id: string;
    userId: string;
    username: string;
    hand: CommandCard[];
    role: PlayerRole;
    subRole: PlayerSubRole;
    secretIdentity: SecretIdentity;
    personalGoal?: any;
    vp: number;
  }
  
  export interface PublicPlayerState {
    id: string;
    userId: string;
    username: string;
    vp: number;
    submittedAction: boolean;
    is_disconnected: boolean; // <-- NEW
  }
  
  // Represents the dynamic state of the game board
  export interface BoardModifiers {
    impassable: BoardSpace[];
    swapped: { a: BoardSpace; b: BoardSpace }[];
  }
  
  export interface GameState {
    id: string;
    status: 'lobby' | 'active' | 'finished';
    currentRound: number;
    scenario: {
      id: string;
      name: string;
      locations: Location[];
      boardSize: BoardSpace;
    };
    harbingerPosition: BoardSpace;
    stalkerPosition: BoardSpace | null; // <-- NEW
    boardModifiers: BoardModifiers; // <-- NEW
    priorityTrack: PrioritySlot[];
    activeComplications: ActiveComplication[];
    boardObjects: GameObject[];
    boardNPCs: GameNPC[];
    players: PublicPlayerState[];
    gameLog: string[];
    hostId: string; // <-- ADDED THIS, IT'S NEEDED FOR HOST-ONLY BUTTONS
  }
  
  export interface Profile {
    id: string;
    username: string;
    created_at: string;
    is_admin?: boolean;
  }
  
  // =================================================================
  // --- ALL-NEW: Game Results Types ---
  // =================================================================
  
  /**
   * Defines the final score and rank for a single player.
   * This is sent *only* at the end of the game.
   */
  export interface PlayerResult {
    userId: string;
    username: string;
    secretIdentity: SecretIdentity; // e.g., 'The Eye'
    role: PlayerRole; // 'True Believer', 'Heretic', 'Opportunist'
    subRole: PlayerSubRole; // e.g., 'The Waster'
  
    mainGoalVp: number;
    subRoleVp: number;
    totalVp: number;
  
    personalGoal?: {
      // Only for Opportunists
      description: string;
      completed: boolean;
    };
  }
  
  /**
   * Defines the overall outcome of the game.
   */
  export interface GameEndSummary {
    winningRole: PlayerRole | 'draw';
    endCondition: string; // e.g., "The Prophecy was fulfilled!" or "Doomsday was triggered!"
  }
  
  /**
   * The main object emitted by the server when the game finishes.
   */
  export interface GameResults {
    summary: GameEndSummary;
    leaderboard: PlayerResult[]; // Array of players, pre-sorted by totalVp
  }