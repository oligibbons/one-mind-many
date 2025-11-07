// src/stores/useGameStore.ts

import { create } from 'zustand';
import {
  GameState,
  PrivatePlayerState,
  PublicPlayerState,
  BoardSpace,
  GameResults,
} from '../types/game';

// Define the shape of the store's state
interface GameStoreState {
  publicState: GameState | null;
  privateState: PrivatePlayerState | null;
  gameResults: GameResults | null;
  error: string | null;

  isAwaitingMove: boolean;
  actingPlayerId: string | null;
  actingUsername: string | null; // <-- NEW: To store who is moving
  validMoves: BoardSpace[];
}

// Define the actions (functions) to modify the state
interface GameStoreActions {
  setFullGameData: (data: {
    publicState: GameState;
    privateState: PrivatePlayerState;
  }) => void;
  updatePublicState: (newState: GameState) => void;
  updatePrivateState: (newState: PrivatePlayerState) => void;
  updatePlayerSubmitted: (userId: string) => void;
  updatePlayerDisconnect: (userId: string, isDisconnected: boolean) => void;
  setGameResults: (results: GameResults) => void;
  setError: (message: string) => void;
  clearGame: () => void;

  // --- FIX: Updated data shape ---
  setAwaitingMove: (data: {
    playerId: string;
    actingUsername: string; // <-- NEW
    validMoves: BoardSpace[];
  }) => void;
  // --- END FIX ---
  
  clearAwaitingMove: () => void;
}

// Create the store
export const useGameStore = create<GameStoreState & GameStoreActions>((set) => ({
  // --- Initial State ---
  publicState: null,
  privateState: null,
  gameResults: null,
  error: null,
  isAwaitingMove: false,
  actingPlayerId: null,
  actingUsername: null, // <-- NEW
  validMoves: [],

  // --- Actions ---

  setFullGameData: (data) =>
    set({
      publicState: data.publicState,
      privateState: data.privateState,
      error: null,
      isAwaitingMove: false,
      validMoves: [],
      actingPlayerId: null,
      actingUsername: null, // <-- NEW
      gameResults: null,
    }),

  updatePublicState: (newState) =>
    set((state) => ({
      // Merge new public state, but preserve client-side UI state
      publicState: newState,
      isAwaitingMove: state.isAwaitingMove,
      actingPlayerId: state.actingPlayerId,
      actingUsername: state.actingUsername, // <-- NEW
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
          p.userId === userId ? { ...p, submittedAction: true } : p,
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
          p.userId === userId ? { ...p, is_disconnected: isDisconnected } : p,
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
      actingUsername: null, // <-- NEW
      validMoves: [],
    }),

  setError: (message) => set({ error: message }),

  clearGame: () =>
    set({
      publicState: null,
      privateState: null,
      error: null,
      isAwaitingMove: false,
      validMoves: [],
      actingPlayerId: null,
      actingUsername: null, // <-- NEW
      gameResults: null,
    }),

  // --- FIX: Updated function to store username ---
  setAwaitingMove: (data) =>
    set({
      isAwaitingMove: true,
      actingPlayerId: data.playerId,
      actingUsername: data.actingUsername, // <-- NEW
      validMoves: data.validMoves,
    }),
  // --- END FIX ---

  clearAwaitingMove: () =>
    set({
      isAwaitingMove: false,
      actingPlayerId: null,
      actingUsername: null, // <-- NEW
      validMoves: [],
    }),
}));