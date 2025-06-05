import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, UserMinus, Check, X, Search, Users } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface Friend {
  id: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
    status: string;
  };
  created_at: string;
}

interface FriendRequest {
  id: string;
  status: string;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  receiver?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

const FriendsPage = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<{
    incoming: FriendRequest[];
    outgoing: FriendRequest[];
  }>({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [addFriendUsername, setAddFriendUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);
  
  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch friends');
      
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setError('Failed to load friends');
    }
  };
  
  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/friends/requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch friend requests');
      
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      setError('Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  };
  
  const sendFriendRequest = async () => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: addFriendUsername }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send friend request');
      }
      
      setAddFriendUsername('');
      fetchRequests();
    } catch (error: any) {
      setError(error.message);
    }
  };
  
  const handleRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`/api/friends/request/${requestId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error(`Failed to ${action} friend request`);
      
      fetchFriends();
      fetchRequests();
    } catch (error) {
      console.error(`Error ${action}ing friend request:`, error);
      setError(`Failed to ${action} friend request`);
    }
  };
  
  const removeFriend = async (friendId: string) => {
    try {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to remove friend');
      
      fetchFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
      setError('Failed to remove friend');
    }
  };
  
  const filteredFriends = friends.filter(friend =>
    friend.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Friends</h1>
          <p className="text-slate-400">Manage your friends and friend requests</p>
        </div>
        
        <div className="mt-4 md:mt-0 w-full md:w-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Add friend by username..."
              value={addFriendUsername}
              onChange={(e) => setAddFriendUsername(e.target.value)}
              leftIcon={<UserPlus size={18} />}
              className="w-full sm:w-64"
            />
            <Button
              onClick={sendFriendRequest}
              disabled={!addFriendUsername}
              leftIcon={<UserPlus size={18} />}
            >
              Add Friend
            </Button>
          </div>
        </div>
      </motion.div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}
      
      {/* Friend Requests Section */}
      {(requests.incoming.length > 0 || requests.outgoing.length > 0) && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-white mb-4">Friend Requests</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Incoming Requests */}
            {requests.incoming.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-medium text-white mb-4">Incoming Requests</h3>
                <div className="space-y-4">
                  {requests.incoming.map((request) => (
                    <div key={request.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                          <Users size={20} className="text-orange-500" />
                        </div>
                        <div className="ml-3">
                          <p className="text-white font-medium">{request.sender?.username}</p>
                          <p className="text-sm text-slate-400">
                            Sent {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="primary"
                          leftIcon={<Check size={16} />}
                          onClick={() => handleRequest(request.id, 'accept')}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<X size={16} />}
                          onClick={() => handleRequest(request.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            
            {/* Outgoing Requests */}
            {requests.outgoing.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-medium text-white mb-4">Outgoing Requests</h3>
                <div className="space-y-4">
                  {requests.outgoing.map((request) => (
                    <div key={request.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                          <Users size={20} className="text-orange-500" />
                        </div>
                        <div className="ml-3">
                          <p className="text-white font-medium">{request.receiver?.username}</p>
                          <p className="text-sm text-slate-400">
                            Sent {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<X size={16} />}
                        onClick={() => handleRequest(request.id, 'cancel')}
                      >
                        Cancel
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Friends List Section */}
      <div className="mb-6">
        <Input
          placeholder="Search friends..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search size={18} />}
        />
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading friends..." />
        </div>
      ) : filteredFriends.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredFriends.map((friend) => (
            <motion.div key={friend.id} variants={itemVariants}>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                      <Users size={24} className="text-orange-500" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-white">{friend.user.username}</h3>
                      <p className="text-sm text-slate-400">
                        Friends since {new Date(friend.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<UserMinus size={16} />}
                    onClick={() => removeFriend(friend.id)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    friend.user.status === 'online' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {friend.user.status}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-slate-800">
          <Users size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-xl text-slate-300">No friends found</p>
          <p className="text-slate-400 mt-2">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Start adding friends to see them here'}
          </p>
        </div>
      )}
    </div>
  );
};

export default FriendsPage;