import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import lobbyRoutes from './routes/lobbies.js';
import gameRoutes from './routes/game.js';
import scenarioRoutes from './routes/scenarios.js';
import friendRoutes from './routes/friends.js';
import characterRoutes from './routes/character.js';
import actionRoutes from './routes/action.js';
import narrativeRoutes from './routes/narrative.js';
import adminRoutes from './routes/admin.js';
import rulesRoutes from './routes/rules.js';
import { authenticateJWT, isAdmin } from './middleware/auth.js';
import { validateActionMiddleware, validateGameStateMiddleware } from './middleware/rulesValidation.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = 3000; // Explicitly set port to 3000

// CORS configuration function to handle trailing slash variations
const corsOrigin = (origin, callback) => {
  const allowedOrigins = [
    'https://onemindmany.com',
    'https://onemindmany.com/',
    'https://www.onemindmany.com',
    'https://www.onemindmany.com/',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
  ];
  
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) return callback(null, true);
  
  // Normalize origin by removing trailing slash for comparison
  const normalizedOrigin = origin.replace(/\/$/, '');
  const normalizedAllowed = allowedOrigins.map(o => o.replace(/\/$/, ''));
  
  if (normalizedAllowed.includes(normalizedOrigin)) {
    return callback(null, true);
  }
  
  return callback(new Error('Not allowed by CORS'));
};

// Middleware
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/lobbies', authenticateJWT, lobbyRoutes);
app.use('/api/game', authenticateJWT, gameRoutes);
app.use('/api/scenarios', authenticateJWT, scenarioRoutes);
app.use('/api/friends', authenticateJWT, friendRoutes);
app.use('/api/character', authenticateJWT, characterRoutes);
app.use('/api/action', authenticateJWT, actionRoutes);
app.use('/api/narrative', authenticateJWT, narrativeRoutes);
app.use('/api/admin', authenticateJWT, isAdmin, adminRoutes);
app.use('/api/rules', authenticateJWT, rulesRoutes);

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO with improved CORS configuration
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

// Make io available to routes
app.set('io', io);

// Socket.IO middleware for authentication
io.use((socket, next) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) {
    return next(new Error('Authentication error'));
  }
  
  // Attach user data to socket
  socket.userId = userId;
  next();
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);
  
  // Join user to their own room
  socket.join(`user:${socket.userId}`);
  
  // Handle lobby events
  socket.on('join:lobby', (lobbyId) => {
    socket.join(`lobby:${lobbyId}`);
    io.to(`lobby:${lobbyId}`).emit('user:joined', {
      userId: socket.userId,
      timestamp: new Date(),
    });
  });
  
  socket.on('leave:lobby', (lobbyId) => {
    socket.leave(`lobby:${lobbyId}`);
    io.to(`lobby:${lobbyId}`).emit('user:left', {
      userId: socket.userId,
      timestamp: new Date(),
    });
  });
  
  // Handle game events
  socket.on('join:game', (gameId) => {
    socket.join(`game:${gameId}`);
    io.to(`game:${gameId}`).emit('user:joined', {
      userId: socket.userId,
      timestamp: new Date(),
    });
  });
  
  socket.on('leave:game', (gameId) => {
    socket.leave(`game:${gameId}`);
    io.to(`game:${gameId}`).emit('user:left', {
      userId: socket.userId,
      timestamp: new Date(),
    });
  });
  
  socket.on('game:action', (data) => {
    io.to(`game:${data.gameId}`).emit('game:update', {
      action: data.action,
      userId: socket.userId,
      timestamp: new Date(),
      payload: data.payload,
    });
  });
  
  // Handle character updates
  socket.on('character:update', (data) => {
    io.to(`game:${data.gameId}`).emit('character:updated', {
      character: data.character,
      userId: socket.userId,
      timestamp: new Date(),
    });
  });
  
  // Handle narrative updates
  socket.on('narrative:update', (data) => {
    io.to(`game:${data.gameId}`).emit('narrative:updated', {
      log: data.log,
      userId: socket.userId,
      timestamp: new Date(),
    });
  });
  
  // Handle chat messages
  socket.on('chat:message', (data) => {
    io.to(data.roomId).emit('chat:message', {
      userId: socket.userId,
      message: data.message,
      timestamp: new Date(),
    });
  });

  // Handle pause requests
  socket.on('pause:request', (data) => {
    io.to(`game:${data.gameId}`).emit('pause:requested', {
      userId: socket.userId,
      count: 1, // This would be calculated based on actual pause requests
      timestamp: new Date(),
    });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;