// src/pages/game/FriendsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { usePresenceStore } from '../../stores/usePresenceStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { User, UserPlus, Send, Check, X, AlertCircle, Mail, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

// Types to match your friends.js API
interface FriendUser {
  id: string;
  username: string;
  avatar_url: string | null;
  status: 'Online' | 'Offline' | 'In-Game';
}
interface FriendData {
  id: string; // friendship_id
  user: FriendUser;
  created_at: string;
}
interface IncomingRequest {
  id: string; // request_id
  sender: FriendUser;
}
interface OutgoingRequest {
  id: string; // request_id
  receiver: FriendUser;
}

type Tab = 'friends' | 'requests' | 'add';

export const FriendsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getFriendStatus } = usePresenceStore();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        api.get('/friends'),
        api.get('/friends/requests'),
      ]);
      setFriends(friendsRes.data);
      setIncoming(requestsRes.data.incoming);
      setOutgoing(requestsRes.data.outgoing);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load friend data.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRemoveFriend = async (friendshipId: string, friendUsername: string) => {
    if (window.confirm(`Are you sure you want to remove ${friendUsername}?`)) {
      try {
        await api.delete(`/friends/${friendshipId}`);
        fetchData(); // Refresh all data
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to remove friend.');
      }
    }
  };

  const handleRequestResponse = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      // Your API uses /accept and /reject endpoints
      await api.post(`/friends/request/${requestId}/${action}`);
      fetchData(); // Refresh all data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to respond to request.');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await api.delete(`/friends/request/${requestId}`);
      fetchData(); // Refresh all data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel request.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl p-8">
      <h1 className="mb-6 text-5xl font-bold game-title">Friends</h1>
      
      {/* Tab Navigation */}
      <div className="mb-6 flex border-b border-gray-700">
        <TabButton id="friends" label="My Friends" icon={User} activeTab={tab} setTab={setTab} />
        <TabButton id="requests" label="Pending Requests" icon={Mail} activeTab={tab} setTab={setTab} count={incoming.length} />
        <TabButton id="add" label="Add Friend" icon={UserPlus} activeTab={tab} setTab={setTab} />
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-red-700 bg-red-900/30 p-3 text-red-300">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div>
          {tab === 'friends' && <FriendsList friends={friends} getStatus={getFriendStatus} onRemove={handleRemoveFriend} />}
          {tab === 'requests' && <RequestsList incoming={incoming} outgoing={outgoing} onRespond={handleRequestResponse} onCancel={handleCancelRequest} />}
          {tab === 'add' && <AddFriendForm onSent={fetchData} />}
        </div>
      )}
    </div>
  );
};

// --- Tab Button Component ---
interface TabButtonProps {
  id: Tab;
  label: string;
  icon: React.ElementType;
  activeTab: Tab;
  setTab: (tab: Tab) => void;
  count?: number;
}
const TabButton: React.FC<TabButtonProps> = ({ id, label, icon: Icon, activeTab, setTab, count }) => (
  <button
    onClick={() => setTab(id)}
    className={clsx(
      "flex items-center gap-2 px-6 py-3 font-medium text-lg border-b-2 transition-colors",
      activeTab === id
        ? 'border-brand-orange text-brand-orange'
        : 'border-transparent text-gray-400 hover:text-gray-200'
    )}
  >
    <Icon className="h-5 w-5" />
    <span>{label}</span>
    {count && count > 0 && (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-orange text-xs font-bold text-white">
        {count}
      </span>
    )}
  </button>
);

// --- Friends List Component ---
interface FriendsListProps {
  friends: FriendData[];
  getStatus: (userId: string) => FriendStatus;
  onRemove: (friendshipId: string, username: string) => void;
}
const FriendsList: React.FC<FriendsListProps> = ({ friends, getStatus, onRemove }) => {
  if (friends.length === 0) {
    return <p className="text-gray-400">Your friends list is empty. Go to the "Add Friend" tab to find friends.</p>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {friends.map(({ id: friendshipId, user }) => {
        const status = getStatus(user.id);
        return (
          <Card key={friendshipId} className="game-card flex items-center justify-between p-4">
            <div className="flex items-center">
              <span className="relative mr-3">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} className="h-12 w-12 rounded-full" />
                ) : (
                  <User className="h-12 w-12 rounded-full bg-brand-navy p-2 text-gray-400" />
                )}
                <span className={clsx(
                  "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-brand-navy",
                  status === 'Online' ? 'bg-green-400' : 'bg-gray-600'
                )} />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-brand-cream">{user.username}</h3>
                <p className={clsx("text-sm", status === 'Online' ? 'text-green-400' : 'text-gray-500')}>{status}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onRemove(friendshipId, user.username)} title="Remove Friend">
              <X className="h-5 w-5 text-red-400 hover:text-red-300" />
            </Button>
          </Card>
        );
      })}
    </div>
  );
};

// --- Requests List Component ---
interface RequestsListProps {
  incoming: IncomingRequest[];
  outgoing: OutgoingRequest[];
  onRespond: (requestId: string, action: 'accept' | 'reject') => void;
  onCancel: (requestId: string) => void;
}
const RequestsList: React.FC<RequestsListProps> = ({ incoming, outgoing, onRespond, onCancel }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card className="game-card">
      <CardHeader>
        <CardTitle className="text-orange-400">Incoming ({incoming.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {incoming.length === 0 ? <p className="text-gray-400">No incoming requests.</p> : null}
        {incoming.map(({ id, sender }) => (
          <div key={id} className="rounded-lg bg-brand-navy/50 p-3">
            <h3 className="font-semibold text-brand-cream">{sender.username}</h3>
            <div className="mt-2 flex gap-2">
              <Button size="sm" className="btn-primary" onClick={() => onRespond(id, 'accept')}>
                <Check className="h-4 w-4 mr-1" /> Accept
              </Button>
              <Button size="sm" className="btn-secondary" onClick={() => onRespond(id, 'reject')}>
                <X className="h-4 w-4 mr-1" /> Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
    <Card className="game-card">
      <CardHeader>
        <CardTitle className="text-orange-400">Outgoing ({outgoing.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {outgoing.length === 0 ? <p className="text-gray-400">No outgoing requests.</p> : null}
        {outgoing.map(({ id, receiver }) => (
          <div key={id} className="flex items-center justify-between rounded-lg bg-brand-navy/50 p-3">
            <h3 className="font-semibold text-brand-cream">{receiver.username}</h3>
            <Button size="sm" variant="outline" className="btn-outline" onClick={() => onCancel(id)}>
              Cancel
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

// --- Add Friend Form Component ---
const AddFriendForm: React.FC<{ onSent: () => void }> = ({ onSent }) => {
  const [username, setUsername] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/friends/request', { username });
      setSuccess(response.data.message);
      setUsername('');
      onSent(); // Refresh lists on parent
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send request.');
    }
    setIsSending(false);
  };

  return (
    <Card className="game-card max-w-lg">
      <CardHeader>
        <CardTitle className="text-orange-400">Send Friend Request</CardTitle>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username..."
              className="flex-1 text-lg"
              disabled={isSending}
            />
            <Button type="submit" className="game-button" disabled={isSending || !username}>
              {isSending ? <LoadingSpinner /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
          {success && <p className="mt-3 text-green-400">{success}</p>}
          {error && <p className="mt-3 text-red-400">{error}</p>}
        </CardContent>
      </CardHeader>
    </Card>
  );
};