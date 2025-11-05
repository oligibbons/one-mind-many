// src/stores/usePresenceStore.ts

import { create } from 'zustand';

type FriendStatus = 'Online' | 'Offline' | 'In-Game';

interface PresenceState {
  // Stores a map of userId -> Status
  friendStatuses: Map<string, FriendStatus>;
  setFriendStatus: (userId: string, status: FriendStatus) => void;
  getFriendStatus: (userId: string) => FriendStatus;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  friendStatuses: new Map(),

  /**
   * Updates the status for a single friend.
   */
  setFriendStatus: (userId, status) => {
    set((state) => {
      const newStatuses = new Map(state.friendStatuses);
      newStatuses.set(userId, status);
      return { friendStatuses: newStatuses };
    });
  },

  /**
   * Gets the status for a friend, defaulting to 'Offline'.
   */
  getFriendStatus: (userId) => {
    return get().friendStatuses.get(userId) || 'Offline';
  },
}));