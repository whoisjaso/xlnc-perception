import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile } from '../../types';

interface AuthState {
  accessToken: string | null;
  user: UserProfile | null;
  setAuth: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateUser: (user: Partial<UserProfile>) => void;
  refreshToken: () => Promise<boolean>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,

      setAuth: (token, user) => set({ accessToken: token, user }),

      logout: async () => {
        // Call backend logout to clear refresh token cookie
        try {
          await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include', // Important: send cookies
          });
        } catch (error) {
          console.error('Logout error:', error);
        }
        set({ accessToken: null, user: null });
      },

      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),

      refreshToken: async () => {
        try {
          const response = await fetch(`${API_URL}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include', // Important: send cookies with refresh token
          });

          if (response.ok) {
            const data = await response.json();
            set({
              accessToken: data.accessToken,
              user: data.user
            });
            return true;
          } else {
            // Refresh failed, clear auth state
            set({ accessToken: null, user: null });
            return false;
          }
        } catch (error) {
          console.error('Token refresh error:', error);
          set({ accessToken: null, user: null });
          return false;
        }
      },
    }),
    {
      name: 'xlnc_auth',
      // Only persist user profile, NOT the access token (security)
      partialize: (state) => ({ user: state.user }),
    }
  )
);
