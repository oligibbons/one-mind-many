/*
  # Game Systems Migration

  1. New Tables
    - `games`: Stores active game sessions
    - `game_players`: Links players to games with their roles
    - `characters`: Represents shared characters in games
    - `character_inventory`: Tracks character items
    - `game_actions`: Records player actions
    - `game_logs`: Stores narrative and system logs

  2. Security
    - Enable RLS on all tables
    - Add policies for players to access their games
    - Add policies for action management
    - Add policies for viewing game logs

  3. Functions
    - Character location updates
    - Inventory management
    - Action queueing
    - Narrative logging
*/

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id uuid NOT NULL,
  scenario_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  settings jsonb NOT NULL DEFAULT '{}',
  current_turn integer NOT NULL DEFAULT 1,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  
  CONSTRAINT valid_status CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Game players table
CREATE TABLE IF NOT EXISTS game_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  role text NOT NULL DEFAULT 'crewmate',
  is_alive boolean NOT NULL DEFAULT true,
  joined_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_role CHECK (role IN ('crewmate', 'saboteur'))
);

ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  name text NOT NULL,
  location jsonb NOT NULL,
  status text NOT NULL DEFAULT 'alive',
  stats jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('alive', 'injured', 'dead'))
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Character inventory table
CREATE TABLE IF NOT EXISTS character_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_data jsonb NOT NULL DEFAULT '{}',
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE character_inventory ENABLE ROW LEVEL SECURITY;

-- Game actions table
CREATE TABLE IF NOT EXISTS game_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  player_id uuid REFERENCES users(id),
  action_type text NOT NULL,
  action_data jsonb NOT NULL,
  target_type text,
  target_id uuid,
  status text NOT NULL DEFAULT 'queued',
  turn_number integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  
  CONSTRAINT valid_status CHECK (status IN ('queued', 'processing', 'completed', 'failed'))
);

ALTER TABLE game_actions ENABLE ROW LEVEL SECURITY;

-- Game logs table
CREATE TABLE IF NOT EXISTS game_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  log_type text NOT NULL,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  turn_number integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_log_type CHECK (log_type IN ('narrative', 'action', 'system', 'chat'))
);

ALTER TABLE game_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Games policies
CREATE POLICY "Players can view their games"
  ON games
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = games.id
      AND game_players.user_id = auth.uid()
    )
  );

-- Game players policies
CREATE POLICY "Players can view game players"
  ON game_players
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_players gp
      WHERE gp.game_id = game_players.game_id
      AND gp.user_id = auth.uid()
    )
  );

-- Characters policies
CREATE POLICY "Players can view characters in their games"
  ON characters
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = characters.game_id
      AND game_players.user_id = auth.uid()
    )
  );

-- Character inventory policies
CREATE POLICY "Players can view character inventory in their games"
  ON character_inventory
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      JOIN characters ON characters.game_id = game_players.game_id
      WHERE character_inventory.character_id = characters.id
      AND game_players.user_id = auth.uid()
    )
  );

-- Game actions policies
CREATE POLICY "Players can view actions in their games"
  ON game_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = game_actions.game_id
      AND game_players.user_id = auth.uid()
    )
  );

CREATE POLICY "Players can create actions in their games"
  ON game_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = game_actions.game_id
      AND game_players.user_id = auth.uid()
      AND game_players.user_id = game_actions.player_id
    )
  );

-- Game logs policies
CREATE POLICY "Players can view logs in their games"
  ON game_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = game_logs.game_id
      AND game_players.user_id = auth.uid()
    )
  );

-- Functions

-- Function to update character location
CREATE OR REPLACE FUNCTION update_character_location(
  p_character_id uuid,
  p_new_location jsonb
) RETURNS void AS $$
BEGIN
  UPDATE characters
  SET 
    location = p_new_location,
    updated_at = now()
  WHERE id = p_character_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add item to character inventory
CREATE OR REPLACE FUNCTION add_character_item(
  p_character_id uuid,
  p_item_type text,
  p_item_data jsonb,
  p_quantity integer DEFAULT 1
) RETURNS uuid AS $$
DECLARE
  v_item_id uuid;
BEGIN
  INSERT INTO character_inventory (
    character_id,
    item_type,
    item_data,
    quantity
  ) VALUES (
    p_character_id,
    p_item_type,
    p_item_data,
    p_quantity
  )
  RETURNING id INTO v_item_id;
  
  RETURN v_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to queue player action
CREATE OR REPLACE FUNCTION queue_player_action(
  p_game_id uuid,
  p_player_id uuid,
  p_action_type text,
  p_action_data jsonb,
  p_target_type text DEFAULT NULL,
  p_target_id uuid DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_action_id uuid;
  v_turn_number integer;
BEGIN
  -- Get current turn number
  SELECT current_turn INTO v_turn_number
  FROM games
  WHERE id = p_game_id;
  
  -- Insert action
  INSERT INTO game_actions (
    game_id,
    player_id,
    action_type,
    action_data,
    target_type,
    target_id,
    turn_number
  ) VALUES (
    p_game_id,
    p_player_id,
    p_action_type,
    p_action_data,
    p_target_type,
    p_target_id,
    v_turn_number
  )
  RETURNING id INTO v_action_id;
  
  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add narrative log
CREATE OR REPLACE FUNCTION add_narrative_log(
  p_game_id uuid,
  p_content text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
  v_turn_number integer;
BEGIN
  -- Get current turn number
  SELECT current_turn INTO v_turn_number
  FROM games
  WHERE id = p_game_id;
  
  -- Insert log
  INSERT INTO game_logs (
    game_id,
    log_type,
    content,
    metadata,
    turn_number
  ) VALUES (
    p_game_id,
    'narrative',
    p_content,
    p_metadata,
    v_turn_number
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;