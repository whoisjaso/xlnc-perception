import { create } from 'zustand';
import { CallLog } from '../../types';

interface CallState {
  calls: CallLog[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCalls: (calls: CallLog[]) => void;
  addCall: (call: CallLog) => void;
  updateCall: (id: string, updates: Partial<CallLog>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearCalls: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  calls: [],
  isLoading: false,
  error: null,

  setCalls: (calls) => set({ calls, error: null }),

  addCall: (call) => set((state) => ({
    calls: [call, ...state.calls]
  })),

  updateCall: (id, updates) => set((state) => ({
    calls: state.calls.map(c => c.id === id ? { ...c, ...updates } : c)
  })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearCalls: () => set({ calls: [], error: null }),
}));
