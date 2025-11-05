// src/components/game/ChatBox.tsx

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth';
import { useGameStore } from '../../stores/useGameStore'; // <-- NEW
import { usePlayerContextStore } from '../../stores/usePlayerContextStore'; // <-- NEW
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Send, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { PlayerName } from '../ui/PlayerName'; // <-- NEW
import clsx from 'clsx';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
}

interface ChatBoxProps {
  gameId: string;
  allowKick?: boolean; // <-- NEW: Allow kicking from this chat?
  onKick?: (userId: string) => void; // <-- NEW: Kick handler
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  gameId,
  allowKick = false,
  onKick,
}) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { isMuted } = usePlayerContextStore(); // <-- NEW: Mute store
  const hostId = useGameStore((state) => state.publicState?.hostId); // <-- NEW: Get hostId
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isHost = user?.id === hostId; // <-- NEW: Check if I am host

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (!socket) return;

    // Handler for receiving a new message
    const onMessageReceived = (message: ChatMessage) => {
      // --- NEW: Mute check ---
      if (isMuted(message.userId)) {
        return;
      }
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    const onChatHistory = (history: ChatMessage[]) => {
      // --- NEW: Filter history on load ---
      setMessages(history.filter((msg) => !isMuted(msg.userId)));
    };

    socket.on('chat:message_received', onMessageReceived);
    socket.on('chat:history', onChatHistory);

    // TODO: Request history on join
    // socket.emit('chat:get_history', { gameId });

    return () => {
      socket.off('chat:message_received', onMessageReceived);
      socket.off('chat:history', onChatHistory);
    };
  }, [socket, gameId, isMuted]); // <-- NEW: Add isMuted dependency

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!socket || !newMessage.trim()) return;

    setError(null);
    socket.emit(
      'chat:send_message',
      { gameId, message: newMessage },
      (response: { status: 'ok' } | { status: 'error'; message: string }) => {
        if (response.status === 'ok') {
          setNewMessage('');
        } else {
          setError(response.message);
        }
      },
    );
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-700 bg-brand-navy/30">
      <div className="flex-1 space-y-3 overflow-y-auto p-3 custom-scrollbar">
        {messages.map((msg) => {
          const isMe = msg.userId === user?.id;
          return (
            <div
              key={msg.id}
              className={clsx('flex flex-col', isMe ? 'items-end' : 'items-start')}
            >
              <div
                className={clsx(
                  'max-w-xs rounded-lg px-3 py-2 md:max-w-sm',
                  isMe
                    ? 'bg-brand-orange text-white'
                    : 'bg-brand-navy/60 text-brand-cream',
                )}
              >
                <div className="flex items-baseline gap-2">
                  {!isMe && (
                    // --- NEW: Use PlayerName component ---
                    <PlayerName
                      player={{ userId: msg.userId, username: msg.username }}
                      isHost={isHost}
                      allowKick={allowKick}
                      onKick={onKick}
                      className="text-sm font-bold text-orange-300"
                    />
                  )}
                  <span className="text-xs text-gray-400">
                    {format(new Date(msg.timestamp), 'h:mm a')}
                  </span>
                </div>
                <p className="whitespace-pre-wrap break-words">{msg.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-700 p-3">
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          maxLength={256}
        />
        <Button type="submit" className="game-button" disabled={!newMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
      {error && (
        <div className="flex items-center gap-2 p-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
};