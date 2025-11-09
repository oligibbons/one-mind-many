// src/pages/game/LobbyPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { InviteFriendModal } from '../../components/lobby/InviteFriendModal';
import { ScenarioSelectionModal } from '../../components/lobby/ScenarioSelectionModal';
import {
  Users, User, Check, X, LogOut, Send, Settings, CheckSquare,
  Square, AlertTriangle, Copy, Shield, Crown,
} from 'lucide-react';
import { Lobby, Player, Scenario } from '../../types/game';
import clsx from 'clsx';
import { useToast } from '../../hooks/useToast';

// This page is now fully functional and state-driven

export const LobbyPage: React.FC = () => {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);

  const isHost = lobby?.host_id === user?.id;
  const canStartGame = isHost && players.every(p => p.is_ready) && players.length >= 3; // Example: min 3 players

  // --- Socket Event Handlers ---

  const onLobbyState = useCallback((lobbyData: Lobby, playersData: Player[], scenarioData: Scenario) => {
    setLobby(lobbyData);
    setPlayers(playersData);
    setScenario(scenarioData);
    setLoading(false);
    setError(null);
  }, []);

  const onPlayerJoined = useCallback((player: Player) => {
    setPlayers(prev => [...prev, player]);
    toast({ title: `${player.username} joined the lobby.` });
  }, [toast]);

  const onPlayerLeft = useCallback((userId: string, username: string) => {
    setPlayers(prev => prev.filter(p => p.user_id !== userId));
    toast({ title: `${username} left the lobby.`, variant: 'destructive' });
  }, [toast]);

  const onPlayerReady = useCallback((userId: string, isReady: boolean) => {
    setPlayers(prev => prev.map(p => (p.user_id === userId ? { ...p, is_ready: isReady } : p)));
  }, []);

  const onLobbyUpdate = useCallback((lobbyData: Lobby) => {
    setLobby(lobbyData);
  }, []);

  const onScenarioUpdate = useCallback((scenarioData: Scenario) => {
    setScenario(scenarioData);
    toast({ title: 'Scenario Updated', description: `Host changed scenario to "${scenarioData.name}".` });
  }, [toast]);

  const onHostChanged = useCallback((newHostId: string, newHostUsername: string) => {
    setLobby(prev => (prev ? { ...prev, host_id: newHostId } : null));
    toast({ title: 'Host Changed', description: `${newHostUsername} is the new host.` });
  }, [toast]);

  const onLobbyError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    toast({ title: 'Lobby Error', description: errorMessage, variant: 'destructive' });
  }, [toast]);

  const onGameStarted = useCallback((gameId: string) => {
    toast({ title: 'Game Starting!', description: 'Strap in, Agent...' });
    navigate(`/game/${gameId}`);
  }, [navigate, toast]);

  // --- Socket Connection Management ---

  useEffect(() => {
    if (!socket || !lobbyId || !user) return;

    // Join the lobby
    socket.emit('lobby:join', lobbyId, (success: boolean, message: string | { lobby: Lobby, players: Player[], scenario: Scenario }) => {
      if (success && typeof message !== 'string') {
        onLobbyState(message.lobby, message.players, message.scenario);
      } else {
        setError(message as string);
        setLoading(false);
        toast({ title: 'Failed to join lobby', description: message as string, variant: 'destructive' });
        navigate('/lobbies');
      }
    });

    // Register listeners
    socket.on('lobby:state', onLobbyState);
    socket.on('lobby:player_joined', onPlayerJoined);
    socket.on('lobby:player_left', onPlayerLeft);
    socket.on('lobby:player_ready', onPlayerReady);
    socket.on('lobby:updated', onLobbyUpdate);
    socket.on('lobby:scenario_updated', onScenarioUpdate);
    socket.on('lobby:host_changed', onHostChanged);
    socket.on('lobby:error', onLobbyError);
    socket.on('game:started', onGameStarted);

    // Cleanup
    return () => {
      socket.emit('lobby:leave', lobbyId);
      socket.off('lobby:state', onLobbyState);
      socket.off('lobby:player_joined', onPlayerJoined);
      socket.off('lobby:player_left', onPlayerLeft);
      socket.off('lobby:player_ready', onPlayerReady);
      socket.off('lobby:updated', onLobbyUpdate);
      socket.off('lobby:scenario_updated', onScenarioUpdate);
      socket.off('lobby:host_changed', onHostChanged);
      socket.off('lobby:error', onLobbyError);
      socket.off('game:started', onGameStarted);
    };
  }, [socket, lobbyId, user, navigate, toast, onLobbyState, onPlayerJoined, onPlayerLeft, onPlayerReady, onLobbyUpdate, onScenarioUpdate, onHostChanged, onLobbyError, onGameStarted]);

  // --- User Actions ---

  const handleLeaveLobby = () => {
    navigate('/lobbies'); // Socket cleanup will handle emission
  };

  const handleSetReady = () => {
    const me = players.find(p => p.user_id === user?.id);
    if (me && socket) {
      socket.emit('lobby:set_ready', lobbyId, !me.is_ready);
    }
  };

  const handleStartGame = () => {
    if (canStartGame && socket) {
      socket.emit('lobby:start_game', lobbyId);
    }
  };

  const handleScenarioChange = async (scenarioId: string) => {
    if (socket && isHost) {
      socket.emit('lobby:set_scenario', lobbyId, scenarioId);
    }
    setIsScenarioModalOpen(false);
  };
  
  const copyLobbyCode = () => {
    if (lobby?.lobby_code) {
      navigator.clipboard.writeText(lobby.lobby_code);
      toast({ title: 'Lobby Code Copied!' });
    }
  };

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg text-gray-300">Joining Lobby...</p>
      </div>
    );
  }

  if (error || !lobby || !scenario) {
    return (
      <div className="flex justify-center items-center min-h-full p-4">
        <Card className="game-card bg-red-900/30 border-red-700 text-red-300 p-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-4 text-2xl font-bold">Lobby Error</h3>
          <p className="mt-2">{error || 'Could not load lobby data.'}</p>
          <Button variant="outline" onClick={() => navigate('/lobbies')} className="mt-4 btn-outline">
            Back to Lobbies
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Scenario & Lobby Info */}
        <div className="lg:col-span-2">
          <Card className="game-card">
            <CardHeader>
              <CardTitle className="game-title text-4xl">{scenario.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-lg mb-6">{scenario.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Prophecy */}
                <Card className="game-stat">
                  <CardHeader className="flex flex-row items-center space-x-3 p-0 pb-2">
                    <Shield className="w-6 h-6 text-green-400" />
                    <h4 className="text-xl font-semibold text-white">Main Prophecy</h4>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-gray-400">{scenario.mainProphecy.description}</p>
                  </CardContent>
                </Card>

                {/* Doomsday Condition */}
                <Card className="game-stat">
                  <CardHeader className="flex flex-row items-center space-x-3 p-0 pb-2">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    <h4 className="text-xl font-semibold text-white">Doomsday Condition</h4>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-gray-400">{scenario.doomsdayCondition.description}</p>
                  </CardContent>
                </Card>
              </div>

              {isHost && (
                <Button 
                  variant="outline" 
                  className="btn-outline mt-6"
                  onClick={() => setIsScenarioModalOpen(true)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Change Scenario
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Players & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="game-card">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Players ({players.length} / 6)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {players.map(player => (
                <div 
                  key={player.user_id} 
                  className={clsx(
                    "flex items-center justify-between p-3 rounded-lg",
                    player.user_id === user?.id ? "bg-orange-900/50" : "bg-gray-800/60"
                  )}
                >
                  <div className="flex items-center">
                    {player.is_ready ? (
                      <Check className="w-5 h-5 text-green-400 mr-2" />
                    ) : (
                      <X className="w-5 h-5 text-red-400 mr-2" />
                    )}
                    <span className="font-semibold text-white">{player.username}</span>
                  </div>
                  {player.user_id === lobby.host_id && (
                    <Crown className="w-5 h-5 text-orange-400" title="Host" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="game-card">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Lobby Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isHost ? (
                <Button
                  onClick={handleStartGame}
                  disabled={!canStartGame}
                  className="w-full game-button text-lg"
                  title={!canStartGame ? (players.length < 3 ? 'Need at least 3 players' : 'All players must be ready') : 'Start the game!'}
                >
                  {players.length < 3 ? 'Need 3+ Players' : 'Start Game'}
                </Button>
              ) : (
                <Button
                  onClick={handleSetReady}
                  variant={players.find(p => p.user_id === user?.id)?.is_ready ? "secondary" : "game"}
                  className="w-full game-button text-lg"
                >
                  {players.find(p => p.user_id === user?.id)?.is_ready ? (
                    <><X className="mr-2 h-5 w-5" /> Not Ready</>
                  ) : (
                    <><Check className="mr-2 h-5 w-5" /> Set Ready</>
                  )}
                </Button>
              )}
              
              <Button 
                variant="primary" 
                className="w-full btn-secondary" // Using secondary style
                onClick={() => setIsInviteModalOpen(true)}
              >
                <Send className="mr-2 h-4 w-4" />
                Invite Friend
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full btn-outline"
                onClick={copyLobbyCode}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Lobby Code: {lobby.lobby_code}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleLeaveLobby}
                className="w-full btn-outline border-red-500 text-red-400 hover:bg-red-900/50 hover:text-red-300"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Leave Lobby
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <InviteFriendModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        lobbyId={lobby.id}
        lobbyCode={lobby.lobby_code}
      />
      <ScenarioSelectionModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        currentScenarioId={scenario.id}
        onSelectScenario={handleScenarioChange}
      />
    </div>
  );
};

export default LobbyPage;