// src/lib/api.ts
import { supabase } from './supabaseClient'; // Import the client

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Helper function to get auth token
const getAuthToken = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
};

// Main request function
const request = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
) => {
  const token = await getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'An unknown error occurred',
      }));
      throw new Error(errorData.message || 'API request failed');
    }

    if (response.status === 204) {
      // No Content
      return null;
    }

    return response.json();
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error);
    throw error;
  }
};

// API object for convenience
export const api = {
  get: (endpoint: string) => request(endpoint, 'GET'),
  post: (endpoint: string, body: unknown) => request(endpoint, 'POST', body),
  put: (endpoint: string, body: unknown) => request(endpoint, 'PUT', body),
  delete: (endpoint: string) => request(endpoint, 'DELETE'),
};