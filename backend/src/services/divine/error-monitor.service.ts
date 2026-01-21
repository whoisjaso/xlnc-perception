// Divine Agentic Intelligence System - Error Monitor Service
// Comprehensive error tracking, aggregation, and alerting

import { db } from '../../config/database';
import { errorLogs, ErrorLog, NewErrorLog } from '../../db/schema/errorLogs';
import { eq, and, gte, desc, sql, count } from 'drizzle-orm';
import { logger } from '../../utils/logger';
import { slackService } from './slack.service';
import { Server as SocketServer } from 'socket.io';
import { AlertSeverity, ErrorLogEntry } from '../../types';

export interface ErrorStats {
  total: number;
  byService: Record<string, number>;
  bySeverity: Record<string, number>;
  byClient: Record<string, number>;
  recentErrors: ErrorLogEntry[];
}

export interface ErrorBuffer {
  entries: NewErrorLog[];
  lastFlush: number;
}

export class ErrorMonitorService {
  private io: SocketServer | null = null;
  private errorBuffer: ErrorBuffer = {
    entries: [],
    lastFlush: Date.now(),
  };
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BUFFER_FLUSH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly BUFFER_MAX_SIZE = 100;
  private readonly CRITICAL_ERROR_THRESHOLD = 5; // Alert if 5+ critical errors in window

  setSocketServer(io: SocketServer): void {
    this.io = io;
    logger.info('Socket.IO server attached to error monitor');
  }

