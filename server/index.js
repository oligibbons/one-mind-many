// server/index.js

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import { registerGameHandlers } from './sockets/gameHandler.js';
import { registerLobbyHandlers } from './sockets/lobbyHandler.js';
import { registerAdminHandlers } from './sockets/adminHandler.js'; // <-- NEW
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
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
console.log('Supabase admin client initialized.');

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

  // Register all our different handlers for this socket
  registerLobbyHandlers(io, socket, supabaseAdmin);
  registerGameHandlers(io, socket, supabaseAdmin);
  registerAdminHandlers(io, socket, supabaseAdmin); // <-- NEW

  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socket.id}. Reason: ${reason}`);
    // Handlers themselves will clean up (e.g., in gameHandler)
  });
};

io.on('connection', onConnection);

// --- Server Start ---
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server listening on http://localhost:${PORT}`);
});