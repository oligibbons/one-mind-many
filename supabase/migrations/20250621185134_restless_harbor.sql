/*
  # Game Systems Tables

  1. New Tables
    - `games` - Stores game session data
    - `characters` - Stores shared character data
    - `character_inventory` - Stores character items
    - `game_actions` - Stores player actions
    - `game_logs` - Stores narrative and system logs

  2. Security
    - Enable RLS on all tables
    - Add policies for players to access their game data
    - Add functions for common game operations
*/

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id uuid REFERENCES lobbies(id) ON DELETE CASCADE,
  scenario_id uuid REFERENCES scenarios(id),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'abandoned')),
  settings jsonb DEFAULT '{}',
  current_turn integer DEFAULT 1,
  current_round integer DEFAULT 1,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create characters table (shared character for each game)
CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  name text NOT NULL,
  location jsonb NOT NULL,
  status text NOT NULL DEFAULT 'alive' CHECK (status IN ('alive', 'injured', 'dead')),
  stats jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create character inventory table
CREATE TABLE IF NOT EXISTS character_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_data jsonb DEFAULT '{}',
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create game actions table
CREATE TABLE IF NOT EXISTS game_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  player_id uuid REFERENCES users(id),
  action_type text NOT NULL,
  action_data jsonb NOT NULL,
  target_type text,
  target_id uuid,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  turn_number integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Create game logs table
CREATE TABLE IF NOT EXISTS game_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  log_type text NOT NULL CHECK (log_type IN ('narrative', 'action', 'system', 'chat')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  turn_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create game ink states table
CREATE TABLE IF NOT EXISTS game_ink_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  state_json text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create game objectives table
CREATE TABLE IF NOT EXISTS game_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  objective_id text NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_ink_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_objectives ENABLE ROW LEVEL SECURITY;

-- Games policies
DROP POLICY IF EXISTS "Players can view games they're in" ON games;
CREATE POLICY "Players can view games they're in"
  ON games
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = games.id
      AND game_players.user_id = uid()
    )
  );

DROP POLICY IF EXISTS "Game hosts can update their games" ON games;
CREATE POLICY "Game hosts can update their games"
  ON games
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lobbies
      WHERE lobbies.id = games.lobby_id
      AND lobbies.host_id = uid()
    )
  );

-- Characters policies
DROP POLICY IF EXISTS "Players can view characters in their games" ON characters;
CREATE POLICY "Players can view characters in their games"
  ON characters
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = characters.game_id
      AND game_players.user_id = uid()
    )
  );

DROP POLICY IF EXISTS "Players can update characters in their games" ON characters;
CREATE POLICY "Players can update characters in their games"
  ON characters
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = characters.game_id
      AND game_players.user_id = uid()
    )
  );

-- Character inventory policies
DROP POLICY IF EXISTS "Players can view character inventory in their games" ON character_inventory;
CREATE POLICY "Players can view character inventory in their games"
  ON character_inventory
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      JOIN characters ON characters.game_id = game_players.game_id
      WHERE character_inventory.character_id = characters.id
      AND game_players.user_id = uid()
    )
  );

-- Game actions policies
DROP POLICY IF EXISTS "Players can create actions in their games" ON game_actions;
CREATE POLICY "Players can create actions in their games"
  ON game_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = game_actions.game_id
      AND game_players.user_id = uid()
      AND game_players.user_id = game_actions.player_id
    )
  );

DROP POLICY IF EXISTS "Players can view actions in their games" ON game_actions;
CREATE POLICY "Players can view actions in their games"
  ON game_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = game_actions.game_id
      AND game_players.user_id = uid()
    )
  );

-- Game logs policies
DROP POLICY IF EXISTS "Players can view logs in their games" ON game_logs;
CREATE POLICY "Players can view logs in their games"
  ON game_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = game_logs.game_id
      AND game_players.user_id = uid()
    )
  );

-- Game ink states policies
DROP POLICY IF EXISTS "Players can view ink states in their games" ON game_ink_states;
CREATE POLICY "Players can view ink states in their games"
  ON game_ink_states
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = game_ink_states.game_id
      AND game_players.user_id = uid()
    )
  );

DROP POLICY IF EXISTS "Players can insert ink states in their games" ON game_ink_states;
CREATE POLICY "Players can insert ink states in their games"
  ON game_ink_states
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = game_ink_states.game_id
      AND game_players.user_id = uid()
    )
  );

DROP POLICY IF EXISTS "Players can update ink states in their games" ON game_ink_states;
CREATE POLICY "Players can update ink states in their games"
  ON game_ink_states
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = game_ink_states.game_id
      AND game_players.user_id = uid()
    )
  );

-- Game objectives policies
DROP POLICY IF EXISTS "Players can view objectives in their games" ON game_objectives;
CREATE POLICY "Players can view objectives in their games"
  ON game_objectives
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = game_objectives.game_id
      AND game_players.user_id = uid()
    )
  );

-- Helper functions
CREATE OR REPLACE FUNCTION update_character_location(
  p_character_id uuid,
  p_new_location jsonb
) RETURNS void AS $$
BEGIN
  UPDATE characters
  SET location = p_new_location, updated_at = now()
  WHERE id = p_character_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_character_item(
  p_character_id uuid,
  p_item_type text,
  p_item_data jsonb DEFAULT '{}',
  p_quantity integer DEFAULT 1
) RETURNS uuid AS $$
DECLARE
  item_id uuid;
BEGIN
  INSERT INTO character_inventory (character_id, item_type, item_data, quantity)
  VALUES (p_character_id, p_item_type, p_item_data, p_quantity)
  RETURNING id INTO item_id;
  
  RETURN item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION queue_player_action(
  p_game_id uuid,
  p_player_id uuid,
  p_action_type text,
  p_action_data jsonb,
  p_target_type text DEFAULT NULL,
  p_target_id uuid DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  action_id uuid;
  current_turn integer;
BEGIN
  -- Get current turn
  SELECT games.current_turn INTO current_turn
  FROM games
  WHERE id = p_game_id;
  
  INSERT INTO game_actions (
    game_id, player_id, action_type, action_data, 
    target_type, target_id, turn_number
  )
  VALUES (
    p_game_id, p_player_id, p_action_type, p_action_data,
    p_target_type, p_target_id, current_turn
  )
  RETURNING id INTO action_id;
  
  RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_narrative_log(
  p_game_id uuid,
  p_content text,
  p_metadata jsonb DEFAULT '{}'
) RETURNS uuid AS $$
DECLARE
  log_id uuid;
  current_turn integer;
BEGIN
  -- Get current turn
  SELECT games.current_turn INTO current_turn
  FROM games
  WHERE id = p_game_id;
  
  INSERT INTO game_logs (game_id, log_type, content, metadata, turn_number)
  VALUES (p_game_id, 'narrative', p_content, p_metadata, current_turn)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;