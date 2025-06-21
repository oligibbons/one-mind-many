/*
  # Add Game Systems Tables

  1. New Tables
    - `games`
      - `id` (uuid, primary key)
      - `lobby_id` (uuid, foreign key)
      - `scenario_id` (uuid, foreign key)
      - `status` (text) - in_progress, completed, abandoned
      - `settings` (jsonb) - game configuration
      - `current_turn` (integer)
      - `started_at` (timestamp)
      - `ended_at` (timestamp, nullable)
    
    - `characters`
      - `id` (uuid, primary key)
      - `game_id` (uuid, foreign key)
      - `name` (text)
      - `location` (jsonb) - current location data
      - `status` (text) - alive, injured, dead
      - `stats` (jsonb) - character statistics
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `character_inventory`
      - `id` (uuid, primary key)
      - `character_id` (uuid, foreign key)
      - `item_type` (text)
      - `item_data` (jsonb)
      - `quantity` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `game_actions`
      - `id` (uuid, primary key)
      - `game_id` (uuid, foreign key)
      - `player_id` (uuid, foreign key to users)
      - `action_type` (text)
      - `action_data` (jsonb)
      - `target_type` (text, nullable)
      - `target_id` (uuid, nullable)
      - `status` (text) - queued, processing, completed, failed
      - `turn_number` (integer)
      - `created_at` (timestamp)
      - `resolved_at` (timestamp, nullable)
    
    - `game_logs`
      - `id` (uuid, primary key)
      - `game_id` (uuid, foreign key)
      - `log_type` (text) - narrative, action, system, chat
      - `content` (text)
      - `metadata` (jsonb)
      - `turn_number` (integer)
      - `created_at` (timestamp)
    
    - `game_ink_states`
      - `id` (uuid, primary key)
      - `game_id` (uuid, foreign key)
      - `state_json` (text) - serialized Ink story state
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `game_objectives`
      - `id` (uuid, primary key)
      - `game_id` (uuid, foreign key)
      - `objective_id` (text)
      - `completed` (boolean)
      - `completed_at` (timestamp, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for players to access their game data
    - Add functions for common game operations

  3. Functions
    - `queue_player_action` - Queue an action for a player
    - `add_narrative_log` - Add a narrative log entry
    - `update_character_location` - Update character location
    - `add_character_item` - Add item to character inventory
*/

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id uuid REFERENCES lobbies(id) ON DELETE CASCADE,
  scenario_id uuid REFERENCES scenarios(id),
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  settings jsonb DEFAULT '{}',
  current_turn integer DEFAULT 1,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- Create characters table
CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  name text NOT NULL,
  location jsonb NOT NULL,
  status text DEFAULT 'alive' CHECK (status IN ('alive', 'injured', 'dead')),
  stats jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create character_inventory table
CREATE TABLE IF NOT EXISTS character_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_data jsonb DEFAULT '{}',
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create game_actions table
CREATE TABLE IF NOT EXISTS game_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  player_id uuid REFERENCES users(id),
  action_type text NOT NULL,
  action_data jsonb NOT NULL,
  target_type text,
  target_id uuid,
  status text DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  turn_number integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Create game_logs table
CREATE TABLE IF NOT EXISTS game_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  log_type text NOT NULL CHECK (log_type IN ('narrative', 'action', 'system', 'chat')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  turn_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create game_ink_states table
CREATE TABLE IF NOT EXISTS game_ink_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  state_json text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create game_objectives table
CREATE TABLE IF NOT EXISTS game_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  objective_id text NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_ink_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_objectives ENABLE ROW LEVEL SECURITY;

-- Games policies
CREATE POLICY "Players can view their games"
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

-- Characters policies
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
      AND game_players.user_id = uid()
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
      AND game_players.user_id = uid()
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
      AND game_players.user_id = uid()
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
      AND game_players.user_id = uid()
    )
  );

-- Game ink states policies
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

-- Create functions for common game operations

-- Function to queue a player action
CREATE OR REPLACE FUNCTION queue_player_action(
  p_game_id uuid,
  p_player_id uuid,
  p_action_type text,
  p_action_data jsonb,
  p_target_type text DEFAULT NULL,
  p_target_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action_id uuid;
  v_current_turn integer;
BEGIN
  -- Get current turn
  SELECT current_turn INTO v_current_turn
  FROM games
  WHERE id = p_game_id;

  -- Insert the action
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
    v_current_turn
  ) RETURNING id INTO v_action_id;

  RETURN v_action_id;
END;
$$;

-- Function to add a narrative log entry
CREATE OR REPLACE FUNCTION add_narrative_log(
  p_game_id uuid,
  p_content text,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
  v_current_turn integer;
BEGIN
  -- Get current turn
  SELECT current_turn INTO v_current_turn
  FROM games
  WHERE id = p_game_id;

  -- Insert the log entry
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
    v_current_turn
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Function to update character location
CREATE OR REPLACE FUNCTION update_character_location(
  p_character_id uuid,
  p_new_location jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE characters
  SET 
    location = p_new_location,
    updated_at = now()
  WHERE id = p_character_id;

  RETURN FOUND;
END;
$$;

-- Function to add item to character inventory
CREATE OR REPLACE FUNCTION add_character_item(
  p_character_id uuid,
  p_item_type text,
  p_item_data jsonb DEFAULT '{}',
  p_quantity integer DEFAULT 1
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inventory_id uuid;
  v_existing_id uuid;
  v_existing_quantity integer;
BEGIN
  -- Check if item already exists
  SELECT id, quantity INTO v_existing_id, v_existing_quantity
  FROM character_inventory
  WHERE character_id = p_character_id
  AND item_type = p_item_type;

  IF v_existing_id IS NOT NULL THEN
    -- Update existing item quantity
    UPDATE character_inventory
    SET 
      quantity = v_existing_quantity + p_quantity,
      updated_at = now()
    WHERE id = v_existing_id;
    
    RETURN v_existing_id;
  ELSE
    -- Insert new item
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
    ) RETURNING id INTO v_inventory_id;

    RETURN v_inventory_id;
  END IF;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_lobby_id ON games(lobby_id);
CREATE INDEX IF NOT EXISTS idx_games_scenario_id ON games(scenario_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

CREATE INDEX IF NOT EXISTS idx_characters_game_id ON characters(game_id);
CREATE INDEX IF NOT EXISTS idx_characters_status ON characters(status);

CREATE INDEX IF NOT EXISTS idx_character_inventory_character_id ON character_inventory(character_id);
CREATE INDEX IF NOT EXISTS idx_character_inventory_item_type ON character_inventory(item_type);

CREATE INDEX IF NOT EXISTS idx_game_actions_game_id ON game_actions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_actions_player_id ON game_actions(player_id);
CREATE INDEX IF NOT EXISTS idx_game_actions_turn_number ON game_actions(turn_number);
CREATE INDEX IF NOT EXISTS idx_game_actions_status ON game_actions(status);

CREATE INDEX IF NOT EXISTS idx_game_logs_game_id ON game_logs(game_id);
CREATE INDEX IF NOT EXISTS idx_game_logs_turn_number ON game_logs(turn_number);
CREATE INDEX IF NOT EXISTS idx_game_logs_log_type ON game_logs(log_type);

CREATE INDEX IF NOT EXISTS idx_game_ink_states_game_id ON game_ink_states(game_id);
CREATE INDEX IF NOT EXISTS idx_game_objectives_game_id ON game_objectives(game_id);
CREATE INDEX IF NOT EXISTS idx_game_objectives_completed ON game_objectives(completed);