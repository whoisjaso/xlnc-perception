import { create } from 'zustand';
import { ErrorLogEntry } from '../services/divine';

export interface ClientErrorStats {
  total: number;
  unresolved: number;
  critical: number;
  bySeverity: Record<string, number>;
  byService: Record<string, number>;
}

interface ErrorState {
  errors: ErrorLogEntry[];
  unreadCount: number;
  stats: ClientErrorStats | null;
  isLoading: boolean;
  lastFetch: number | null;

  // Actions
  setErrors: (errors: ErrorLogEntry[]) => void;
  addError: (error: ErrorLogEntry) => void;
  markAsRead: (errorId: string) => void;
  markAsAcknowledged: (errorId: string) => void;
  clearUnread: () => void;
  setStats: (stats: ClientErrorStats) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
  errors: [],
  unreadCount: 0,
  stats: null,
  isLoading: false,
  lastFetch: null,

  setErrors: (errors) => set({
    errors,
    lastFetch: Date.now(),
    unreadCount: errors.filter(e => !e.resolved && !(e.context as any)?.acknowledged).length,
  }),

  addError: (error) => set((state) => ({
    errors: [error, ...state.errors].slice(0, 50), // Keep last 50
    unreadCount: state.unreadCount + 1,
    stats: state.stats ? {
      ...state.stats,
      total: state.stats.total + 1,
      unresolved: state.stats.unresolved + 1,
      critical: error.severity === 'critical' ? state.stats.critical + 1 : state.stats.critical,
    } : null,
  })),

  markAsRead: (errorId) => set((state) => ({
    errors: state.errors.map(e =>
      e.id === errorId ? { ...e, context: { ...e.context, read: true } } : e
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),

  markAsAcknowledged: (errorId) => set((state) => ({
    errors: state.errors.map(e =>
      e.id === errorId ? { ...e, context: { ...e.context, acknowledged: true } } : e
    ),
  })),

  clearUnread: () => set({ unreadCount: 0 }),

  setStats: (stats) => set({ stats }),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () => set({
    errors: [],
    unreadCount: 0,
    stats: null,
    isLoading: false,
    lastFetch: null,
  }),
}));
