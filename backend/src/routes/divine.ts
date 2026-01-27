// Divine Agentic Intelligence System - API Routes
// Comprehensive endpoints for voice AI automation management

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.middleware';
import { createTheatricalResponse, createErrorResponse } from '../utils/theatrical';
import { logger } from '../utils/logger';
import {
  getDivineServicesStatus,
  getDivineSystemStatus,
  webhookHandlerService,
  functionDispatcherService,
  clientConfigService,
  queueProcessorService,
  messageQueueService,
  errorMonitorService,
  conversationService,
  customerService,
  intentClassifierService,
  prismService,
} from '../services/divine';
import { ClientConfigSchema } from '../types';

const router = Router();

// ============================================
// WEBHOOK ENDPOINTS (No Auth - External)
// ============================================

/**
 * POST /divine/webhooks/retell/:clientId
 * Main Retell webhook endpoint for all event types
 */
router.post('/webhooks/retell/:clientId', async (req: Request, res: Response) => {
  const { clientId } = req.params;
  const startTime = Date.now();

  try {
    // Load client config
    const config = await clientConfigService.getConfig(clientId);
    if (!config) {
      logger.warn({ clientId }, 'Webhook received for unknown client');
      return res.status(404).json({ error: 'Unknown client' });
    }

    // Route to webhook handler
    const result = await webhookHandlerService.validateAndRoute(
      req.body,
      clientId,
      config
    );

    const processingTime = Date.now() - startTime;
    logger.info(
      { clientId, processingTime, success: result.success },
      'Webhook processed'
    );

    res.status(result.success ? 200 : 400).json(result.response);
  } catch (error) {
    logger.error({ error, clientId }, 'Webhook processing error');
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

/**
 * POST /divine/webhooks/retell/:clientId/function
 * Retell function call endpoint
 */
router.post('/webhooks/retell/:clientId/function', async (req: Request, res: Response) => {
  const { clientId } = req.params;
  const startTime = Date.now();

  try {
    const config = await clientConfigService.getConfig(clientId);
    if (!config) {
      return res.status(404).json({ error: 'Unknown client' });
    }

    const result = await functionDispatcherService.dispatch(req.body, config);

    const processingTime = Date.now() - startTime;
    logger.info(
      { clientId, processingTime, success: result.success },
      'Function call processed'
    );

    res.json(result.response);
  } catch (error) {
    logger.error({ error, clientId }, 'Function call error');
    res.status(500).json({
      response: "I'm sorry, I encountered an error. Let me try something else.",
    });
  }
});

// ============================================
// SYSTEM STATUS ENDPOINTS
// ============================================

/**
 * GET /divine/status
 * Get Divine system status (authenticated)
 */
router.get('/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const status = await getDivineSystemStatus();

    res.json(
      createTheatricalResponse({
        ...status,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    logger.error({ error }, 'Error getting system status');
    res.status(500).json(createErrorResponse('Failed to get system status', 500));
  }
});

/**
 * GET /divine/services
 * Get individual service status
 */
router.get('/services', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const services = getDivineServicesStatus();
    res.json(createTheatricalResponse({ services }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to get service status', 500));
  }
});

// ============================================
// CLIENT CONFIGURATION ENDPOINTS (Admin)
// ============================================

/**
 * GET /divine/clients
 * List all client configurations (returns full config data)
 */
router.get('/clients', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const configs = await clientConfigService.getAllConfigs();
    res.json(
      createTheatricalResponse({
        clients: configs,
        total: configs.length,
      })
    );
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to list clients', 500));
  }
});

/**
 * GET /divine/clients/:clientId
 * Get specific client configuration
 */
router.get('/clients/:clientId', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const config = await clientConfigService.getConfig(req.params.clientId);
    if (!config) {
      return res.status(404).json(createErrorResponse('Client not found', 404));
    }
    res.json(createTheatricalResponse({ config }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to get client', 500));
  }
});

/**
 * POST /divine/clients
 * Create new client configuration
 */
router.post('/clients', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = ClientConfigSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(createErrorResponse(result.error.message, 400));
    }

    await clientConfigService.saveConfig(result.data);
    res.status(201).json(createTheatricalResponse({ config: result.data }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to create client', 500));
  }
});

/**
 * PATCH /divine/clients/:clientId
 * Update client configuration
 */
router.patch('/clients/:clientId', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await clientConfigService.updateConfig(req.params.clientId, req.body);
    if (!updated) {
      return res.status(404).json(createErrorResponse('Client not found', 404));
    }
    res.json(createTheatricalResponse({ config: updated }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to update client', 500));
  }
});

// ============================================
// QUEUE MANAGEMENT ENDPOINTS (Admin)
// ============================================

/**
 * GET /divine/queue/stats
 * Get message queue statistics
 */
router.get('/queue/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await queueProcessorService.getStats();
    res.json(createTheatricalResponse({ stats }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to get queue stats', 500));
  }
});

/**
 * GET /divine/queue/messages
 * Get recent messages in queue
 */
router.get('/queue/messages', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId, limit = '50' } = req.query;
    const messages = await queueProcessorService.getRecentMessages(
      clientId as string | undefined,
      parseInt(limit as string)
    );
    res.json(createTheatricalResponse({ messages, total: messages.length }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to get messages', 500));
  }
});

