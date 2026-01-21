import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/useAuthStore';
import { useErrorStore } from '../stores/useErrorStore';
import { ErrorLogEntry } from '../services/divine';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ErrorEvent {
  id?: string;
  service: string;
  operation: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  clientId?: string;
  timestamp: string;
}

export const useErrorSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, user } = useAuthStore();
  const { addError } = useErrorStore();

  const handleErrorLogged = useCallback((data: ErrorEvent) => {
    const errorEntry: ErrorLogEntry = {
      id: data.id || `temp-${Date.now()}`,
      service: data.service,
      operation: data.operation,
      errorType: 'runtime_error',
      errorMessage: data.message,
      context: {},
      clientId: data.clientId,
      severity: data.severity,
      notified: false,
      resolved: false,
      createdAt: data.timestamp,
    };
    addError(errorEntry);
  }, [addError]);

  useEffect(() => {
    // Only connect if user has a clientId (non-admin users linked to a client)
    if (!accessToken || !user?.clientId) {
      return;
    }

    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token: accessToken },
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[ErrorSocket] Connected');

      // Join client room
      if (user.clientId) {
        socket.emit('join:client', user.clientId);
        console.log(`[ErrorSocket] Joined client room: ${user.clientId}`);
      }

      // Admins also join admin room
      if (user.isAdmin) {
        socket.emit('join:admin');
        console.log('[ErrorSocket] Joined admin room');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[ErrorSocket] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[ErrorSocket] Connection error:', error.message);
    });

    // Listen for new errors
    socket.on('error:logged', handleErrorLogged);

    // Critical errors
    socket.on('error:critical', (data: ErrorEvent) => {
      console.warn('[ErrorSocket] Critical error received:', data);
      handleErrorLogged({ ...data, severity: 'critical' });
    });

    // Error acknowledged
    socket.on('error:acknowledged', (data: { errorId: string; acknowledgedBy?: string }) => {
      console.log('[ErrorSocket] Error acknowledged:', data);
    });

    // Error resolved
    socket.on('error:resolved', (data: { errorId: string; resolvedBy?: string }) => {
      console.log('[ErrorSocket] Error resolved:', data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, user?.clientId, user?.isAdmin, handleErrorLogged]);

  return socketRef.current;
};

export default useErrorSocket;
