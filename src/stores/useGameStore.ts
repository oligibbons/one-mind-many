// src/stores/useGameStore.ts

import { create } from 'zustand';
import {
  GameState,
  PrivatePlayerState,
  PublicPlayerState,
  BoardSpace, // <-- NEW
} from '../types/game';

// Define the shape of the store's state
interface GameStoreState {
  publicState: GameState | null;
  privateState: PrivatePlayerState | null;
  error: string | null;
  
  // --- NEW state for interactive movement ---
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
  updatePrivateState: (newState: PrivatePlayerState) => void; // <-- NEW
  updatePlayerSubmitted: (userId: string) => void;
  setError: (message: string) => void;
  clearGame: () => void;
  
  // --- NEW actions for movement ---
  setAwaitingMove: (data: {
    playerId: string;
    validMoves: BoardSpace[];
  }) => void;
  clearAwaitingMove: () => void;
}

// Create the store
export const useGameStore = create<GameStoreState & GameStoreActions>(
  (set) => ({
    // --- Initial State ---
    publicState: null,
    privateState: null,
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
        isAwaitingMove: false, // Ensure state is clean on load
        validMoves: [],
        actingPlayerId: null,
      }),

    updatePublicState: (newState) =>
      set({
        publicState: newState,
      }),
      
    // NEW: For when the server sends just our private state (e.g., new hand)
    updatePrivateState: (newState) =>
      set({
        privateState: newState,
      }),

    updatePlayerSubmitted: (userId) =>
      set((state) => {
        if (!state.publicState) return state;
        const newPlayers = state.publicState.players.map(
          (p: PublicPlayerState) =>
            p.userId === userId ? { ...p, submittedAction: true } : p
        );
        return {
          publicState: { ...state.publicState, players: newPlayers },
        };
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
      }),
      
    // --- NEW Movement Actions ---
    
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
  })
);