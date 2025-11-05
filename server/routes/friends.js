import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get friend list
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get friends where user is either user_id1 or user_id2
    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        user_id1,
        user_id2,
        created_at,
        user1:user_id1(id, username, avatar_url, status),
        user2:user_id2(id, username, avatar_url, status)
      `)
      .or(`user_id1.eq.${userId},user_id2.eq.${userId}`);
    
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    
    // Format friends list to show the other user
    const formattedFriends = data.map(friend => {
      const isUser1 = friend.user_id1 === userId;
      const otherUser = isUser1 ? friend.user2 : friend.user1;
      
      return {
        id: friend.id,
        user: {
          id: otherUser.id,
          username: otherUser.username,
          avatar_url: otherUser.avatar_url,
          status: otherUser.status
        },
        created_at: friend.created_at
      };
    });
    
    return res.status(200).json(formattedFriends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    return res.status(500).json({ message: 'An error occurred while fetching friends' });
  }
});

// Send friend request
router.post('/request', async (req, res) => {
  try {
    const { username } = req.body;
    const senderId = req.user.id;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    // Find user by username
    const { data: receiverData, error: receiverError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', username)
      .single();
    
    if (receiverError) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const receiverId = receiverData.id;
    
    // Prevent sending request to self
    if (senderId === receiverId) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }
    
    // Check if they are already friends
    const { count: friendCount, error: friendError } = await supabase
      .from('friends')
      .select('*', { count: 'exact' })
      .or(`and(user_id1.eq.${senderId},user_id2.eq.${receiverId}),and(user_id1.eq.${receiverId},user_id2.eq.${senderId})`);
    
    if (friendError) {
      return res.status(500).json({ message: friendError.message });
    }
    
    if (friendCount > 0) {
      return res.status(400).json({ message: 'You are already friends with this user' });
    }
    
    // Check if request already exists
    const { data: existingRequest, error: requestError } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
      .eq('status', 'pending')
      .single();
    
    if (existingRequest) {
      if (existingRequest.sender_id === senderId) {
        return res.status(400).json({ message: 'Friend request already sent' });
      } else {
        return res.status(400).json({ message: 'This user has already sent you a friend request' });
      }
    }
    
    // Create friend request
    const { data, error } = await supabase
      .from('friend_requests')
      .insert([{
        sender_id: senderId,
        receiver_id: receiverId,
        status: 'pending'
      }])
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    
    return res.status(201).json({
      message: 'Friend request sent successfully',
      request: data
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return res.status(500).json({ message: 'An error occurred while sending friend request' });
  }
});

// Get pending friend requests
router.get('/requests', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get incoming requests
    const { data: incomingRequests, error: incomingError } = await supabase
      .from('friend_requests')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        sender:sender_id(id, username, avatar_url)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending');
    
    if (incomingError) {
      return res.status(500).json({ message: incomingError.message });
    }
    
    // Get outgoing requests
    const { data: outgoingRequests, error: outgoingError } = await supabase
      .from('friend_requests')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        receiver:receiver_id(id, username, avatar_url)
      `)
      .eq('sender_id', userId)
      .eq('status', 'pending');
    
    if (outgoingError) {
      return res.status(500).json({ message: outgoingError.message });
    }
    
    return res.status(200).json({
      incoming: incomingRequests || [],
      outgoing: outgoingRequests || []
    });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return res.status(500).json({ message: 'An error occurred while fetching friend requests' });
  }
});

// Accept friend request
router.post('/request/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if request exists and user is the receiver
    const { data: request, error: requestError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', id)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .single();
    
    if (requestError) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    // Start a transaction
    // (In a real implementation, this would be wrapped in a transaction)
    
    // Update request status
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date() })
      .eq('id', id);
    
    if (updateError) {
      return res.status(500).json({ message: updateError.message });
    }
    
    // Create friendship
    const { data: friendship, error: friendshipError } = await supabase
      .from('friends')
      .insert([{
        user_id1: request.sender_id,
        user_id2: userId
      }])
      .select()
      .single();
    
    if (friendshipError) {
      // Rollback request update (in a real transaction)
      await supabase
        .from('friend_requests')
        .update({ status: 'pending', updated_at: new Date() })
        .eq('id', id);
      
      return res.status(500).json({ message: friendshipError.message });
    }
    
    return res.status(200).json({
      message: 'Friend request accepted',
      friendship
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return res.status(500).json({ message: 'An error occurred while accepting friend request' });
  }
});

// Reject friend request
router.post('/request/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if request exists and user is the receiver
    const { data: request, error: requestError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', id)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .single();
    
    if (requestError) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    // Update request status
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected', updated_at: new Date() })
      .eq('id', id);
    
    if (updateError) {
      return res.status(500).json({ message: updateError.message });
    }
    
    return res.status(200).json({
      message: 'Friend request rejected'
    });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return res.status(500).json({ message: 'An error occurred while rejecting friend request' });
  }
});

// Cancel outgoing friend request
router.delete('/request/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if request exists and user is the sender
    const { data: request, error: requestError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', id)
      .eq('sender_id', userId)
      .eq('status', 'pending')
      .single();
    
    if (requestError) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    // Delete request
    const { error: deleteError } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      return res.status(500).json({ message: deleteError.message });
    }
    
    return res.status(200).json({
      message: 'Friend request cancelled'
    });
  } catch (error) {
    console.error('Error cancelling friend request:', error);
    return res.status(500).json({ message: 'An error occurred while cancelling friend request' });
  }
});

// Remove friend
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if friendship exists and user is part of it
    const { data: friendship, error: friendshipError } = await supabase
      .from('friends')
      .select('*')
      .eq('id', id)
      .or(`user_id1.eq.${userId},user_id2.eq.${userId}`)
      .single();
    
    if (friendshipError) {
      return res.status(404).json({ message: 'Friendship not found' });
    }
    
    // Delete friendship
    const { error: deleteError } = await supabase
      .from('friends')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      return res.status(500).json({ message: deleteError.message });
    }
    
    return res.status(200).json({
      message: 'Friend removed successfully'
    });
  } catch (error) {
    console.error('Error removing friend:', error);
    return res.status(500).json({ message: 'An error occurred while removing friend' });
  }
});

export default router;