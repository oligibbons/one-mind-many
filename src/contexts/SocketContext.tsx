// src/contexts/SocketContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState, // <-- FIX 1: Added 'useState' to the named imports
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

// Define the shape of the context
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

// Create the context
const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Define the server URL
// This should match the port in your server/index.js
const SERVER_URL = process.env.VITE_SERVER_URL || 'http://localhost:3001';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth(); // Get auth state

  // Use useMemo to create the socket instance only once
  const socket = useMemo(() => {
    // We only connect if we have a user, but you can change this
    // if you want anonymous users in the lobby
    if (user) {
      return io(SERVER_URL, {
        // You can pass auth tokens here if needed
        // query: { token: user.token }
      });
    }
    return null;
  }, [user]); // Re-run if the user logs in or out

  // FIX 2: Changed 'React.useState' to just 'useState' to use the named import
  const [isConnected, setIsConnected] = useState(socket?.connected || false);

  useEffect(() => {
    if (!socket) {
      setIsConnected(false);
      return;
    }

    // --- Standard connection events ---
    const onConnect = () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    };

    const onConnectError = (error: Error) => {
      console.error('Socket connection error:', error.message);
      // You could show a toast to the user here
    };

    // --- Register listeners ---
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    // --- Server error handler ---
    // Listen for custom errors from our gameHandler
    socket.on('error:game', (data: { message: string }) => {
      console.error('Server Game Error:', data.message);
      // TODO: Show a toast to the user
      // e.g., toast.error(data.message)
    });

    // Cleanup on component unmount
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('error:game');
      socket.disconnect();
    };
  }, [socket]);

  const value = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

// Custom hook to easily access the socket
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};