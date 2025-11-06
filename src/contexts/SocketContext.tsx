// src/contexts/SocketContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { usePresenceStore } from '../stores/usePresenceStore';

// Define the shape of the server-side presence state
interface PresenceState {
  [userId: string]: 'Online' | 'Offline' | 'In-Game';
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Get server URL from environment variables
const serverUrl =
  import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const SocketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // FIX: 'profile' is inside 'user'. Get 'user' from useAuth.
  const { user } = useAuth(); 
  
  const { setAllFriends } = usePresenceStore();

  useEffect(() => {
    // FIX: Check for user AND user.profile before connecting
    if (user && user.profile) {
      const newSocket = io(serverUrl, {
        auth: {
          userId: user.id,
          username: user.profile.username, // FIX: Use user.profile
          profile: user.profile, // FIX: Pass user.profile
        },
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      // --- Presence Listener ---
      // This event is emitted by the server on connect and when any status changes
      newSocket.on('presence:state', (state: PresenceState) => {
        console.log('Received presence state:', state);
        setAllFriends(state);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      setSocket(newSocket);

      // Disconnect socket on cleanup
      return () => {
        console.log('Disconnecting socket...');
        newSocket.disconnect();
        setIsConnected(false);
        setSocket(null);
      };
    } else {
      // If no user, ensure socket is disconnected and state is cleared
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  // FIX: The dependency array should be just [user]
  }, [user, setAllFriends]); 

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};