  start(): void {
    if (this.flushInterval) {
      logger.warn('Error monitor already running');
      return;
    }

    logger.info('Starting error monitor');
    this.flushInterval = setInterval(
      () => this.flushBuffer(),
      this.BUFFER_FLUSH_INTERVAL_MS
    );
  }

  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
      // Flush any remaining errors
      this.flushBuffer();
      logger.info('Error monitor stopped');
    }
  }

  async logError(
    service: string,
    operation: string,
    error: Error | string,
    context: {
      clientId?: string;
      callId?: string;
      userId?: string;
      severity?: AlertSeverity;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<void> {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stackTrace = typeof error === 'string' ? undefined : error.stack;
    const severity = context.severity || this.determineSeverity(service, errorMessage);

    const logEntry: NewErrorLog = {
      service,
      operation,
      errorType: this.categorizeError(errorMessage),
      errorMessage,
      stackTrace,
      context: {
        ...context.metadata,
        callId: context.callId,
      },
      clientId: context.clientId,
      userId: context.userId,
      severity,
      notified: false,
      resolved: false,
    };

    // Log to Winston
    logger.error(
      {
        service,
        operation,
        error: errorMessage,
        clientId: context.clientId,
        callId: context.callId,
        severity,
      },
      `${service} error: ${operation}`
    );

    // Critical errors get immediate notification
    if (severity === 'critical') {
      await this.handleCriticalError(logEntry);
    } else {
      // Buffer non-critical errors
      this.bufferError(logEntry);
    }

    // Emit via WebSocket
    if (this.io) {
      const errorEvent = {
        service,
        operation,
        severity,
        message: errorMessage,
        clientId: context.clientId,
        timestamp: new Date().toISOString(),
      };

      // Emit to admin room
      this.io.to('admin').emit('error:logged', errorEvent);

      // Emit to client-specific room if clientId exists
      if (context.clientId) {
        this.io.to(`client:${context.clientId}`).emit('error:logged', errorEvent);
      }
    }
  }

  private bufferError(entry: NewErrorLog): void {
    this.errorBuffer.entries.push(entry);

    // Flush if buffer is full
    if (this.errorBuffer.entries.length >= this.BUFFER_MAX_SIZE) {
      this.flushBuffer();
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.errorBuffer.entries.length === 0) {
      return;
    }

    const entries = [...this.errorBuffer.entries];
    this.errorBuffer.entries = [];
    this.errorBuffer.lastFlush = Date.now();

    try {
      // Batch insert to database
      await db.insert(errorLogs).values(entries);

      // Aggregate and send summary alert
      await this.sendSummaryAlert(entries);

      logger.info({ count: entries.length }, 'Error buffer flushed');
    } catch (error) {
      logger.error({ error }, 'Failed to flush error buffer');
      // Re-add entries to buffer
      this.errorBuffer.entries = [...entries, ...this.errorBuffer.entries];
    }
  }

  private async handleCriticalError(entry: NewErrorLog): Promise<void> {
    // Immediately save to database
    await db.insert(errorLogs).values({ ...entry, notified: true });

    // Send immediate Slack alert
    await slackService.sendAlert({
      severity: 'critical',
      title: `CRITICAL: ${entry.service} - ${entry.operation}`,
      message: entry.errorMessage,
      fields: [
        { name: 'Service', value: entry.service },
        { name: 'Operation', value: entry.operation },
        { name: 'Client', value: entry.clientId || 'N/A' },
        { name: 'Error Type', value: entry.errorType || 'Unknown' },
      ],
    });

    // Emit critical alert via WebSocket
    if (this.io) {
      const criticalEvent = {
        service: entry.service,
        operation: entry.operation,
        message: entry.errorMessage,
        clientId: entry.clientId,
        timestamp: new Date().toISOString(),
      };

      // Emit to admin room
      this.io.to('admin').emit('error:critical', criticalEvent);

      // Emit to client-specific room if clientId exists
      if (entry.clientId) {
        this.io.to(`client:${entry.clientId}`).emit('error:critical', criticalEvent);
      }
    }

    logger.error(
      { service: entry.service, operation: entry.operation },
      'Critical error handled'
    );
  }

  private async sendSummaryAlert(entries: NewErrorLog[]): Promise<void> {
    if (entries.length === 0) return;

    // Group by service
    const byService: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const entry of entries) {
      byService[entry.service] = (byService[entry.service] || 0) + 1;
      if (entry.severity) {
        bySeverity[entry.severity] = (bySeverity[entry.severity] || 0) + 1;
      }
    }

    // Only send alert if there are warnings or errors
    const significantErrors = entries.filter(
      (e) => e.severity === 'warning' || e.severity === 'error'
    );

    if (significantErrors.length === 0) return;

    const serviceList = Object.entries(byService)
      .map(([service, count]) => `${service}: ${count}`)
      .join(', ');

    await slackService.sendAlert({
      severity: 'warning',
      title: `Error Summary (Last ${Math.round(this.BUFFER_FLUSH_INTERVAL_MS / 60000)} mins)`,
      message: `${entries.length} errors logged`,
      fields: [
        { name: 'By Service', value: serviceList },
        { name: 'Warnings', value: String(bySeverity['warning'] || 0) },
        { name: 'Errors', value: String(bySeverity['error'] || 0) },
      ],
    });
  }

  // ============================================
  // ERROR CLASSIFICATION
  // ============================================

  private determineSeverity(service: string, message: string): AlertSeverity {
    const lower = message.toLowerCase();

    // Critical patterns
    if (
      lower.includes('database connection') ||
      lower.includes('authentication failed') ||
      lower.includes('rate limit exceeded') ||
      lower.includes('out of memory') ||
      lower.includes('service unavailable')
    ) {
      return 'critical';
    }

    // Error patterns
    if (
      lower.includes('failed') ||
      lower.includes('error') ||
      lower.includes('exception') ||
      lower.includes('timeout')
    ) {
      return 'error';
    }

    // Warning patterns
    if (
      lower.includes('warning') ||
      lower.includes('retry') ||
      lower.includes('deprecated') ||
      lower.includes('slow')
    ) {
      return 'warning';
    }

    return 'info';
  }

  private categorizeError(message: string): string {
    const lower = message.toLowerCase();

    if (lower.includes('network') || lower.includes('connection') || lower.includes('timeout')) {
      return 'network_error';
    }
    if (lower.includes('auth') || lower.includes('token') || lower.includes('permission')) {
      return 'authentication_error';
    }
    if (lower.includes('validation') || lower.includes('invalid') || lower.includes('required')) {
      return 'validation_error';
    }
    if (lower.includes('rate limit') || lower.includes('quota') || lower.includes('throttle')) {
      return 'rate_limit_error';
    }
    if (lower.includes('not found') || lower.includes('404')) {
      return 'not_found_error';
    }
    if (lower.includes('database') || lower.includes('query') || lower.includes('sql')) {
      return 'database_error';
    }
    if (lower.includes('parse') || lower.includes('json') || lower.includes('format')) {
      return 'parsing_error';
    }

    return 'unknown_error';
  }

  // ============================================
  // STATS & QUERIES
  // ============================================

  async getStats(hours: number = 24): Promise<ErrorStats> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const errors = await db
      .select()
      .from(errorLogs)
      .where(gte(errorLogs.createdAt, since))
      .orderBy(desc(errorLogs.createdAt));

    const byService: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byClient: Record<string, number> = {};

    for (const error of errors) {
      byService[error.service] = (byService[error.service] || 0) + 1;
      if (error.severity) {
        bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      }
      if (error.clientId) {
        byClient[error.clientId] = (byClient[error.clientId] || 0) + 1;
      }
    }

    return {
      total: errors.length,
      byService,
      bySeverity,
      byClient,
      recentErrors: errors.slice(0, 20).map((e) => ({
        id: e.id,
        service: e.service,
        operation: e.operation,
        errorType: e.errorType || 'unknown',
        errorMessage: e.errorMessage,
        stackTrace: e.stackTrace || undefined,
        context: (e.context as Record<string, unknown>) || {},
        clientId: e.clientId || undefined,
        callId: undefined,
        userId: e.userId || undefined,
        severity: (e.severity as AlertSeverity) || 'info',
        notified: e.notified || false,
        resolved: e.resolved || false,
        resolvedAt: e.resolvedAt?.toISOString(),
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }

  async getRecentErrors(limit: number = 50): Promise<ErrorLog[]> {
    return db
      .select()
      .from(errorLogs)
      .orderBy(desc(errorLogs.createdAt))
      .limit(limit);
  }

  async getUnresolvedErrors(): Promise<ErrorLog[]> {
    return db
      .select()
      .from(errorLogs)
      .where(eq(errorLogs.resolved, false))
      .orderBy(desc(errorLogs.createdAt));
  }

  async resolveError(errorId: string, resolvedBy?: string): Promise<void> {
    await db
      .update(errorLogs)
      .set({
        resolved: true,
        resolvedAt: new Date(),
      })
      .where(eq(errorLogs.id, errorId));

    logger.info({ errorId, resolvedBy }, 'Error marked as resolved');

    // Emit via WebSocket
    if (this.io) {
      this.io.emit('error:resolved', { errorId, resolvedBy });
    }
  }

  async getErrorsByClient(
    clientId: string,
    limit: number = 50,
    includeResolved: boolean = true
  ): Promise<ErrorLog[]> {
    const conditions = includeResolved
      ? eq(errorLogs.clientId, clientId)
      : and(eq(errorLogs.clientId, clientId), eq(errorLogs.resolved, false));

    return db
      .select()
      .from(errorLogs)
      .where(conditions)
      .orderBy(desc(errorLogs.createdAt))
      .limit(limit);
  }

  async getErrorsByService(service: string, limit: number = 50): Promise<ErrorLog[]> {
    return db
      .select()
      .from(errorLogs)
      .where(eq(errorLogs.service, service))
      .orderBy(desc(errorLogs.createdAt))
      .limit(limit);
  }

  /**
   * Get error statistics for a specific client
   */
  async getClientStats(clientId: string, hours: number = 24): Promise<{
    total: number;
    unresolved: number;
    critical: number;
    bySeverity: Record<string, number>;
    byService: Record<string, number>;
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const errors = await db
      .select()
      .from(errorLogs)
      .where(and(eq(errorLogs.clientId, clientId), gte(errorLogs.createdAt, since)))
      .orderBy(desc(errorLogs.createdAt));

    const bySeverity: Record<string, number> = {};
    const byService: Record<string, number> = {};
    let unresolved = 0;
    let critical = 0;

    for (const error of errors) {
      if (error.severity) {
        bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
        if (error.severity === 'critical') critical++;
      }
      byService[error.service] = (byService[error.service] || 0) + 1;
      if (!error.resolved) unresolved++;
    }

    return {
      total: errors.length,
      unresolved,
      critical,
      bySeverity,
      byService,
    };
  }

  /**
   * Acknowledge an error (client user marks as seen, doesn't fully resolve)
   * Returns false if error doesn't exist or doesn't belong to the client
   */
  async acknowledgeError(errorId: string, clientId: string, acknowledgedBy?: string): Promise<boolean> {
    // First verify the error belongs to this client
    const [error] = await db
      .select()
      .from(errorLogs)
      .where(and(eq(errorLogs.id, errorId), eq(errorLogs.clientId, clientId)))
      .limit(1);

    if (!error) {
      return false;
    }

    // Update the error with acknowledgment info in context
    const existingContext = (error.context as Record<string, unknown>) || {};
    await db
      .update(errorLogs)
      .set({
        context: {
          ...existingContext,
          acknowledged: true,
          acknowledgedBy,
          acknowledgedAt: new Date().toISOString(),
        },
      })
      .where(eq(errorLogs.id, errorId));

    logger.info({ errorId, clientId, acknowledgedBy }, 'Error acknowledged by client');

    // Emit via WebSocket to client room
    if (this.io) {
      this.io.to(`client:${clientId}`).emit('error:acknowledged', { errorId, acknowledgedBy });
    }

    return true;
  }
}

export const errorMonitorService = new ErrorMonitorService();
