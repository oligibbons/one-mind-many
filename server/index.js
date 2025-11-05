// server/index.js

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import { registerGameHandlers, handleGameDisconnect } from './sockets/gameHandler.js';
import { registerLobbyHandlers, handleLobbyDisconnect } from './sockets/lobbyHandler.js';
import { registerAdminHandlers } from './sockets/adminHandler.js';
import 'dotenv/config';

const app = express();
const httpServer = createServer(app);

// --- Environment Setup ---
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error(
    'Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in server/.env'
  );
  process.exit(1);
}

// --- Supabase Admin Client ---
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
console.log('Supabase admin client initialized.');

// --- NEW: Central Connection Maps ---
const socketToUser = new Map<string, { userId: string; username: string }>();
const socketInRoom = new Map<string, { roomId: string, type: 'lobby' | 'game' }>();

// --- Socket.io Server ---
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// --- Socket.io Event Handlers ---
const onConnection = (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Pass the central maps to all handlers
  registerLobbyHandlers(io, socket, supabaseAdmin, socketToUser, socketInRoom);
  registerGameHandlers(io, socket, supabaseAdmin, socketToUser, socketInRoom);
  registerAdminHandlers(io, socket, supabaseAdmin, socketToUser); // Admin only needs user map

  // Handle disconnects centrally
  socket.on('disconnecting', (reason) => {
    console.log(`Socket disconnecting: ${socket.id}. Reason: ${reason}`);
    
    const roomInfo = socketInRoom.get(socket.id);
    const userInfo = socketToUser.get(socket.id);

    if (roomInfo && userInfo) {
      if (roomInfo.type === 'lobby') {
        // Let lobby handler clean up (e.g., remove from DB)
        handleLobbyDisconnect(io, socket, supabaseAdmin, roomInfo.roomId, userInfo);
      } else if (roomInfo.type === 'game') {
        // Let game handler clean up
        handleGameDisconnect(io, socket, supabaseAdmin, roomInfo.roomId, userInfo);
      }
    }
    
    // Clean up central maps
    socketToUser.delete(socket.id);
    socketInRoom.delete(socket.id);
  });
};

io.on('connection', onConnection);

// --- Server Start ---
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server listening on http://localhost:${PORT}`);
});