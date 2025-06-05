/*
  # Create friends and friend_requests tables

  1. New Tables
    - `friend_requests`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, foreign key to users.id)
      - `receiver_id` (uuid, foreign key to users.id)
      - `status` (text, default 'pending')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `friends`
      - `id` (uuid, primary key)
      - `user_id1` (uuid, foreign key to users.id)
      - `user_id2` (uuid, foreign key to users.id)
      - `created_at` (timestamptz)
      - Unique constraint on user_id1, user_id2 pair
  
  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own friend requests and friendships
*/

-- Friend requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES users(id),
  receiver_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT different_users CHECK (sender_id <> receiver_id),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected'))
);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own friend requests"
  ON friend_requests
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send friend requests"
  ON friend_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update received friend requests"
  ON friend_requests
  FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

CREATE POLICY "Users can delete their own friend requests"
  ON friend_requests
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Friends table
CREATE TABLE IF NOT EXISTS friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id1 uuid NOT NULL REFERENCES users(id),
  user_id2 uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT different_users CHECK (user_id1 <> user_id2),
  CONSTRAINT unique_friendship UNIQUE (user_id1, user_id2)
);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own friends"
  ON friends
  FOR SELECT
  TO authenticated
  USING (user_id1 = auth.uid() OR user_id2 = auth.uid());

CREATE POLICY "Users can add friends"
  ON friends
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id1 = auth.uid() OR user_id2 = auth.uid());

CREATE POLICY "Users can remove friends"
  ON friends
  FOR DELETE
  TO authenticated
  USING (user_id1 = auth.uid() OR user_id2 = auth.uid());