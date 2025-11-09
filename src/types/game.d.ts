// src/types/game.d.ts

// --- Core Game Entities ---

export interface BoardSpace {
    x: number;
    y: number;
  }
  
  // --- FIX: Properties from server are snake_case ---
  export interface Location {
    id: string; // <-- Added
    name: string;
    position: BoardSpace;
    description?: string; // <-- Added
  }
  
  export interface GameObject {
    id: string;
    name: string;
    position: BoardSpace;
    interacted: boolean;
    // --- NEW: Added from server data ---
    type: string;
    options: any[];
  }
  
  export interface GameNPC {
    id: string;
    name: string;
    position: BoardSpace;
    interacted: boolean;
    // --- NEW: Added from server data ---
    type: string;
    value: number;
  }
  
  export interface ActiveComplication {
    id: string;
    name: string;
    effect: string; // This is the description
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
  export type PlayerSubRole = string; // <-- FIX: Changed to string for flexibility
    
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
    | 'Scramble' // <-- FIX: Renamed 'Reload'
    | 'Stockpile';
    
  export interface CommandCard {
    id: string;
    name: CardName;
    effect: string;
  }
  
  // --- FIX: Renamed and switched to snake_case ---
  export interface PlayerIdentity {
    player_id: string;
    id: string; // The identity ID (e.g., 'eye')
    name: string; // The identity name (e.g., 'The Eye')
  }
  
  export interface SubmittedAction {
    player_id: string; // <-- FIX
    card: CommandCard;
    priority: number;
  }
  
  // --- Full Scenario Definition (from DB) ---
  export interface Scenario {
    id: string;
    name: string;
    description: string;
    is_published: boolean;
    board_size_x: number;
    board_size_y: number;
    locations: Location[];
    main_prophecy: any; // Kept as 'any' from your file
    doomsday_condition: any; // Kept as 'any'
    global_fail_condition: any; // Kept as 'any'
    complication_effects: any; // Kept as 'any'
    object_effects: any; // Kept as 'any'
    npc_effects: any; // Kept as 'any'
    opportunist_goals: any; // Kept as 'any'
    sub_role_definitions: any; // Kept as 'any'
  }
  
  // --- Player & Game State (ALL snake_case) ---
  
  export interface PrivatePlayerState {
    id: string;
    user_id: string; // <-- FIX
    username: string;
    hand: CommandCard[];
    role: PlayerRole;
    sub_role: PlayerSubRole; // <-- FIX
    secret_identity: SecretIdentity; // <-- FIX
    personal_goal?: any; // <-- FIX
    vp: number;
    is_stockpiling?: boolean; // <-- FIX
    has_stockpiled_action?: boolean; // <-- FIX
  }
  
  export interface PublicPlayerState {
    id: string;
    user_id: string; // <-- FIX
    username: string;
    vp: number;
    submitted_action: boolean; // <-- FIX
    is_disconnected: boolean;
    identity: string; // <-- NEW: Added identity name
  }
  
  // Represents the dynamic state of the game board
  export interface BoardModifiers {
    impassable: BoardSpace[];
    swapped: { a: BoardSpace; b: BoardSpace }[];
  }
  
  export interface GameState {
    id: string;
    status: 'lobby' | 'active' | 'finished';
    current_round: number; // <-- FIX
    scenario_id: string; // <-- FIX: Changed from object to ID
    harbinger_position: BoardSpace; // <-- FIX
    stalker_position: BoardSpace | null; // <-- FIX
    board_modifiers: BoardModifiers; // <-- FIX
    priority_track: PlayerIdentity[]; // <-- FIX
    active_complications: ActiveComplication[]; // <-- FIX
    game_objects: GameObject[]; // <-- FIX
    npcs: GameNPC[]; // <-- FIX
    players: PublicPlayerState[];
    game_log: string[]; // <-- FIX
    host_id: string; // <-- FIX
    current_action_index?: number; // <-- NEW: For PriorityTrack
  }
  
  export interface Profile {
    id: string;
    username: string;
    created_at: string;
    is_admin?: boolean;
  }
  
  // --- Game Results Types ---
  // (Based on your GameEndModal.tsx)
  
  export interface PlayerResult {
    userId: string;
    username: string;
    secretIdentity: string; // <-- FIX: Changed to string
    role: PlayerRole;
    subRole: PlayerSubRole;
    totalVp: number;
    // --- NEW: Added from your GameEndModal ---
    mainGoalVp: number;
    subRoleVp: number;
    personalGoal?: {
      description: string;
      completed: boolean;
    };
    rank: number; // <-- NEW: Added rank
    vpBreakdown: { reason: string; value: number }[]; // <-- NEW: Added
  }
  
  export interface GameEndSummary {
    winningRole: PlayerRole | 'draw';
    endCondition: string;
  }
  
  export interface GameResults {
    summary: GameEndSummary;
    leaderboard: PlayerResult[];
    
    // --- NEW: Add properties from GamePage/GameEndModal ---
    endCondition: string;
    winningRole: PlayerRole | 'draw';
    playerResults: PlayerResult[];
  }

  // --- NEW: Types from Lobby/Functional Components ---
  export interface Lobby {
    id: string;
    host_id: string;
    scenario_id: string;
    status: 'lobby' | 'active' | 'finished';
    lobby_code: string;
  }
  
  export interface Player {
    id: string;
    user_id: string;
    username: string;
    is_ready: boolean;
  }