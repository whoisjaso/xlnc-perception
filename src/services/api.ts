import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { CallLog } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create Axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true, // Important for HTTP-only cookies
});

// Request interceptor: Add JWT token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Update auth state with new token
        useAuthStore.getState().setAuth(data.data.accessToken, data.data.user);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        useAuthStore.getState().logout();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// --- Typed API Methods ---

export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/api/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),

  refresh: () =>
    api.post('/api/auth/refresh'),

  logout: () =>
    api.post('/api/auth/logout'),
};

export const callsAPI = {
  getAll: (filters?: {
    search?: string;
    outcome?: string;
    sentiment?: string;
    minDuration?: number;
    maxDuration?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<{ success: boolean; data: { calls: CallLog[]; pagination: any } }>('/api/calls', { params: filters }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: { call: CallLog } }>(`/api/calls/${id}`),

  sync: () =>
    api.post<{ success: boolean; data: { synced: number; message: string } }>('/api/calls/sync'),

  getMetrics: () =>
    api.get('/api/calls/analytics/metrics'),
};

export const usersAPI = {
  getMe: () =>
    api.get('/api/users/me'),

  updateProfile: (data: { name?: string; avatarUrl?: string }) =>
    api.patch('/api/users/me', data),

  updateRetellConfig: (data: { retellApiKey?: string; retellAgentId?: string }) =>
    api.patch('/api/users/retell-config', data),
};

export const agentsAPI = {
  deploy: (data: {
    name: string;
    systemPrompt: string;
    industry?: string;
    tone?: 'AGGRESSIVE' | 'AUTHORITATIVE' | 'EXCLUSIVE' | 'URGENT';
    goal?: string;
    traits?: string;
    voiceConfig?: {
      voiceId?: string;
      language?: string;
      temperature?: number;
    };
  }) =>
    api.post('/api/agents/deploy', data),

  getAll: () =>
    api.get('/api/agents'),

  delete: (id: string) =>
    api.delete(`/api/agents/${id}`),
};
