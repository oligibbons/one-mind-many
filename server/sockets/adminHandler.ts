// server/sockets/adminHandler.ts

import { Server, Socket } from 'socket.io';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';
import { Scenario } from '../../src/types/game.js';

type AdminSupabaseClient = SupabaseClient<any, 'public', any>;
type UserMap = Map<string, { userId: string; username: string }>;

/**
 * (NEW) Helper function to securely check if a socket is an admin.
 */
const checkIsAdmin = async (
  socket: Socket,
  supabase: AdminSupabaseClient,
  userMap: UserMap
): Promise<string> => {
  const userInfo = userMap.get(socket.id);
  if (!userInfo) {
    throw new Error('User not found for this socket. Please log in.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userInfo.userId)
    .single();

  if (error || !data || !data.is_admin) {
    console.warn(`[${socket.id}] User ${userInfo.username} failed admin check.`);
    throw new Error('Not authorized as an admin.');
  }
  
  console.log(`[${socket.id}] Admin check passed for ${userInfo.username}`);
  return userInfo.userId;
};

export const registerAdminHandlers = (
  io: Server,
  socket: Socket,
  supabase: AdminSupabaseClient,
  socketToUser: UserMap // <-- NEW
) => {
  const getScenarioList = async () => {
    try {
      await checkIsAdmin(socket, supabase, socketToUser); // Secure
      
      const { data, error } = await supabase
        .from('scenarios')
        .select('id, name, is_published, created_at');
      if (error) throw new Error(`DB scenario list fetch error: ${error.message}`);
      
      socket.emit('admin:scenario_list', data);
    } catch (error: any) {
      console.error(`[${socket.id}] Error in getScenarioList: ${error.message}`);
      socket.emit('error:admin', { message: error.message });
    }
  };

  const getScenarioDetails = async (payload: { scenarioId: string }) => {
    try {
      await checkIsAdmin(socket, supabase, socketToUser); // Secure
      
      const { scenarioId } = payload;
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();
      if (error) throw new Error(`DB scenario fetch error: ${error.message}`);
      
      socket.emit('admin:scenario_details', data);
    } catch (error: any) {
      console.error(`[${socket.id}] Error in getScenarioDetails: ${error.message}`);
      socket.emit('error:admin', { message: error.message });
    }
  };
  
  const saveScenario = async (payload: { scenario: Scenario }) => {
    try {
      await checkIsAdmin(socket, supabase, socketToUser); // Secure
      
      const { scenario } = payload;
      
      const { data, error } = await supabase
        .from('scenarios')
        .upsert(scenario)
        .select()
        .single();
      if (error) throw new Error(`DB scenario save error: ${error.message}`);
      
      socket.emit('admin:scenario_saved', data);
      
      // Notify all other connected admin sockets
      // This requires sockets to join an 'admin' room
      socket.broadcast.emit('admin:scenario_list_updated');
      
    } catch (error: any) {
      console.error(`[${socket.id}] Error in saveScenario: ${error.message}`);
      socket.emit('error:admin', { message: error.message });
    }
  };

  // Register Listeners
  socket.on('admin:get_scenario_list', getScenarioList);
  socket.on('admin:get_scenario_details', getScenarioDetails);
  socket.on('admin:save_scenario', saveScenario);
};