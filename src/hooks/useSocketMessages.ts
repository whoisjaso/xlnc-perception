// Divine Agentic Intelligence System - WebSocket Hook for Real-time Message Updates
// Connects to Socket.IO for live queue event streaming

import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { QueueStats } from '../services/divine';

export interface MessageEvent {
  messageId: string;
  channel: 'sms' | 'email';
  recipient: string;
  processingTimeMs?: number;
  error?: string;
  attempts?: number;
  nextRetry?: string;
  status?: string;
}

export interface UseSocketMessagesReturn {
  stats: QueueStats | null;
  recentEvents: MessageEvent[];
  isConnected: boolean;
  reconnect: () => void;
}

export function useSocketMessages(serverUrl?: string): UseSocketMessagesReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<MessageEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const addEvent = useCallback((event: MessageEvent) => {
    setRecentEvents(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 events
  }, []);

  const connect = useCallback(() => {
    const url = serverUrl || import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const newSocket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected for message queue');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('queue:stats', (data: QueueStats) => {
      setStats(data);
    });

    newSocket.on('queue:message:processing', (data: MessageEvent) => {
      addEvent({ ...data, status: 'processing' });
    });

    newSocket.on('queue:message:sent', (data: MessageEvent) => {
      addEvent({ ...data, status: 'sent' });
    });

    newSocket.on('queue:message:failed', (data: MessageEvent) => {
      addEvent({ ...data, status: 'failed' });
    });

    newSocket.on('queue:message:retry', (data: MessageEvent) => {
      addEvent({ ...data, status: 'retry' });
    });

    setSocket(newSocket);

    return newSocket;
  }, [serverUrl, addEvent]);

  useEffect(() => {
    const sock = connect();
    return () => {
      sock.disconnect();
    };
  }, [connect]);

  const reconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
    connect();
  }, [socket, connect]);

  return { stats, recentEvents, isConnected, reconnect };
}

export default useSocketMessages;
