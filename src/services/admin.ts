import { useAuthStore } from '../stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: any;
}

interface User {
  id: string;
  name: string;
  email: string;
  plan: 'INITIATE' | 'SOVEREIGN' | 'EMPIRE';
  isAdmin: boolean;
  avatarUrl?: string;
  hasRetellConfig: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserDetails extends User {
  callCount: number;
}

interface PaginationResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface Stats {
  totalUsers: number;
  adminCount: number;
  totalCalls: number;
  retellUsers: number;
  mrr: number;
  usersByPlan: Array<{ plan: string; count: number }>;
}

interface CallLog {
  id: string;
  userId: string;
  retellCallId: string;
  agentId: string;
  fromNumber: string;
  toNumber: string;
  status: string;
  outcome: string;
  duration: number;
  sentiment: number;
  costCents: number;
  createdAt: string;
}

// Helper to get auth header
const getAuthHeaders = () => {
  const accessToken = useAuthStore.getState().accessToken;
  return {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };
};

// Helper for API calls
const apiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
    credentials: 'include', // Important for refresh token cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.metadata?.error_code || 'API request failed');
  }

  return response.json();
};

/**
 * Admin API Service
 */
export const adminApi = {
  /**
   * Get list of users with optional filtering
   */
  getUsers: async (params?: {
    search?: string;
    plan?: 'INITIATE' | 'SOVEREIGN' | 'EMPIRE';
    isAdmin?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ users: User[]; pagination: PaginationResponse<User>['pagination'] }> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.plan) queryParams.append('plan', params.plan);
    if (params?.isAdmin !== undefined) queryParams.append('isAdmin', String(params.isAdmin));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));

    const query = queryParams.toString();
    return apiCall(`/api/admin/users${query ? `?${query}` : ''}`);
  },

  /**
   * Get detailed user information
   */
  getUserById: async (userId: string): Promise<{ user: UserDetails }> => {
    return apiCall(`/api/admin/users/${userId}`);
  },

  /**
   * Update user details
   */
  updateUser: async (
    userId: string,
    updates: {
      name?: string;
      plan?: 'INITIATE' | 'SOVEREIGN' | 'EMPIRE';
      isAdmin?: boolean;
      avatarUrl?: string;
    }
  ): Promise<{ user: User; message: string }> => {
    return apiCall(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Delete user
   */
  deleteUser: async (userId: string): Promise<{ message: string; deletedUserId: string }> => {
    return apiCall(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get global system statistics
   */
  getStats: async (): Promise<{ stats: Stats }> => {
    return apiCall('/api/admin/stats');
  },

  /**
   * Get all call logs across all users
   */
  getCallLogs: async (params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ callLogs: CallLog[]; pagination: PaginationResponse<CallLog>['pagination'] }> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));

    const query = queryParams.toString();
    return apiCall(`/api/admin/call-logs${query ? `?${query}` : ''}`);
  },
};

export type { User, UserDetails, Stats, CallLog };
