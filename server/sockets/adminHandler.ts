// server/sockets/adminHandler.ts

import { Server, Socket } from 'socket.io';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';
import { Scenario } from '../../src/types/game.js';

type AdminSupabaseClient = SupabaseClient<any, 'public', any>;

// TODO: Add a check to ensure only admins can use these functions.
// This requires an 'is_admin' column on your 'profiles' table.
// const checkIsAdmin = async (userId: string) => {
//   const { data, error } = await supabase
//     .from('profiles')
//     .select('is_admin')
//     .eq('id', userId)
//     .single();
//   if (error || !data.is_admin) throw new Error('Not authorized');
// };

export const registerAdminHandlers = (
  io: Server,
  socket: Socket,
  supabase: AdminSupabaseClient
) => {
  /**
   * Fetches a list of all scenarios (names and IDs).
   */
  const getScenarioList = async () => {
    try {
      // TODO: Add admin check
      const { data, error } = await supabase
        .from('scenarios')
        .select('id, name, is_published, created_at');
      
      if (error) throw new Error(`DB scenario list fetch error: ${error.message}`);
      
      // Send the list back to the requester
      socket.emit('admin:scenario_list', data);
    } catch (error: any) {
      console.error(`[${socket.id}] Error in getScenarioList: ${error.message}`);
      socket.emit('error:admin', { message: 'Failed to fetch scenarios.' });
    }
  };

  /**
   * Fetches the full JSON data for a single scenario.
   */
  const getScenarioDetails = async (payload: { scenarioId: string }) => {
    try {
      // TODO: Add admin check
      const { scenarioId } = payload;
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();
        
      if (error) throw new Error(`DB scenario fetch error: ${error.message}`);
      
      // Send the full scenario object back
      socket.emit('admin:scenario_details', data);
    } catch (error: any) {
      console.error(`[${socket.id}] Error in getScenarioDetails: ${error.message}`);
      socket.emit('error:admin', { message: 'Failed to fetch scenario details.' });
    }
  };
  
  /**
   * Saves (updates or creates) a scenario.
   */
  const saveScenario = async (payload: { scenario: Scenario }) => {
    try {
      // TODO: Add admin check
      const { scenario } = payload;
      
      // 'upsert' will create if ID doesn't exist, or update if it does.
      const { data, error } = await supabase
        .from('scenarios')
        .upsert(scenario)
        .select()
        .single();
        
      if (error) throw new Error(`DB scenario save error: ${error.message}`);
      
      socket.emit('admin:scenario_saved', data);
      
      // Notify all connected admins that the list has changed
      // This is the "real-time update"
      io.emit('admin:scenario_list_updated');
      
    } catch (error: any) {
      console.error(`[${socket.id}] Error in saveScenario: ${error.message}`);
      socket.emit('error:admin', { message: 'Failed to save scenario.' });
    }
  };

  // --- Register Listeners ---
  socket.on('admin:get_scenario_list', getScenarioList);
  socket.on('admin:get_scenario_details', getScenarioDetails);
  socket.on('admin:save_scenario', saveScenario);
};