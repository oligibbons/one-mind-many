// src/contexts/SocketContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState, // <-- FIX 1: Make sure this is imported
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
const SERVER_URL = process.env.VITE_SERVER_URL || 'http://localhost:3001';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth(); // Get auth state

  const socket = useMemo(() => {
    if (user) {
      return io(SERVER_URL, {
        // query: { token: user.token }
      });
    }
    return null;
  }, [user]);

  // FIX 2: Make sure this says 'useState', NOT 'React.useState'
  const [isConnected, setIsConnected] = useState(socket?.connected || false);

  useEffect(() => {
    if (!socket) {
      setIsConnected(false);
      return;
    }

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
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    socket.on('error:game', (data: { message: string }) => {
      console.error('Server Game Error:', data.message);
    });

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