/**
 * GET /divine/queue/failed
 * Get failed messages
 */
router.get('/queue/failed', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.query;
    const messages = await queueProcessorService.getFailedMessages(clientId as string | undefined);
    res.json(createTheatricalResponse({ messages, total: messages.length }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to get failed messages', 500));
  }
});

/**
 * POST /divine/queue/retry/:messageId
 * Retry a failed message
 */
router.post('/queue/retry/:messageId', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const success = await queueProcessorService.retryMessage(req.params.messageId);
    if (!success) {
      return res.status(404).json(createErrorResponse('Message not found or not failed', 404));
    }
    res.json(createTheatricalResponse({ retried: true }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to retry message', 500));
  }
});

/**
 * POST /divine/queue/retry/:messageId/edit
 * Retry a failed message with edited content
 */
router.post('/queue/retry/:messageId/edit', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const { body, subject } = req.body;

    if (!body) {
      return res.status(400).json(createErrorResponse('Body is required', 400));
    }

    const success = await queueProcessorService.retryMessageWithEdit(messageId, {
      body,
      subject,
      editedBy: req.user?.email
    });

    if (!success) {
      return res.status(404).json(createErrorResponse('Message not found or not retryable', 404));
    }

    res.json(createTheatricalResponse({ retried: true, edited: true }));
  } catch (error) {
    logger.error({ error }, 'Failed to retry message with edit');
    res.status(500).json(createErrorResponse('Failed to retry message', 500));
  }
});

/**
 * POST /divine/queue/manual
 * Send a manual ad-hoc message
 */
router.post('/queue/manual', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId, channel, recipient, subject, body, scheduledFor } = req.body;

    if (!clientId || !channel || !recipient || !body) {
      return res.status(400).json(createErrorResponse('Missing required fields: clientId, channel, recipient, body', 400));
    }

    if (channel !== 'sms' && channel !== 'email') {
      return res.status(400).json(createErrorResponse('Channel must be sms or email', 400));
    }

    let message;
    if (channel === 'sms') {
      message = await messageQueueService.enqueueSMS(clientId, recipient, body, {
        scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
        messageType: 'manual',
        metadata: { sentBy: req.user?.email, manual: true }
      });
    } else {
      if (!subject) {
        return res.status(400).json(createErrorResponse('Subject required for email', 400));
      }
      message = await messageQueueService.enqueueEmail(clientId, recipient, subject, body, {
        scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
        messageType: 'manual',
        metadata: { sentBy: req.user?.email, manual: true }
      });
    }

    logger.info({ messageId: message.id, channel, recipient: recipient.slice(-4) }, 'Manual message queued');

    res.status(201).json(createTheatricalResponse({ message, queued: true }));
  } catch (error) {
    logger.error({ error }, 'Failed to queue manual message');
    res.status(500).json(createErrorResponse('Failed to queue message', 500));
  }
});

/**
 * DELETE /divine/queue/:messageId
 * Cancel a pending message
 */
