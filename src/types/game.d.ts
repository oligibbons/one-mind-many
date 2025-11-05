// --- Core Game Entities ---

/** Represents a single space on the game board */
export interface BoardSpace {
    x: number;
    y: number;
  }
  
  /** Represents a named location on the board */
  export interface Location {
    name: string;
    position: BoardSpace;
  }
  
  /** Represents an interactable object on the board */
  export interface GameObject {
    id: string; // Unique instance ID
    name: string; // e.g., "Rubber Duck", "A Single Sock"
    position: BoardSpace;
    interacted: boolean;
  }
  
  /** Represents an interactable NPC on the board */
  export interface GameNPC {
    id: string; // Unique instance ID
    name: string; // e.g., "Gossip Karen", "A Very Important Dog"
    position: BoardSpace;
    interacted: boolean;
  }
  
  /** Represents an active Complication affecting the game */
  export interface ActiveComplication {
    id: string; // Unique instance ID
    name: string; // e.g., "Gaggle of Feral Youths"
    effect: string;
    duration: number; // in rounds. -1 for permanent.
  }
  
  // --- Player-Specific Types ---
  
  /** All possible Secret Identity names */
  export type SecretIdentity = "The Eye" | "The Hand" | "The Key" | "The Grip" | "The Chain" | "The Bolt" | "The Hook" | "The Compass";
  
  /** All possible Role names */
  export type PlayerRole = "True Believer" | "Heretic" | "Opportunist";
  
  /** All possible Sub-Role names */
  export type PlayerSubRole = "The Guide" | "The Fixer" | "The Instigator" | "The Waster" | "The Data Broker" | "The Mimic";
  
  /** All possible Command Card names */
  export type CardName =
    | "Move 1" | "Move 2" | "Move 3"
    | "Homage" | "Hesitate" | "Foresight"
    | "Charge" | "Deny" | "Rethink"
    | "Empower" | "Impulse" | "Degrade"
    | "Interact" | "Inhibit" | "Buffer"
    | "Gamble" | "Hail Mary" | "Reload";
  
  /** Represents a single card in a player's hand */
  export interface CommandCard {
    id: string; // Unique instance ID for this card
    name: CardName;
    effect: string;
  }
  
  /** Defines the "Hidden Priority" system */
  export interface PrioritySlot {
    playerId: string; // The user_id of the player
    identity: SecretIdentity; // The public token
  }
  
  /** Represents an action submitted by a player for the round */
  export interface SubmittedAction {
    playerId: string;
    card: CommandCard;
    priority: number; // The player's priority this round (1-6)
  }
  
  // --- Player & Game State ---
  
  /**
   * Represents the "Private" state for a single player.
   * This is what ONLY they can see. Matches 'game_players' table.
   */
  export interface PrivatePlayerState {
    id: string; // game_players ID
    userId: string; // auth.users ID
    username: string;
    hand: CommandCard[];
    role: PlayerRole;
    subRole: PlayerSubRole;
    secretIdentity: SecretIdentity; // They know their own identity
    personalGoal?: any; // For Opportunists
    vp: number;
  }
  
  /**
   * Represents the "Public" state for a player.
   * This is what ALL players can see.
   */
  export interface PublicPlayerState {
    id: string; // game_players ID
    userId: string;
    username: string;
    vp: number;
    submittedAction: boolean; // True if they have locked in an action
  }
  
  /**
   * Represents the complete "Public" game state.
   * This is the main object synced to all players. Matches 'games' table.
   */
  export interface GameState {
    id: string; // game ID
    status: "lobby" | "active" | "finished";
    currentRound: number;
    scenario: {
      name: string;
      locations: Location[];
    };
    harbingerPosition: BoardSpace;
    priorityTrack: PrioritySlot[]; // The public, rotating track
    activeComplications: ActiveComplication[];
    boardObjects: GameObject[]; // All visible objects
    boardNPCs: GameNPC[]; // All visible NPCs
    players: PublicPlayerState[]; // List of all players' public data
    gameLog: string[]; // A simple log of events
  }
  
  /**
  * Represents a player profile in the public.profiles table.
  */
  export interface Profile {
    id:string; // auth.users ID
    username: string;
    created_at: string;
  }