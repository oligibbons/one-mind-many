// server/index.js

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import { registerLobbyHandlers, handleLobbyDisconnect } from './sockets/lobbyHandler.js';
import { registerGameHandlers, handleGameDisconnect } from './sockets/gameHandler.js';
import { registerAdminHandlers } from './sockets/adminHandler.js';

const port = process.env.PORT || 3001;
const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Create a single Supabase client for the server
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use the service role key for admin-level access
);

// --- Centralized connection management ---
const socketToUser = new Map(); // socket.id -> { userId, username }
const socketInRoom = new Map(); // socket.id -> { roomId, type: 'lobby' | 'game' }

io.on('connection', (socket) => {
  console.log(`[${socket.id}] user connected`);

  // Register all handlers
  registerLobbyHandlers(io, socket, supabase, socketToUser, socketInRoom);
  registerGameHandlers(io, socket, supabase, socketToUser, socketInRoom);
  registerAdminHandlers(io, socket, supabase, socketToUser, socketInRoom);

  socket.on('disconnect', () => {
    console.log(`[${socket.id}] user disconnected`);

    // --- NEW: Disconnect Logic ---
    const roomInfo = socketInRoom.get(socket.id);
    const userInfo = socketToUser.get(socket.id);

    if (roomInfo && userInfo) {
      if (roomInfo.type === 'lobby') {
        handleLobbyDisconnect(io, socket, supabase, roomInfo.roomId, userInfo);
      } else if (roomInfo.type === 'game') {
        handleGameDisconnect(io, socket, supabase, roomInfo.roomId, userInfo);
      }
    }
    
    // Clean up maps
    socketToUser.delete(socket.id);
    socketInRoom.delete(socket.id);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}`);
});