/*
  # Create scenarios table

  1. New Tables
    - `scenarios`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text, not null)
      - `difficulty` (text, default 'medium')
      - `min_players` (integer, default 4)
      - `max_players` (integer, default 8)
      - `creator_id` (uuid, foreign key to users.id)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `is_public` (boolean, default true)
      - `image_url` (text, nullable)
      - `content` (jsonb, not null)
  2. Security
    - Enable RLS on `scenarios` table
    - Add policy for authenticated users to read public scenarios
    - Add policy for scenario creators to read/update/delete their own scenarios
    - Add policy for admins to manage all scenarios
*/

CREATE TABLE IF NOT EXISTS scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium',
  min_players integer NOT NULL DEFAULT 4,
  max_players integer NOT NULL DEFAULT 8,
  creator_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT true,
  image_url text,
  content jsonb NOT NULL,
  
  CONSTRAINT valid_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert'))
);

ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public scenarios are visible to all authenticated users"
  ON scenarios
  FOR SELECT
  TO authenticated
  USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create scenarios"
  ON scenarios
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update their scenarios"
  ON scenarios
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can delete their scenarios"
  ON scenarios
  FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Admins can manage all scenarios"
  ON scenarios
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );