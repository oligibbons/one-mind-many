// src/stores/useCurrentPlayerStore.ts

import { create } from 'zustand';
import { useGameStore } from './useGameStore';
import { useAuth } from '../hooks/useAuth';
import { PrivatePlayerState } from '../types/game';

interface CurrentPlayerState {
  player: PrivatePlayerState | null;
}

/**
 * This store is a "context" that derives its state from other stores.
 * It provides a simple, direct way for components (like PlayerHand)
 * to get the *full private state* of the *currently logged-in player*.
 *
 * It works by listening to both useAuth (to find out who "I" am)
 * and useGameStore (to find my private data in the game state).
 */
export const useCurrentPlayerStore = create<CurrentPlayerState>(() => ({
  player: null,
}));

// --- Subscribe to changes in useGameStore and useAuth ---

/**
 * Initializes the subscriptions to keep the current player store in sync.
 * Call this function ONCE from your main app entry point (e.g., main.tsx)
 * to avoid circular dependency issues.
 */
export const initializeCurrentPlayerStore = () => {
  // Listen for changes in the main game store
  useGameStore.subscribe(
    (state) => state.privateState,
    (privateState) => {
      const { user } = useAuth.getState(); // Get current user
      
      // Check if the privateState from the game store is for the current user
      if (privateState && user && privateState.user_id === user.id) {
        useCurrentPlayerStore.setState({ player: privateState });
      } else if (!privateState) {
        // Clear the player context if the game state is cleared
        useCurrentPlayerStore.setState({ player: null });
      }
    }
  );

  // Also listen for auth changes (e.g., logout)
  useAuth.subscribe((state) => {
    if (!state.user) {
      // If user logs out, clear the player context
      useCurrentPlayerStore.setState({ player: null });
    } else {
      // If user logs *in*, check the game store again
      const { privateState } = useGameStore.getState();
      if (privateState && state.user && privateState.user_id === state.user.id) {
        useCurrentPlayerStore.setState({ player: privateState });
      }
    }
  });
};