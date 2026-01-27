// Divine Agentic Intelligence System - WebSocket Hook for Real-time Call Events
// Connects to Socket.IO for live call status streaming

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/useAuthStore';

export interface CallEvent {
  callId: string;
  clientId: string;
  phone?: string; // Last 4 digits
  direction?: 'inbound' | 'outbound';
  agentId?: string;
  durationMs?: number;
  status?: string;
  timestamp: string;
}

export interface ActiveCall extends CallEvent {
  startedAt: string;
}

export interface UseCallSocketReturn {
  activeCalls: ActiveCall[];
  recentCalls: CallEvent[];
  isConnected: boolean;
  reconnect: () => void;
}

export function useCallSocket(serverUrl?: string): UseCallSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [recentCalls, setRecentCalls] = useState<CallEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { accessToken, user } = useAuthStore();

  const connect = useCallback(() => {
    const url = serverUrl || import.meta.env.VITE_API_URL || 'http://localhost:3001';

    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    const newSocket = io(url, {
      transports: ['websocket', 'polling'],
      auth: { token: accessToken },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('[CallSocket] Connected');
      setIsConnected(true);

      // Join admin room for admin users
      if (user?.isAdmin) {
        newSocket.emit('join:admin');
        console.log('[CallSocket] Joined admin room');
      }

      // Join client room if user has clientId
      if (user?.clientId) {
        newSocket.emit('join:client', user.clientId);
        console.log(`[CallSocket] Joined client room: ${user.clientId}`);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('[CallSocket] Disconnected');
      setIsConnected(false);
    });

    newSocket.on('call:started', (data: CallEvent) => {
      console.log('[CallSocket] Call started:', data.callId);
      setActiveCalls(prev => [
        { ...data, startedAt: data.timestamp },
        ...prev.filter(c => c.callId !== data.callId)
      ]);
    });

    newSocket.on('call:ended', (data: CallEvent) => {
      console.log('[CallSocket] Call ended:', data.callId);
      // Remove from active, add to recent
      setActiveCalls(prev => prev.filter(c => c.callId !== data.callId));
      setRecentCalls(prev => [data, ...prev.slice(0, 19)]); // Keep last 20
    });

    socketRef.current = newSocket;
    return newSocket;
  }, [serverUrl, accessToken, user?.isAdmin, user?.clientId]);

  useEffect(() => {
    if (!accessToken) return;

    const sock = connect();
    return () => {
      sock?.disconnect();
      socketRef.current = null;
    };
  }, [connect, accessToken]);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    connect();
  }, [connect]);

  return { activeCalls, recentCalls, isConnected, reconnect };
}

export default useCallSocket;
