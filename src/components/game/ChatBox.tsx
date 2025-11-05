// src/components/game/ChatBox.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth';
import { useGameStore } from '../../stores/useGameStore';
import { Input } from '../ui/Input'; // Your existing Input
import { Button } from '../ui/Button'; // Your existing Button
import { Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  isSystem?: boolean;
}

interface ChatBoxProps {
  gameId: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ gameId }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const myUsername =
    useGameStore((s) => s.privateState?.username) || user?.email;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Socket Listeners for Chat ---
  useEffect(() => {
    if (!socket) return;

    // Fired when a new chat message comes from the server
    const onReceiveMessage = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    };

    // Fired when a player joins/leaves (system message)
    const onPlayerJoined = (data: { username: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          username: 'SYSTEM',
          message: `${data.username} has joined.`,
          isSystem: true,
        },
      ]);
    };

    const onPlayerLeft = (data: { username?: string }) => {
      if (!data.username) return; // Don't log anonymous disconnects
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          username: 'SYSTEM',
          message: `${data.username} has left.`,
          isSystem: true,
        },
      ]);
    };

    socket.on('chat:receive', onReceiveMessage);
    socket.on('game:player_joined', onPlayerJoined);
    socket.on('game:player_left', onPlayerLeft);

    return () => {
      socket.off('chat:receive', onReceiveMessage);
      socket.off('game:player_joined', onPlayerJoined);
      socket.off('game:player_left', onPlayerLeft);
    };
  }, [socket]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !myUsername || newMessage.trim() === '') return;

    const messageData: ChatMessage = {
      id: crypto.randomUUID(),
      username: myUsername,
      message: newMessage.trim(),
    };

    // Send to server
    socket.emit('chat:send', { gameId, message: messageData });

    // Add our own message to the list immediately (optimistic update)
    setMessages((prev) => [...prev, messageData]);
    setNewMessage('');
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-700 bg-gray-900/50">
      <div className="border-b border-gray-700 p-3">
        <h4 className="font-semibold text-gray-200">Player Chat</h4>
      </div>

      {/* Message List */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            {msg.isSystem ? (
              <p className="text-gray-500 italic">...{msg.message}...</p>
            ) : (
              <p>
                <span
                  className={clsx(
                    'font-bold',
                    msg.username === myUsername
                      ? 'text-orange-400'
                      : 'text-gray-400'
                  )}
                >
                  {msg.username}:
                </span>{' '}
                <span className="text-gray-200">{msg.message}</span>
              </p>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex border-t border-gray-700 p-2">
        <Input
          type="text"
          placeholder="Trust no one..."
          className="flex-1 border-gray-700 bg-gray-800 text-gray-200"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <Button type="submit" variant="ghost" size="icon" className="ml-2">
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
};