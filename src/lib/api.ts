// Centralized API utility for backend communication
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://one-mind-many-backend.onrender.com';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async request(endpoint: string, options: ApiOptions = {}): Promise<Response> {
    const { method = 'GET', body, headers = {} } = options;
    
    const config: RequestInit = {
      method,
      headers: {
        ...this.getAuthHeaders(),
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      config.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const url = `${this.baseUrl}${endpoint}`;
    return fetch(url, config);
  }

  async get(endpoint: string, headers?: Record<string, string>): Promise<Response> {
    return this.request(endpoint, { method: 'GET', headers });
  }

  async post(endpoint: string, body?: any, headers?: Record<string, string>): Promise<Response> {
    return this.request(endpoint, { method: 'POST', body, headers });
  }

  async put(endpoint: string, body?: any, headers?: Record<string, string>): Promise<Response> {
    return this.request(endpoint, { method: 'PUT', body, headers });
  }

  async patch(endpoint: string, body?: any, headers?: Record<string, string>): Promise<Response> {
    return this.request(endpoint, { method: 'PATCH', body, headers });
  }

  async delete(endpoint: string, headers?: Record<string, string>): Promise<Response> {
    return this.request(endpoint, { method: 'DELETE', headers });
  }
}

// Export a singleton instance
export const api = new ApiClient(BACKEND_URL);

// Export the backend URL for WebSocket connections
export const BACKEND_WS_URL = BACKEND_URL;