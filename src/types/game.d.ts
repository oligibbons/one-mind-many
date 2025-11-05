// src/types/game.d.ts

// --- Core Game Entities ---

export interface BoardSpace { x: number; y: number; }
export interface Location { name: string; position: BoardSpace; }
export interface GameObject { id: string; name: string; position: BoardSpace; interacted: boolean; }
export interface GameNPC { id: string; name: string; position: BoardSpace; interacted: boolean; }
export interface ActiveComplication { id: string; name: string; effect: string; duration: number; }

// --- Player-Specific Types ---

export type SecretIdentity = "The Eye" | "The Hand" | "The Key" | "The Grip" | "The Chain" | "The Bolt" | "The Hook" | "The Compass";
export type PlayerRole = "True Believer" | "Heretic" | "Opportunist";
export type PlayerSubRole = "The Guide" | "The Fixer" | "The Instigator" | "The Waster" | "The Data Broker" | "The Mimic";
export type CardName = | "Move 1" | "Move 2" | "Move 3" | "Homage" | "Hesitate" | "Foresight" | "Charge" | "Deny" | "Rethink" | "Empower" | "Impulse" | "Degrade" | "Interact" | "Inhibit" | "Buffer" | "Gamble" | "Hail Mary" | "Reload";
export interface CommandCard { id: string; name: CardName; effect: string; }
export interface PrioritySlot { playerId: string; identity: SecretIdentity; }
export interface SubmittedAction { playerId: string; card: CommandCard; priority: number; }

// --- NEW: Full Scenario Definition (from DB) ---

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
  };
  doomsday_condition: {
    lose_location: string;
    trigger_message: string;
    winner: PlayerRole;
  };
  global_fail_condition: {
    lose_location: string;
    max_round: number;
    trigger_message: string;
    winner: PlayerRole;
  };
  complication_effects: Record<string, { duration: number; effect: string; }>;
  object_effects: Record<string, { effect: string; }>;
  npc_effects: Record<string, { positive: string; negative: string; }>;
  opportunist_goals: {
    'Data Broker': string[][];
  };
  sub_role_definitions: {
    'The Guide': { type: 'location_vp'; location_tag: string; vp: number; locations: string[]; };
    'The Fixer': { type: 'event_vp'; event: 'complication_removed'; vp: number; };
    'The Instigator': { type: 'card_play_vp'; cards: CardName[]; vp: number; };
    'The Waster': { type: 'location_vp'; location_tag: 'previous_space'; vp: number; };
    'The Mimic': { type: 'event_vp'; event: 'copy_true_believer'; vp: number; };
  };
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
}

export interface GameState {
  id: string;
  status: "lobby" | "active" | "finished";
  currentRound: number;
  scenario: {
    // GameState only needs a *subset* of the full scenario data
    id: string; // Store scenario ID
    name: string;
    locations: Location[];
    boardSize: BoardSpace;
  };
  harbingerPosition: BoardSpace;
  priorityTrack: PrioritySlot[];
  activeComplications: ActiveComplication[];
  boardObjects: GameObject[];
  boardNPCs: GameNPC[];
  players: PublicPlayerState[];
  gameLog: string[];
}

export interface Profile {
  id: string;
  username: string;
  created_at: string;
  is_admin?: boolean; // Added for admin panel
}