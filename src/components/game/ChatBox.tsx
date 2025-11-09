// src/components/game/ChatBox.tsx

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Send, AlertTriangle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import clsx from 'clsx';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: string;
  isSystem?: boolean;
}

interface ChatBoxProps {
  gameId: string;
  allowKick: boolean; // Prop from your GamePage
}

export const ChatBox: React.FC<ChatBoxProps> = ({ gameId, allowKick }) => {
  const { socket, isConnected } = useSocket();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket listeners for chat
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Handler for receiving a single new message
    const onMessage = (newMessage: ChatMessage) => {
      // Add M.O.P. branding to system messages
      if (newMessage.isSystem) {
        newMessage.username = 'M.O.P. CONTROL';
      }
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    // Handler for receiving full message history (on join)
    const onChatHistory = (history: ChatMessage[]) => {
      const formattedHistory = history.map(msg => {
        if (msg.isSystem) msg.username = 'M.O.P. CONTROL';
        return msg;
      });
      setMessages(formattedHistory);
    };

    socket.on('chat:message', onMessage);
    socket.on('chat:history', onChatHistory);
    
    // Join the chat room for this game
    socket.emit('chat:join', { gameId });

    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:history', onChatHistory);
      socket.emit('chat:leave', { gameId });
    };
  }, [socket, isConnected, gameId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() === '' || !socket) return;

    if (!user || !profile) {
      toast({
        title: 'Error',
        description: 'You must be logged in to chat.',
        variant: 'destructive',
      });
      return;
    }

    // Send message to server
    socket.emit('chat:send', {
      gameId,
      message,
    });

    setMessage('');
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-800/50 rounded-lg overflow-hidden">
      {!isConnected && (
        <div className="p-2 bg-red-800 text-white text-center flex items-center justify-center">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span>Chat connection lost...</span>
        </div>
      )}
      
      {/* Message List */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span
                className={clsx(
                  "font-bold text-sm",
                  msg.isSystem ? "text-orange-400" : "text-gray-300"
                )}
              >
                {msg.username}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-gray-200 text-sm break-words whitespace-pre-wrap">
              {msg.message}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="flex p-3 border-t border-gray-700">
        <Input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 text-sm bg-gray-700 border-gray-600"
          disabled={!isConnected}
        />
        <Button 
          type="submit" 
          variant="ghost" 
          size="sm" 
          className="ml-2"
          disabled={!isConnected || message.trim() === ''}
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
};