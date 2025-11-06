import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { InviteToast } from '../components/ui/InviteToast';
import { usePresenceStore } from '../stores/usePresenceStore';

interface SocketContextProps {
  socket: Socket | null;
}

// --- THIS IS THE FIX ---
// Added the 'export' keyword so other files can import this context
export const SocketContext = createContext<SocketContextProps | undefined>(
  undefined
);
// --- END OF FIX ---

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user, token } = useAuth();
  const { setOnlineUsers } = usePresenceStore();

  useEffect(() => {
    if (user && token) {
      // Establish socket connection
      const newSocket = io(
        import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001',
        {
          auth: {
            token: token,
          },
          autoConnect: true,
        }
      );

      setSocket(newSocket);

      // --- Connection Listeners ---
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
      });

      // --- Custom Listeners ---

      // Handle game/lobby invites
      newSocket.on('receive_invite', ({ fromUser, lobbyCode, gameId }) => {
        toast(
          <InviteToast fromUser={fromUser} lobbyCode={lobbyCode} gameId={gameId} />,
          {
            autoClose: 10000,
            theme: 'dark',
          }
        );
      });

      // Handle presence updates
      newSocket.on('update_presence', (onlineUsers: string[]) => {
        setOnlineUsers(onlineUsers);
      });

      // --- Error Handlers ---
      newSocket.on('error', (message: string) => {
        toast.error(message, { theme: 'dark' });
      });

      // Clean up on unmount
      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    } else if (socket) {
      // User logged out, disconnect socket
      socket.disconnect();
      setSocket(null);
    }
  }, [user, token, setOnlineUsers]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};