router.delete('/queue/:messageId', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const success = await queueProcessorService.cancelMessage(req.params.messageId);
    if (!success) {
      return res.status(404).json(createErrorResponse('Message not found or already sent', 404));
    }
    res.json(createTheatricalResponse({ cancelled: true }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to cancel message', 500));
  }
});

/**
 * GET /divine/queue/scheduled
 * Get scheduled messages for the next N hours (default 48)
 */
router.get('/queue/scheduled', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId, hours = '48' } = req.query;
    const messages = await messageQueueService.getScheduledMessages(
      parseInt(hours as string),
      clientId as string | undefined
    );
    res.json(createTheatricalResponse({ messages, total: messages.length }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to get scheduled messages', 500));
  }
});

/**
 * GET /divine/queue/dead-letter
 * Get dead letter messages
 */
router.get('/queue/dead-letter', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.query;
    const messages = await queueProcessorService.getDeadLetterMessages(clientId as string | undefined);
    res.json(createTheatricalResponse({ messages, total: messages.length }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to get dead letter messages', 500));
  }
});

// ============================================
// ERROR MONITORING ENDPOINTS (Admin)
// ============================================

/**
 * GET /divine/errors
 * Get recent error logs
 */
router.get('/errors', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '50' } = req.query;
    const errors = await errorMonitorService.getRecentErrors(parseInt(limit as string));
    const unresolved = await errorMonitorService.getUnresolvedErrors();

    res.json(
      createTheatricalResponse({
        errors,
        total: errors.length,
        unresolvedCount: unresolved.length,
      })
    );
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to get recent errors', 500));
  }
});

/**
 * GET /divine/errors/stats
 * Get error statistics
 */
router.get('/errors/stats', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { hours = '24' } = req.query;
    const stats = await errorMonitorService.getStats(parseInt(hours as string));
    res.json(createTheatricalResponse({ stats }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to get error stats', 500));
  }
});

/**
 * GET /divine/errors
 * Get recent errors
 */
router.get('/errors', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '50' } = req.query;
    const errors = await errorMonitorService.getRecentErrors(parseInt(limit as string));
    res.json(createTheatricalResponse({ errors, total: errors.length }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to get errors', 500));
  }
});

/**
 * GET /divine/errors/unresolved
 * Get unresolved errors
 */
router.get('/errors/unresolved', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const errors = await errorMonitorService.getUnresolvedErrors();
    res.json(createTheatricalResponse({ errors, total: errors.length }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to get unresolved errors', 500));
  }
});

/**
 * POST /divine/errors/:errorId/resolve
 * Mark error as resolved
 */
router.post('/errors/:errorId/resolve', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await errorMonitorService.resolveError(req.params.errorId, req.user?.email);
    res.json(createTheatricalResponse({ resolved: true }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to resolve error', 500));
  }
});

// ============================================
// CLIENT ERROR ENDPOINTS (Non-Admin)
// Allows users to see errors for their associated client
// ============================================

/**
 * GET /divine/errors/client
 * Get errors for authenticated user's client
 */
router.get('/errors/client', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const clientId = req.user?.clientId;
    if (!clientId) {
      return res.status(400).json(createErrorResponse('No client associated with your account', 400));
    }

    const { limit = '20', includeResolved = 'false' } = req.query;
    const errors = await errorMonitorService.getErrorsByClient(
      clientId,
      parseInt(limit as string),
      includeResolved === 'true'
    );

    res.json(
      createTheatricalResponse({
        errors,
        total: errors.length,
        clientId,
      })
    );
  } catch (error) {
    logger.error({ error }, 'Failed to get client errors');
    res.status(500).json(createErrorResponse('Failed to get client errors', 500));
  }
});

/**
 * GET /divine/errors/client/stats
 * Get error stats for authenticated user's client
 */
router.get('/errors/client/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const clientId = req.user?.clientId;
    if (!clientId) {
      return res.status(400).json(createErrorResponse('No client associated with your account', 400));
    }

    const { hours = '24' } = req.query;
    const stats = await errorMonitorService.getClientStats(clientId, parseInt(hours as string));

    res.json(createTheatricalResponse({ stats, clientId }));
  } catch (error) {
    logger.error({ error }, 'Failed to get client error stats');
    res.status(500).json(createErrorResponse('Failed to get error stats', 500));
  }
});

