// server/sockets/chatHandler.ts

import { Server, Socket } from 'socket.io';
import { SupabaseClient } from '@supabase/supabase-js';

type AdminSupabaseClient = SupabaseClient<any, 'public', any>;
type UserMap = Map<string, { userId: string; username: string }>;
type RoomMap = Map<string, { roomId: string; type: 'lobby' | 'game' }>;

// Basic message validation
const isValidMessage = (message: string): boolean => {
  if (message.trim().length === 0) return false;
  if (message.length > 256) return false; // Max message length
  return true;
};

export const registerChatHandlers = (
  io: Server,
  socket: Socket,
  supabase: AdminSupabaseClient,
  socketToUser: UserMap,
  socketInRoom: RoomMap,
) => {
  /**
   * Fired when a client sends a chat message
   */
  const sendChatMessage = async (
    payload: {
      gameId: string; // This is the roomId (lobbyId or gameId)
      message: string;
    },
    callback: (
      response:
        | { status: 'ok' }
        | { status: 'error'; message: string },
    ) => void,
  ) => {
    try {
      const { gameId, message } = payload;
      const userInfo = socketToUser.get(socket.id);
      const roomInfo = socketInRoom.get(socket.id);

      if (!userInfo) throw new Error('You are not authenticated.');
      if (!roomInfo || roomInfo.roomId !== gameId) {
        throw new Error('You are not in this room.');
      }
      if (!isValidMessage(message)) {
        throw new Error('Invalid message.');
      }

      const { userId, username } = userInfo;

      const messageData = {
        id: crypto.randomUUID(),
        userId,
        username,
        message: message.trim(), // Send the trimmed message
        timestamp: new Date().toISOString(),
      };

      // 1. Broadcast the message to everyone in the room
      io.to(gameId).emit('chat:message_received', messageData);

      // 2. (Optional but recommended) Persist the chat message to the game log
      // We'll use an rpc call to append to the jsonb array
      const { error: logError } = await supabase.rpc('append_to_game_log', {
        game_id: gameId,
        log_entry: { type: 'chat', ...messageData },
      });

      if (logError) {
        console.error(`[${socket.id}] Failed to save chat log: ${logError.message}`);
        // Don't block the chat, just log the error
      }

      callback({ status: 'ok' });
    } catch (error: any) {
      console.error(`[${socket.id}] Error in sendChatMessage: ${error.message}`);
      callback({ status: 'error', message: error.message });
    }
  };

  socket.on('chat:send_message', sendChatMessage);
};
