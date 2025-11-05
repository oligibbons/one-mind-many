// server/index.js

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Import API routes
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js'; // Your full admin.js file
import gameRoutes from './routes/game.js';
import lobbyRoutes from './routes/lobbies.js';
import friendRoutes from './routes/friends.js';
import profileRoutes from './routes/profile.js'; // The new profile API

// Import Socket Handlers
import { registerLobbyHandlers, handleLobbyDisconnect } from './sockets/lobbyHandler.js';
import { registerGameHandlers, handleGameDisconnect } from './sockets/gameHandler.js';
import { registerAdminHandlers } from './sockets/adminHandler.js'; // <-- NEW
import { registerFriendHandlers, handleFriendConnect, handleFriendDisconnect } from './sockets/friendHandler.js'; // <-- NEW
import { registerChatHandlers } from './sockets/chatHandler.js'; // <-- NEW

dotenv.config({ path: '../.env' });

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3001;

// --- Supabase Admin Client ---
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// --- Middleware ---
app.use(express.json());

// Simple auth middleware to check for Supabase JWT
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const user = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Expose Supabase client to API routes
app.use((req, res, next) => {
  req.app.locals.supabase = supabase;
  next();
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', authMiddleware, adminRoutes); // Using your file
app.use('/api/game', authMiddleware, gameRoutes);
app.use('/api/lobbies', authMiddleware, lobbyRoutes);
app.use('/api/friends', authMiddleware, friendRoutes);
app.use('/api/profile', authMiddleware, profileRoutes); // Using new file

// --- Socket.IO Server ---
const io = new Server(httpServer, {
  cors: {
    origin: process.env.VITE_CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// --- In-Memory Maps for Socket State ---
const socketToUser = new Map();
const socketInRoom = new Map();
const userToSocket = new Map(); // <userId, socketId>

// --- Socket.IO Auth Middleware ---
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const profile = socket.handshake.auth.profile;

  if (!token || !profile) {
    return next(new Error('Authentication error: Missing token or profile.'));
  }
  try {
    const user = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    socket.data.user = user;
    socket.data.profile = profile;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token.'));
  }
});

// --- Socket.IO Connection Logic ---
io.on('connection', (socket) => {
  console.log(`[${socket.id}] User connected.`);
  
  const { user, profile } = socket.data;
  if (!user || !profile) {
    console.error(`[${socket.id}] Connection failed: No user or profile data.`);
    return socket.disconnect();
  }

  // --- Add to maps ---
  socketToUser.set(socket.id, { userId: user.sub, username: profile.username });
  userToSocket.set(user.sub, socket.id);
  console.log(`[${socket.id}] Mapped to user ${profile.username} (${user.sub})`);

  // --- Handle Friend Presence ---
  handleFriendConnect(io, supabase, user.sub, userToSocket);

  // --- Register Handlers ---
  registerLobbyHandlers(io, socket, supabase, socketToUser, socketInRoom);
  registerGameHandlers(io, socket, supabase, socketToUser, socketInRoom);
  registerAdminHandlers(io, socket, supabase, socketToUser); // <-- NEW
  registerFriendHandlers(io, socket, supabase, socketToUser, userToSocket); // <-- NEW
  registerChatHandlers(io, socket, supabase, socketToUser, socketInRoom); // <-- NEW

  // --- Disconnect Logic ---
  socket.on('disconnect', async (reason) => {
    console.log(`[${socket.id}] User disconnected: ${reason}`);
    
    const userInfo = socketToUser.get(socket.id);
    const roomInfo = socketInRoom.get(socket.id);

    if (userInfo) {
      // --- Handle Friend Presence ---
      handleFriendDisconnect(io, supabase, userInfo.userId, userToSocket);

      // --- Handle Game/Lobby Disconnect ---
      if (roomInfo) {
        if (roomInfo.type === 'lobby') {
          handleLobbyDisconnect(io, socket, supabase, roomInfo.roomId, userInfo);
        } else if (roomInfo.type === 'game') {
          handleGameDisconnect(io, socket, supabase, roomInfo.roomId, userInfo);
        }
      }
    }

    // --- Clean up maps ---
    if (userInfo) {
      userToSocket.delete(userInfo.userId);
    }
    socketToUser.delete(socket.id);
    socketInRoom.delete(socket.id);
  });
});

// --- Start Server ---
httpServer.listen(port, () => {
  console.log(`Server with Socket.IO listening on http://localhost:${port}`);
});