/**
 * POST /divine/errors/:errorId/acknowledge
 * Acknowledge an error as a client user (doesn't fully resolve, just marks seen)
 */
router.post('/errors/:errorId/acknowledge', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const clientId = req.user?.clientId;
    if (!clientId) {
      return res.status(400).json(createErrorResponse('No client associated with your account', 400));
    }

    // Verify error belongs to user's client before acknowledging
    const acknowledged = await errorMonitorService.acknowledgeError(
      req.params.errorId,
      clientId,
      req.user?.email
    );

    if (!acknowledged) {
      return res.status(404).json(createErrorResponse('Error not found or not accessible', 404));
    }

    res.json(createTheatricalResponse({ acknowledged: true }));
  } catch (error) {
    logger.error({ error }, 'Failed to acknowledge error');
    res.status(500).json(createErrorResponse('Failed to acknowledge error', 500));
  }
});

// ============================================
// CONVERSATION & ANALYTICS ENDPOINTS
// ============================================

/**
 * GET /divine/conversations
 * Get conversations for a client
 */
router.get('/conversations', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId, limit = '50' } = req.query;
    if (!clientId) {
      return res.status(400).json(createErrorResponse('clientId required', 400));
    }
    const conversations = await conversationService.getRecentByClient(
      clientId as string,
      parseInt(limit as string)
    );
    res.json(createTheatricalResponse({ conversations, total: conversations.length }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to get conversations', 500));
  }
});

/**
 * GET /divine/conversations/stats
 * Get conversation statistics
 */
router.get('/conversations/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId, hours = '24' } = req.query;
    if (!clientId) {
      return res.status(400).json(createErrorResponse('clientId required', 400));
    }
    const stats = await conversationService.getStats(
      clientId as string,
      parseInt(hours as string)
    );
    res.json(createTheatricalResponse({ stats }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to get stats', 500));
  }
});

/**
 * GET /divine/conversations/:callId
 * Get specific conversation by call ID
 */
router.get('/conversations/:callId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const conversation = await conversationService.getByCallId(req.params.callId);
    if (!conversation) {
      return res.status(404).json(createErrorResponse('Conversation not found', 404));
    }
    res.json(createTheatricalResponse({ conversation }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to get conversation', 500));
  }
});

// ============================================
// CUSTOMER ENDPOINTS
// ============================================

/**
 * GET /divine/customers/:phone
 * Get customer by phone
 */
router.get('/customers/:phone', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const customer = await customerService.getByPhone(req.params.phone);
    if (!customer) {
      return res.status(404).json(createErrorResponse('Customer not found', 404));
    }
    res.json(createTheatricalResponse({ customer }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to get customer', 500));
  }
});

/**
 * GET /divine/customers/:customerId/conversations
 * Get customer's conversation history
 */
router.get('/customers/:customerId/conversations', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '10' } = req.query;
    const conversations = await conversationService.getCustomerConversations(
      req.params.customerId,
      parseInt(limit as string)
    );
    res.json(createTheatricalResponse({ conversations, total: conversations.length }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to get conversations', 500));
  }
});

// ============================================
// ANALYSIS ENDPOINTS
// ============================================

/**
 * POST /divine/analyze/transcript
 * Analyze a transcript
 */
router.post('/analyze/transcript', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json(createErrorResponse('transcript required', 400));
    }

    const [intent, prism] = await Promise.all([
      intentClassifierService.classify(transcript),
      Promise.resolve(prismService.analyzeTranscript(transcript)),
    ]);

    res.json(
      createTheatricalResponse({
        intent: intent.intent,
        prism,
        processingTimeMs: intent.processingTimeMs,
      })
    );
  } catch (error) {
    res.status(500).json(createErrorResponse('Analysis failed', 500));
  }
});

/**
 * POST /divine/analyze/full
 * Full conversation analysis
 */
router.post('/analyze/full', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json(createErrorResponse('transcript required', 400));
    }

    const result = await intentClassifierService.analyzeConversation(transcript);
    res.json(
      createTheatricalResponse({
        analysis: result.analysis,
        processingTimeMs: result.processingTimeMs,
      })
    );
  } catch (error) {
    res.status(500).json(createErrorResponse('Analysis failed', 500));
  }
});

export default router;
