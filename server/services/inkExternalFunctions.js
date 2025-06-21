import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// External functions for Ink integration
const inkExternalFunctions = {
  // Get location data
  async get_location_data(locationId) {
    try {
      // This would fetch location data from your database
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error getting location data:', error);
      return null;
    }
  },
  
  // Update object state
  async update_object_state(objectId, newState) {
    try {
      const { data, error } = await supabase
        .from('objects')
        .update({ state: newState })
        .eq('id', objectId)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error updating object state:', error);
      return false;
    }
  },
  
  // Add to inventory
  async add_to_inventory(gameId, itemId) {
    try {
      // First, check if the item exists in the game's inventory
      const { data: existingItem, error: checkError } = await supabase
        .from('character_inventory')
        .select('*')
        .eq('character_id', gameId)
        .eq('item_type', itemId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (existingItem) {
        // Item exists, increment quantity
        const { data, error } = await supabase
          .from('character_inventory')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id)
          .select()
          .single();
        
        if (error) throw error;
        
        return data;
      } else {
        // Item doesn't exist, add it
        const { data, error } = await supabase
          .rpc('add_character_item', {
            p_character_id: gameId,
            p_item_type: itemId,
            p_item_data: {},
            p_quantity: 1
          });
        
        if (error) throw error;
        
        return data;
      }
    } catch (error) {
      console.error('Error adding to inventory:', error);
      return false;
    }
  },
  
  // Remove from inventory
  async remove_from_inventory(gameId, itemId) {
    try {
      // First, check if the item exists in the game's inventory
      const { data: existingItem, error: checkError } = await supabase
        .from('character_inventory')
        .select('*')
        .eq('character_id', gameId)
        .eq('item_type', itemId)
        .single();
      
      if (checkError) throw checkError;
      
      if (existingItem.quantity > 1) {
        // Item exists with multiple quantities, decrement
        const { data, error } = await supabase
          .from('character_inventory')
          .update({ quantity: existingItem.quantity - 1 })
          .eq('id', existingItem.id)
          .select()
          .single();
        
        if (error) throw error;
        
        return data;
      } else {
        // Item exists with quantity 1, remove it
        const { error } = await supabase
          .from('character_inventory')
          .delete()
          .eq('id', existingItem.id);
        
        if (error) throw error;
        
        return true;
      }
    } catch (error) {
      console.error('Error removing from inventory:', error);
      return false;
    }
  },
  
  // Check if item is in inventory
  async has_item(gameId, itemId) {
    try {
      const { data, error } = await supabase
        .from('character_inventory')
        .select('*')
        .eq('character_id', gameId)
        .eq('item_type', itemId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No data found
          return false;
        }
        throw error;
      }
      
      return data.quantity > 0;
    } catch (error) {
      console.error('Error checking inventory:', error);
      return false;
    }
  },
  
  // Get character data
  async get_character_data(gameId) {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('game_id', gameId)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error getting character data:', error);
      return null;
    }
  },
  
  // Update character state
  async update_character_state(gameId, property, value) {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('game_id', gameId)
        .single();
      
      if (error) throw error;
      
      const characterId = data.id;
      
      // Handle location updates specially
      if (property === 'location') {
        const { data: locationUpdate, error: locationError } = await supabase
          .rpc('update_character_location', {
            p_character_id: characterId,
            p_new_location: value
          });
        
        if (locationError) throw locationError;
        
        return true;
      }
      
      // For other properties, update the stats JSON
      const stats = data.stats || {};
      stats[property] = value;
      
      const { error: updateError } = await supabase
        .from('characters')
        .update({ stats, updated_at: new Date() })
        .eq('id', characterId);
      
      if (updateError) throw updateError;
      
      return true;
    } catch (error) {
      console.error('Error updating character state:', error);
      return false;
    }
  },
  
  // Log narrative event
  async log_narrative(gameId, content, type = 'narrative') {
    try {
      const { data, error } = await supabase
        .rpc('add_narrative_log', {
          p_game_id: gameId,
          p_content: content,
          p_metadata: { type }
        });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error logging narrative:', error);
      return false;
    }
  },
  
  // Get player role
  async get_player_role(gameId, playerId) {
    try {
      const { data, error } = await supabase
        .from('game_players')
        .select('role')
        .eq('game_id', gameId)
        .eq('user_id', playerId)
        .single();
      
      if (error) throw error;
      
      return data.role;
    } catch (error) {
      console.error('Error getting player role:', error);
      return null;
    }
  },
  
  // Check if objective is complete
  async is_objective_complete(gameId, objectiveId) {
    try {
      // This would check if an objective is complete in your database
      // For now, we'll just return a mock implementation
      const { data, error } = await supabase
        .from('game_objectives')
        .select('completed')
        .eq('game_id', gameId)
        .eq('objective_id', objectiveId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No data found, objective not complete
          return false;
        }
        throw error;
      }
      
      return data.completed;
    } catch (error) {
      console.error('Error checking objective completion:', error);
      return false;
    }
  },
  
  // Complete objective
  async complete_objective(gameId, objectiveId) {
    try {
      // This would mark an objective as complete in your database
      // For now, we'll just return a mock implementation
      const { data, error } = await supabase
        .from('game_objectives')
        .upsert({
          game_id: gameId,
          objective_id: objectiveId,
          completed: true,
          completed_at: new Date()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error completing objective:', error);
      return false;
    }
  }
};

export default inkExternalFunctions;