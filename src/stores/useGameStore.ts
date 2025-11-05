// src/stores/useGameStore.ts

import { create } from 'zustand';
import {
  GameState,
  PrivatePlayerState,
  PublicPlayerState,
} from '../types/game';

// Define the shape of the store's state
interface GameStoreState {
  publicState: GameState | null;
  privateState: PrivatePlayerState | null;
  error: string | null;
}

// Define the actions (functions) to modify the state
interface GameStoreActions {
  setFullGameData: (data: {
    publicState: GameState;
    privateState: PrivatePlayerState;
  }) => void;
  updatePublicState: (newState: GameState) => void;
  updatePlayerSubmitted: (userId: string) => void;
  setError: (message: string) => void;
  clearGame: () => void;
}

// Create the store
export const useGameStore = create<GameStoreState & GameStoreActions>(
  (set) => ({
    // --- Initial State ---
    publicState: null,
    privateState: null,
    error: null,

    // --- Actions ---
    
    /**
     * Called when first joining a game or reconnecting.
     * Sets the entire game state.
     */
    setFullGameData: (data) =>
      set({
        publicState: data.publicState,
        privateState: data.privateState,
        error: null,
      }),

    /**
     * Called on a 'game:state_update' event from the server.
     * Updates only the public game state (e.g., after a round resolves).
     */
    updatePublicState: (newState) =>
      set({
        publicState: newState,
      }),

    /**
     * Called when a 'game:player_submitted' event is received.
     * Toggles a player's submitted status.
     */
    updatePlayerSubmitted: (userId) =>
      set((state) => {
        if (!state.publicState) return state;

        const newPlayers = state.publicState.players.map(
          (p: PublicPlayerState) =>
            p.userId === userId ? { ...p, submittedAction: true } : p
        );

        return {
          publicState: {
            ...state.publicState,
            players: newPlayers,
          },
        };
      }),

    /**
     * Sets a game-related error.
     */
    setError: (message) => set({ error: message }),

    /**
     * Clears the game state when leaving a game or on logout.
     */
    clearGame: () =>
      set({
        publicState: null,
        privateState: null,
        error: null,
      }),
  })
);