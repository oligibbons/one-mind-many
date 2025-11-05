// server/sockets/friendHandler.ts

import { Server, Socket } from 'socket.io';
import { SupabaseClient } from '@supabase/supabase-js';

type AdminSupabaseClient = SupabaseClient<any, 'public', any>;
type UserMap = Map<string, { userId: string; username: string }>;
// NEW: We need a reverse map to find a user's socket
type UserSocketMap = Map<string, string>; // Map<userId, socketId>

export const registerFriendHandlers = (
  io: Server,
  socket: Socket,
  supabase: AdminSupabaseClient,
  socketToUser: UserMap,
  userToSocket: UserSocketMap, // <-- NEW
) => {
  /**
   * (NEW) Fired by a host from the InviteFriendModal
   */
  const sendFriendInvite = async (
    payload: {
      gameId: string;
      lobbyName: string;
      inviteeId: string; // The user ID of the friend to invite
    },
    callback: (
      response:
        | { status: 'ok' }
        | { status: 'error'; message: string },
    ) => void,
  ) => {
    try {
      const { gameId, lobbyName, inviteeId } = payload;
      const hostInfo = socketToUser.get(socket.id);
      if (!hostInfo) throw new Error('You are not authenticated.');

      // 1. Find the friend's socket ID
      const inviteeSocketId = userToSocket.get(inviteeId);
      if (!inviteeSocketId) {
        throw new Error('Your friend is not online.');
      }
      
      // 2. Check if the friend is already in a room (lobby or game)
      const inviteeSocket = io.sockets.sockets.get(inviteeSocketId);
      if (inviteeSocket && inviteeSocket.rooms.size > 1) { // size > 1 because they are always in their own socket.id room
         // Check if they are already in *this* game
         if (inviteeSocket.rooms.has(gameId)) {
            throw new Error('This user is already in your lobby.');
         }
         // TODO: Check if they are in *another* game
         // For now, we'll let them get invites even in another lobby
      }

      // 3. Emit the invite *only* to that user's socket
      io.to(inviteeSocketId).emit('friend:invite_received', {
        gameId,
        lobbyName,
        hostUsername: hostInfo.username,
      });

      console.log(
        `[${socket.id}] ${hostInfo.username} invited ${inviteeId} to lobby ${gameId}`,
      );
      callback({ status: 'ok' });
    } catch (error: any) {
      console.error(
        `[${socket.id}] Error in sendFriendInvite: ${error.message}`,
      );
      callback({ status: 'error', message: error.message });
    }
  };

  socket.on('friend:invite', sendFriendInvite);
};

/**
 * (NEW) Exported presence handlers for server/index.js
 */
export const handleFriendConnect = async (
  io: Server,
  supabase: AdminSupabaseClient,
  userId: string,
) => {
  try {
    // Set user status to 'Online' in DB
    await supabase
      .from('profiles')
      .update({ status: 'Online' })
      .eq('id', userId);
    
    // Notify all friends that this user is online
    const { data, error } = await supabase.rpc('get_friend_ids', { p_user_id: userId });
    if (error) throw error;
    
    const friendSocketIds = data
      .map((friend: { friend_id: string }) => userToSocket.get(friend.friend_id))
      .filter(Boolean); // Get list of online friend socket IDs
      
    io.to(friendSocketIds).emit('friend:status_update', { userId, status: 'Online' });

  } catch (error: any) {
    console.error(`Error handling friend connect for ${userId}: ${error.message}`);
  }
};

export const handleFriendDisconnect = async (
  io: Server,
  supabase: AdminSupabaseClient,
  userId: string,
  userToSocket: UserSocketMap, // Pass this to read from
) => {
   try {
    // Set user status to 'Offline' in DB
    await supabase
      .from('profiles')
      .update({ status: 'Offline' })
      .eq('id', userId);
    
    // Notify all friends that this user is offline
    const { data, error } = await supabase.rpc('get_friend_ids', { p_user_id: userId });
    if (error) throw error;
    
    const friendSocketIds = data
      .map((friend: { friend_id: string }) => userToSocket.get(friend.friend_id))
      .filter(Boolean);
      
    io.to(friendSocketIds).emit('friend:status_update', { userId, status: 'Offline' });

  } catch (error: any) {
    console.error(`Error handling friend disconnect for ${userId}: ${error.message}`);
  }
};

