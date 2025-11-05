import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import cors from 'cors';
import { registerLobbyHandlers } from './sockets/lobbyHandler.js';
import { registerGameHandlers } from './sockets/gameHandler.js';
import { registerChatHandlers } from './sockets/chatHandler.js';
import { registerAdminHandlers } from './sockets/adminHandler.js';
import { registerFriendHandlers } from './sockets/friendHandler.js';

// Import API routes
import authRoutes from './routes/auth.js';
// import gameRoutes from './routes/game.js'; // <-- REMOVED
// import lobbyRoutes from './routes/lobbies.js'; // <-- REMOVED
import friendRoutes from './routes/friends.js';
import profileRoutes from './routes/profile.js';
import adminRoutes from './routes/admin.js';

dotenv.config({ path: '../.env' });

const app = express();
const httpServer = createServer(app);

// --- Supabase Admin Client ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    'Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
app.locals.supabase = supabase;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Auth middleware
export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) {
      console.warn('Auth middleware error:', error.message);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Token processing failed' });
  }
};

// --- API Routes ---
app.use('/api/auth', authRoutes);
// app.use('/api/game', authMiddleware, gameRoutes); // <-- REMOVED
// app.use('/api/lobbies', authMiddleware, lobbyRoutes); // <-- REMOVED
app.use('/api/friends', authMiddleware, friendRoutes);
app.use('/api/profile', authMiddleware, profileRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);


// --- Socket.IO Server ---
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST'],
  },
});

// In-memory maps
const socketToUser = new Map(); // socket.id -> { userId, username }
const userToSocket = new Map(); // userId -> socket.id
const socketInRoom = new Map(); // socket.id -> { roomId, type: 'lobby' | 'game' }

io.on('connection', (socket) => {
  console.log(`[${socket.id}] User connected`);

  // --- Socket Auth & Presence ---
  socket.on('authenticate', async (token) => {
    try {
      if (!token) {
        throw new Error('No token provided');
      }
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error) throw error;
      if (!user) throw new Error('User not found for token');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;
      if (!profile) throw new Error('Profile not found for user');

      const userInfo = { userId: user.id, username: profile.username };
      socketToUser.set(socket.id, userInfo);
      userToSocket.set(user.id, socket.id);

      // Set user status to 'Online'
      await supabase
        .from('profiles')
        .update({ status: 'Online' })
        .eq('id', user.id);

      console.log(`[${socket.id}] User authenticated: ${userInfo.username}`);
      socket.emit('authenticated');

      // Notify friends of 'Online' status
      io.emit('friend:status_update', { userId: user.id, status: 'Online' });

    } catch (error) {
      console.error(`[${socket.id}] Authentication error: ${error.message}`);
      socket.emit('unauthorized', 'Authentication failed');
      socket.disconnect();
    }
  });

  // --- Register Handlers ---
  registerLobbyHandlers(io, socket, supabase, socketToUser, socketInRoom);
  registerGameHandlers(io, socket, supabase, socketToUser, socketInRoom);
  registerChatHandlers(io, socket, supabase, socketToUser, socketInRoom);
  registerAdminHandlers(io, socket, supabase, socketToUser);
  registerFriendHandlers(io, socket, supabase, socketToUser, userToSocket);

  // --- Disconnect Handler ---
  socket.on('disconnect', async (reason) => {
    console.log(`[${socket.id}] User disconnected: ${reason}`);

    const userInfo = socketToUser.get(socket.id);
    const roomInfo = socketInRoom.get(socket.id);

    // Handle room disconnection
    if (userInfo && roomInfo) {
      if (roomInfo.type === 'lobby') {
        // (This logic is now in lobbyHandler.ts, but we keep a simplified
        // version here as a fallback for immediate disconnects)
      } else if (roomInfo.type === 'game') {
        // (This logic is in gameHandler.ts)
      }
    }

    // Handle presence
    if (userInfo) {
      const { userId, username } = userInfo;
      
      // Check if user has reconnected on a different socket
      const newSocketId = userToSocket.get(userId);
      if (newSocketId === socket.id) {
        // This is a true disconnect
        await supabase
          .from('profiles')
          .update({ status: 'Offline' })
          .eq('id', userId);
        
        userToSocket.delete(userId);
        console.log(`[${socket.id}] User ${username} marked as Offline.`);
        io.emit('friend:status_update', { userId: userId, status: 'Offline' });
      } else {
         console.log(`[${socket.id}] User ${username} disconnected, but is still connected on ${newSocketId}.`);
      }
    }

    // Clean up maps
    socketToUser.delete(socket.id);
    socketInRoom.delete(socket.id);
  });
});

// --- Server Start ---
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});