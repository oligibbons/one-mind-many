// src/stores/useGameStore.ts

import { create } from 'zustand';
import {
  GameState,
  PrivatePlayerState,
  PublicPlayerState,
  BoardSpace,
  GameResults, // <-- NEW IMPORT
} from '../types/game';

// Define the shape of the store's state
interface GameStoreState {
  publicState: GameState | null;
  privateState: PrivatePlayerState | null;
  gameResults: GameResults | null; // <-- NEW: To store end-game results
  error: string | null;

  isAwaitingMove: boolean;
  actingPlayerId: string | null; // The player who needs to move
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
  setGameResults: (results: GameResults) => void; // <-- NEW: Action to set results
  setError: (message: string) => void;
  clearGame: () => void;

  setAwaitingMove: (data: {
    playerId: string;
    validMoves: BoardSpace[];
  }) => void;
  clearAwaitingMove: () => void;
}

// Create the store
export const useGameStore = create<GameStoreState & GameStoreActions>((set) => ({
  // --- Initial State ---
  publicState: null,
  privateState: null,
  gameResults: null, // <-- NEW: Initial state
  error: null,
  isAwaitingMove: false,
  actingPlayerId: null,
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
      gameResults: null, // <-- NEW: Ensure results are cleared on new data
    }),

  updatePublicState: (newState) =>
    set((state) => ({
      // Merge new public state, but preserve client-side UI state
      publicState: newState,
      isAwaitingMove: state.isAwaitingMove,
      actingPlayerId: state.actingPlayerId,
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

  // --- NEW: Handle disconnects/reconnects in UI ---
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

  // --- NEW: Action to set game results ---
  setGameResults: (results) =>
    set({
      gameResults: results,
      isAwaitingMove: false, // Game is over, no more moves
      actingPlayerId: null,
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
      gameResults: null, // <-- NEW: Clear results on exit
    }),

  setAwaitingMove: (data) =>
    set({
      isAwaitingMove: true,
      actingPlayerId: data.playerId,
      validMoves: data.validMoves,
    }),

  clearAwaitingMove: () =>
    set({
      isAwaitingMove: false,
      actingPlayerId: null,
      validMoves: [],
    }),
}));