// src/stores/useGameStore.ts

import { create } from 'zustand';
import {
  GameState,
  PrivatePlayerState,
  PublicPlayerState,
  BoardSpace,
  GameResults,
  Scenario, // <-- NEW: Import Scenario
} from '../types/game';

// Define the shape of the store's state
interface GameStoreState {
  publicState: GameState | null;
  privateState: PrivatePlayerState | null;
  scenario: Scenario | null; // <-- NEW: Store scenario separately
  gameResults: GameResults | null;
  error: string | null;

  isAwaitingMove: boolean;
  actingPlayerId: string | null;
  actingUsername: string | null;
  validMoves: BoardSpace[];
}

// Define the actions (functions) to modify the state
interface GameStoreActions {
  setFullGameData: (data: {
    publicState: GameState;
    privateState: PrivatePlayerState;
    scenario: Scenario; // <-- NEW: Add scenario to setup
  }) => void;
  updatePublicState: (newState: GameState) => void;
  updatePrivateState: (newState: PrivatePlayerState) => void;
  updatePlayerSubmitted: (userId: string) => void;
  updatePlayerDisconnect: (userId: string, isDisconnected: boolean) => void;
  setGameResults: (results: GameResults) => void;
  setError: (message: string) => void;
  clearGame: () => void;
  setAwaitingMove: (data: {
    playerId: string;
    actingUsername: string;
    validMoves: BoardSpace[];
  }) => void;
  clearAwaitingMove: () => void;
}

// Create the store
export const useGameStore = create<GameStoreState & GameStoreActions>((set) => ({
  // --- Initial State ---
  publicState: null,
  privateState: null,
  scenario: null, // <-- NEW
  gameResults: null,
  error: null,
  isAwaitingMove: false,
  actingPlayerId: null,
  actingUsername: null,
  validMoves: [],

  // --- Actions ---

  setFullGameData: (data) =>
    set({
      publicState: data.publicState,
      privateState: data.privateState,
      scenario: data.scenario, // <-- NEW
      error: null,
      isAwaitingMove: false,
      validMoves: [],
      actingPlayerId: null,
      actingUsername: null,
      gameResults: null,
    }),

  updatePublicState: (newState) =>
    set((state) => ({
      // Merge new public state, but preserve client-side UI state
      publicState: newState,
      isAwaitingMove: state.isAwaitingMove,
      actingPlayerId: state.actingPlayerId,
      actingUsername: state.actingUsername,
      validMoves: state.validMoves,
    })),

  updatePrivateState: (newState) =>
    set({
      privateState: newState,
    }),

  updatePlayerSubmitted: (userId) =>
    set((state) => {
      if (!state.publicState) return state;
      const newPlayers = state.publicState.players.map(
        (p: PublicPlayerState) =>
          // --- FIX: Use snake_case ---
          p.user_id === userId ? { ...p, submitted_action: true } : p,
      );
      return {
        publicState: { ...state.publicState, players: newPlayers },
      };
    }),

  updatePlayerDisconnect: (userId, isDisconnected) =>
    set((state) => {
      if (!state.publicState) return state;
      const newPlayers = state.publicState.players.map(
        (p: PublicPlayerState) =>
          // --- FIX: Use snake_case ---
          p.user_id === userId ? { ...p, is_disconnected: isDisconnected } : p,
      );
      return {
        publicState: { ...state.publicState, players: newPlayers },
      };
    }),

  setGameResults: (results) =>
    set({
      gameResults: results,
      isAwaitingMove: false, 
      actingPlayerId: null,
      actingUsername: null,
      validMoves: [],
    }),

  setError: (message) => set({ error: message }),

  clearGame: () =>
    set({
      publicState: null,
      privateState: null,
      scenario: null, // <-- NEW
      error: null,
      isAwaitingMove: false,
      validMoves: [],
      actingPlayerId: null,
      actingUsername: null,
      gameResults: null,
    }),

  setAwaitingMove: (data) =>
    set({
      isAwaitingMove: true,
      actingPlayerId: data.playerId,
      actingUsername: data.actingUsername,
      validMoves: data.validMoves,
    }),

  clearAwaitingMove: () =>
    set({
      isAwaitingMove: false,
      actingPlayerId: null,
      actingUsername: null,
      validMoves: [],
    }),
}));