// src/pages/game/LobbyPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient'; // Your existing Supabase client
import { RealtimeChannel } from '@supabase/realtime-js';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Check, Loader, User, Crown } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface LobbyPlayer {
  id: string;
  user_id: string;
  username: string;
  is_ready: boolean;
}
interface LobbyState {
  id: string;
  host_id: string;
  status: string;
  game_players: LobbyPlayer[];
}

export const LobbyPage: React.FC = () => {
  const { lobbyId } = useParams<{ lobbyId: string }>(); // This is the gameId
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isHost = lobbyState?.host_id === user?.id;
  const myPlayerState = lobbyState?.game_players.find(
    (p) => p.user_id === user?.id
  );

  // --- Main Effect for Socket & Realtime ---
  useEffect(() => {
    if (!socket || !isConnected || !lobbyId || !user) return;

    let realtimeChannel: RealtimeChannel;

    // Fetch the initial lobby state
    const fetchLobby = async () => {
      const { data, error } = await supabase
        .from('games')
        .select(
          `
          id,
          host_id,
          status,
          game_players ( id, user_id, username, is_ready )
        `
        )
        .eq('id', lobbyId)
        .single();

      if (error || !data) {
        console.error('Error fetching lobby:', error);
        navigate('/menu');
        return;
      }
      
      setLobbyState(data as LobbyState);
      setIsLoading(false);

      // --- Setup Supabase Realtime ---
      // Listen for changes in the 'game_players' table for this game
      realtimeChannel = supabase
        .channel(`lobby:${lobbyId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_players',
            filter: `game_id=eq:${lobbyId}`,
          },
          (payload) => {
            console.log('Realtime update received:', payload);
            // Re-fetch the lobby state on any change
            fetchLobby();
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to lobby realtime channel');
          }
          if (err) {
            console.error('Realtime subscription error:', err);
          }
        });
    };

    fetchLobby();
    
    // --- Setup Socket Listeners ---
    // Listen for the server forcing the game to start
    const onGameStarting = () => {
      console.log('Game is starting! Navigating...');
      navigate(`/game/${lobbyId}`);
    };
    
    socket.on('game:starting', onGameStarting);

    // Cleanup
    return () => {
      socket.off('game:starting', onGameStarting);
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [socket, isConnected, lobbyId, user, navigate]);

  const handleReadyToggle = () => {
    if (!socket || !myPlayerState) return;
    const newReadyState = !myPlayerState.is_ready;
    socket.emit('lobby:set_ready', {
      gameId: lobbyId,
      userId: user?.id,
      isReady: newReadyState,
    });
  };

  const handleStartGame = () => {
    if (!socket || !isHost) return;
    socket.emit('lobby:start_game', { gameId: lobbyId });
  };
  
  if (isLoading || !lobbyState) {
    return <div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>
  }

  const allReady = lobbyState.game_players.every(p => p.is_ready);
  const canStart = allReady && lobbyState.game_players.length >= 3 && lobbyState.game_players.length <= 6;

  return (
    <div className="mx-auto w-full max-w-3xl p-8">
      <h1 className="mb-2 text-3xl font-bold text-white">Lobby Room</h1>
      <p className="mb-6 text-sm text-gray-400">ID: {lobbyId}</p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Player List */}
        <Card className="border-gray-700 bg-gray-800 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-orange-400">Players ({lobbyState.game_players.length} / 6)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lobbyState.game_players.map((player) => (
              <div key={player.id} className="flex items-center justify-between rounded-lg bg-gray-700/50 p-3">
                <div className="flex items-center">
                  <User size={16} className="mr-2 text-gray-400" />
                  <span className="font-medium text-gray-200">{player.username}</span>
                  {player.user_id === lobbyState.host_id && (
                    <Crown size={16} className="ml-2 text-yellow-400" title="Host" />
                  )}
                </div>
                {player.is_ready ? (
                  <span className="flex items-center text-xs font-bold text-green-400">
                    <Check size={16} className="mr-1" />
                    Ready
                  </span>
                ) : (
                  <span className="flex items-center text-xs font-medium text-gray-400">
                    <Loader size={16} className="mr-1 animate-spin" />
                    Waiting
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="border-gray-700 bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-200">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleReadyToggle}
              className="w-full"
              variant={myPlayerState?.is_ready ? 'secondary' : 'default'}
            >
              {myPlayerState?.is_ready ? 'Set Not Ready' : 'Set Ready'}
            </Button>
            
            {isHost && (
              <Button
                onClick={handleStartGame}
                className="w-full"
                disabled={!canStart}
                title={!canStart ? 'All players must be ready (min 3, max 6)' : 'Start the game'}
              >
                Start Game
              </Button>
            )}
            
            <Button as={Link} to="/menu" variant="outline" className="w-full">
              Leave Lobby
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};