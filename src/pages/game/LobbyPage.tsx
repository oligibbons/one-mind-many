// src/pages/game/LobbyPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { RealtimeChannel } from '@supabase/realtime-js';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Check, Loader, User, Crown, X, Clipboard, LogOut, Shield, UserPlus } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ScenarioSelectionModal } from '../../components/lobby/ScenarioSelectionModal';
import { InviteFriendModal } from '../../components/lobby/InviteFriendModal';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Switch';
import { PlayerName } from '../../components/ui/PlayerName';
import { ChatBox } from '../../components/game/ChatBox';
import clsx from 'clsx';

// Expanded lobby state types
interface LobbyPlayer {
  user_id: string;
  username: string;
  is_ready: boolean;
  is_disconnected: boolean;
}
interface LobbyState {
  id: string;
  name: string;
  host_id: string;
  status: string;
  is_public: boolean;
  lobby_code: string | null;
  game_players: LobbyPlayer[];
  scenarios: {
    id: string;
    name: string;
    description: string;
  } | null;
}

export const LobbyPage: React.FC = () => {
  const { lobbyId } = useParams<{ lobbyId: string }>(); // This is the gameId
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { user, profile } = useAuth();
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const isHost = lobbyState?.host_id === user?.id;
  const myPlayerState = lobbyState?.game_players.find(
    (p) => p.user_id === user?.id,
  );

  // --- Main Effect for Socket & Realtime ---
  useEffect(() => {
    if (!lobbyId || !user) return;

    let realtimeChannel: RealtimeChannel;

    const fetchLobby = async () => {
      const { data, error } = await supabase
        .from('games')
        .select(
          `
          id,
          name,
          host_id,
          status,
          is_public,
          lobby_code,
          scenarios ( id, name, description ),
          game_players ( user_id, username, is_ready, is_disconnected )
        `,
        )
        .eq('id', lobbyId)
        .single();

      if (error || !data) {
        console.error('Error fetching lobby:', error);
        navigate('/app/lobbies', { replace: true });
        return;
      }
      
      if (data.status === 'active') {
        navigate(`/app/game/${lobbyId}`, { replace: true });
        return;
      }
      
      setLobbyState(data as LobbyState);
      setIsLoading(false);

      realtimeChannel = supabase
        .channel(`lobby:${lobbyId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq:${lobbyId}` },
          (payload) => {
            console.log('Realtime update for game received:', payload);
            if (payload.old.scenario_id !== payload.new.scenario_id) {
              fetchLobby();
            } else {
              setLobbyState((prev) => (prev ? { ...prev, ...(payload.new as any) } : null));
            }
          },
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'game_players', filter: `game_id=eq:${lobbyId}` },
          async () => {
            console.log('Realtime update for players received:');
            const { data: players, error } = await supabase
              .from('game_players')
              .select('user_id, username, is_ready, is_disconnected')
              .eq('game_id', lobbyId);
            
            if (players) {
              setLobbyState((prev) => (prev ? { ...prev, game_players: players } : null));
            }
          },
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
    
    const onGameStarting = () => {
      console.log('Game is starting! Navigating...');
      navigate(`/app/game/${lobbyId}`, { replace: true });
    };
    
    const onKicked = () => {
      alert('You have been kicked from the lobby.');
      navigate('/app/lobbies', { replace: true });
    };

    if(socket) {
      socket.on('game:starting', onGameStarting);
      socket.on('lobby:kicked', onKicked);
    }

    return () => {
      if(socket) {
        socket.off('game:starting', onGameStarting);
        socket.off('lobby:kicked', onKicked);
      }
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [socket, isConnected, lobbyId, user, navigate]);

  const handleReadyToggle = () => {
    if (!socket || !myPlayerState || !lobbyId) return;
    const newReadyState = !myPlayerState.is_ready;
    socket.emit('lobby:set_ready', {
      gameId: lobbyId,
      userId: user?.id,
      isReady: newReadyState,
    });
  };

  const handleStartGame = () => {
    if (!socket || !isHost || !lobbyId) return;
    socket.emit('lobby:start_game', { gameId: lobbyId });
  };
  
  const handleLeaveLobby = () => {
    navigate('/app/lobbies');
  };
  
  const handleKickPlayer = (kickUserId: string) => {
    if (!socket || !isHost || !lobbyId) return;
    if (window.confirm(`Are you sure you want to kick ${lobbyState?.game_players.find(p => p.user_id === kickUserId)?.username}?`)) {
      socket.emit('lobby:kick', { gameId: lobbyId, kickUserId });
    }
  };
  
  const handleCopyCode = () => {
    if (!lobbyState?.lobby_code) return;
    navigator.clipboard.writeText(lobbyState.lobby_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  if (isLoading || !lobbyState || !profile || !lobbyId) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-charcoal">
        <LoadingSpinner size="lg" />
        <p className="ml-4 text-xl text-brand-cream">Joining Lobby...</p>
      </div>
    )
  }

  const allReady = lobbyState.game_players.every(p => p.is_ready);
  const canStart = allReady && lobbyState.game_players.length >= 3 && lobbyState.game_players.length <= 6;

  return (
    <>
      {isScenarioModalOpen && (
        <ScenarioSelectionModal
          gameId={lobbyId}
          currentScenarioId={lobbyState.scenarios?.id || ''}
          onClose={() => setIsScenarioModalOpen(false)}
        />
      )}
      
      {isInviteModalOpen && (
        <InviteFriendModal
          gameId={lobbyId}
          lobbyName={lobbyState.name}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}

      <div className="mx-auto w-full max-w-5xl p-8">
        <h1 className="mb-2 text-4xl font-bold text-white">{lobbyState.name}</h1>
        <p className="mb-6 text-sm text-gray-400">
          Hosted by {lobbyState.game_players.find(p => p.user_id === lobbyState.host_id)?.username || '...'}
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Left Column: Players & Chat */}
          <div className="md:col-span-2 space-y-6">
            <Card className="game-card">
              <CardHeader>
                <CardTitle className="text-orange-400">Players ({lobbyState.game_players.length} / 6)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lobbyState.game_players.map((player) => {
                  const isTargetHost = player.user_id === lobbyState.host_id;
                  return (
                    <div key={player.user_id} className="flex items-center justify-between rounded-lg bg-brand-navy/50 p-3">
                      <div className="flex items-center">
                        <User size={16} className={clsx("mr-2", player.is_disconnected ? "text-red-500" : "text-gray-400")} />
                        
                        <PlayerName
                          player={{ userId: player.user_id, username: player.username }}
                          isHost={isHost}
                          isTargetHost={isTargetHost}
                          allowKick={true}
                          onKick={handleKickPlayer}
                          className={clsx("text-lg", player.is_disconnected ? "text-gray-500 italic" : "text-gray-200")}
                        />
                        
                        {player.is_disconnected && (
                          <span className="ml-2 text-xs text-red-400">(Disconnected)</span>
                        )}
                        {isTargetHost && (
                          <Crown size={16} className="ml-2 text-yellow-400" title="Host" />
                        )}
                      </div>
                      <div className="flex items-center gap-4">
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
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            
            <Card className="game-card h-96">
               <CardHeader>
                 <CardTitle className="text-orange-400">Lobby Chat</CardTitle>
               </CardHeader>
               <CardContent className="h-full pb-6 pr-0 pl-0">
                 {/* --- UPDATED: ChatBox with kick permissions --- */}
                 <ChatBox 
                  gameId={lobbyId}
                  allowKick={isHost}
                  onKick={handleKickPlayer}
                 />
               </CardContent>
            </Card>
          </div>

          {/* Right Column: Actions & Settings */}
          <div className="space-y-6">
            <Card className="game-card">
              <CardHeader>
                <CardTitle className="text-gray-200">Lobby Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full btn-secondary"
                  onClick={() => setIsInviteModalOpen(true)}
                  disabled={!isHost}
                  title={isHost ? "Invite a friend" : "Only the host can invite friends"}
                >
                  <UserPlus size={18} className="mr-2" />
                  Invite Friend
                </Button>
                
                {!lobbyState.is_public && lobbyState.lobby_code ? (
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Private Code</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={lobbyState.lobby_code}
                        className="flex-1 text-2xl font-bold tracking-widest text-center"
                      />
                      <Button variant="secondary" onClick={handleCopyCode} className="min-w-[80px]">
                        {copied ? <Check size={18} /> : <Clipboard size={18} />}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">This is a public lobby.</p>
                )}
              </CardContent>
            </Card>
          
            <Card className="game-card">
              <CardHeader>
                <CardTitle className="text-gray-200">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleReadyToggle}
                  className="w-full btn-lg"
                  variant={myPlayerState?.is_ready ? 'secondary' : 'default'}
                >
                  {myPlayerState?.is_ready ? 'Set Not Ready' : 'Set Ready'}
                </Button>
                
                {isHost && (
                  <Button
                    onClick={handleStartGame}
                    className="w-full game-button btn-lg"
                    disabled={!canStart}
                    title={!canStart ? 'All players must be ready (min 3, max 6)' : 'Start the game'}
                  >
                    Start Game
                  </Button>
                )}
                
                <Button onClick={handleLeaveLobby} variant="outline" className="w-full btn-outline">
                  <LogOut size={16} className="mr-2" />
                  Leave Lobby
                </Button>
              </CardContent>
            </Card>
            
            {isHost && (
              <Card className="game-card">
                <CardHeader>
                  <CardTitle className="text-orange-400">Host Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-1">
                      <Label className="text-sm text-gray-400">Scenario</Label>
                      <div className="flex items-center gap-2 text-brand-cream">
                        <Shield size={18} />
                        <span className="text-lg font-medium">{lobbyState.scenarios?.name || 'Loading...'}</span>
                      </div>
                   </div>
                   <Button 
                    className="w-full btn-secondary"
                    onClick={() => setIsScenarioModalOpen(true)}
                   >
                     Change Scenario
                   </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};