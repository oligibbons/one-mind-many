// src/stores/usePlayerContextStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlayerContextState {
  mutedUsers: Set<string>;
  muteUser: (userId: string) => void;
  unmuteUser: (userId: string) => void;
  isMuted: (userId: string) => boolean;
}

export const usePlayerContextStore = create<PlayerContextState>()(
  persist(
    (set, get) => ({
      mutedUsers: new Set(),

      /**
       * Adds a user's ID to the muted set.
       */
      muteUser: (userId) => {
        set((state) => {
          const newMutedUsers = new Set(state.mutedUsers);
          newMutedUsers.add(userId);
          return { mutedUsers: newMutedUsers };
        });
      },

      /**
       * Removes a user's ID from the muted set.
       */
      unmuteUser: (userId) => {
        set((state) => {
          const newMutedUsers = new Set(state.mutedUsers);
          newMutedUsers.delete(userId);
          return { mutedUsers: newMutedUsers };
        });
      },

      /**
       * Checks if a user is in the muted set.
       */
      isMuted: (userId) => {
        return get().mutedUsers.has(userId);
      },
    }),
    {
      name: 'omm-player-context-storage', // local storage name
      // Custom serializer for Set
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              mutedUsers: new Set(state.mutedUsers),
            },
          };
        },
        setItem: (name, newValue) => {
          const str = JSON.stringify({
            state: {
              ...newValue.state,
              mutedUsers: Array.from(newValue.state.mutedUsers),
            },
          });
          localStorage.setItem(name, str);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
);