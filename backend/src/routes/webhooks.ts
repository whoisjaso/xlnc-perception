import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { createErrorResponse } from '../utils/theatrical';
import { logTheatrical } from '../utils/logger';
import { db } from '../config/database';
import { callLogs } from '../db/schema/calls';
import { webhookEvents } from '../db/schema/webhookEvents';
import { users } from '../db/schema/users';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import env from '../config/env';
import { CentralRouter } from '../core/router';
import { RetellWebhookEvent } from '../core/types';
import { Text180Provider } from '../services/messaging/providers/txt180';
import { clientConfigService } from '../services/divine/client-config.service';
import { ClientConfig } from '../types';

const router = Router();

/**
 * Verify Retell webhook signature
 */
const verifyRetellSignature = (payload: string, signature: string, secret: string): boolean => {
  if (!secret) {
    logTheatrical.warn('No webhook secret configured, skipping signature verification');
    return true; // Allow in development if no secret set
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    logTheatrical.error(`Signature verification failed: ${error}`);
    return false;
  }
};

/**
 * Map Retell sentiment to our -1 to 1 scale
 */
const mapSentiment = (sentiment?: string): number => {
  if (!sentiment) return 0;

  const sentimentMap: { [key: string]: number } = {
    'Positive': 0.75,
    'Negative': -0.75,
    'Neutral': 0,
    'Very Positive': 1.0,
    'Very Negative': -1.0,
  };

  return sentimentMap[sentiment] ?? 0;
};

/**
 * Find client config by Retell agent ID
 */
const findClientByAgentId = async (agentId: string): Promise<ClientConfig | null> => {
  const allConfigs = await clientConfigService.getAllConfigs();
  return allConfigs.find(config => config.retell_agent_id === agentId) || null;
};

/**
 * Process Retell webhook with client configuration
 */
const processRetellWebhook = async (
  req: Request,
  res: Response,
  clientConfig: ClientConfig
): Promise<void> => {
  const signature = req.headers['x-retell-signature'] as string;
  const payload = JSON.stringify(req.body);

  // Verify signature
  if (env.RETELL_WEBHOOK_SECRET) {
    const isValid = verifyRetellSignature(payload, signature, env.RETELL_WEBHOOK_SECRET);

    if (!isValid) {
      logTheatrical.warn('Invalid webhook signature received');
      res.status(401).json(
        createErrorResponse('Invalid webhook signature', 'UNAUTHORIZED', 401)
      );
      return;
    }
  }

  const webhookData = req.body;
  const eventType = webhookData.event || 'call_ended';

  logTheatrical.info(`Retell webhook received for client ${clientConfig.client_id}: ${eventType}`);

  try {
    // Store raw webhook event with client ID
    await db.insert(webhookEvents).values({
      eventType,
      retellCallId: webhookData.call?.call_id || webhookData.call_id,
      clientId: clientConfig.client_id,
      payload: webhookData,
      processed: false,
    });

    // Process call_ended or call_analyzed events
    if (eventType === 'call_ended' || eventType === 'call_analyzed') {
      const callData = webhookData.call || webhookData;

      // Find user by agent ID
      let userId: string | null = null;

      if (callData.agent_id) {
        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.retellAgentId, callData.agent_id))
          .limit(1);

        if (user) {
          userId = user.id;
        }
      }

      if (!userId) {
        logTheatrical.warn(`No user found for agent_id: ${callData.agent_id}`);
      }

      // Parse call data
      const sentiment = mapSentiment(
        callData.call_analysis?.user_sentiment ||
        callData.call_analysis?.call_sentiment
      );

      const costCents = callData.cost_metadata?.total_cost
        ? Math.round(callData.cost_metadata.total_cost * 100)
        : 0;

      // Upsert call log
      const existingCall = await db
        .select()
        .from(callLogs)
        .where(eq(callLogs.retellCallId, callData.call_id))
        .limit(1);

      if (existingCall.length > 0) {
        await db
          .update(callLogs)
          .set({
            callStatus: callData.call_status || callData.status,
            callOutcome: callData.call_analysis?.call_outcome,
            callSummary: callData.call_analysis?.call_summary,
            userSentiment: sentiment.toString(),
            durationMs: callData.duration_ms,
            costCents,
            recordingUrl: callData.recording_url,
            transcript: callData.transcript_object || callData.transcript,
            metadata: callData,
            endTimestamp: callData.end_timestamp ? new Date(callData.end_timestamp) : new Date(),
          })
          .where(eq(callLogs.retellCallId, callData.call_id));

        logTheatrical.success(`Updated call log: ${callData.call_id}`);
      } else {
        await db.insert(callLogs).values({
          userId: userId!,
          retellCallId: callData.call_id,
          agentId: callData.agent_id,
          fromNumber: callData.from_number,
          toNumber: callData.to_number,
          callStatus: callData.call_status || callData.status,
          callOutcome: callData.call_analysis?.call_outcome,
          callSummary: callData.call_analysis?.call_summary,
          userSentiment: sentiment.toString(),
          durationMs: callData.duration_ms,
          costCents,
          recordingUrl: callData.recording_url,
          transcript: callData.transcript_object || callData.transcript,
          metadata: callData,
          startTimestamp: callData.start_timestamp ? new Date(callData.start_timestamp) : new Date(),
          endTimestamp: callData.end_timestamp ? new Date(callData.end_timestamp) : new Date(),
        });

        logTheatrical.success(`Stored new call log: ${callData.call_id}`);
      }

      // Mark webhook as processed
      await db
        .update(webhookEvents)
        .set({ processed: true })
        .where(eq(webhookEvents.retellCallId, callData.call_id));
    }

    // --- DIVINE AGENTIC SYSTEM INTEGRATION ---

    const routerEvent: RetellWebhookEvent = {
      event_id: crypto.randomUUID(),
      event_type: eventType as any,
      call: webhookData.call || webhookData,
      timestamp: new Date().toISOString()
    };

    const centralRouter = new CentralRouter();
    const decision = await centralRouter.route(routerEvent, clientConfig as any);

    logTheatrical.neural(`Router Decision for ${clientConfig.client_id}: ${decision.action}`);

    // Handle context_request responses
    if (decision.action === 'respond_with_context' && decision.response) {
      return res.status(200).json({
        response_data: {
          retell_llm_dynamic_variables: decision.response
        }
      });
    }

    // Execute immediate actions
    if (decision.actions) {
      for (const action of decision.actions) {
        if (action.type === 'sms' && action.immediate && clientConfig.sms_enabled) {
          if (clientConfig.sms_provider === 'txt180') {
            try {
              const provider = new Text180Provider();
              const body = action.data.customerName
                ? `Hi ${action.data.customerName}, thanks for calling ${clientConfig.business_name}!`
                : `Thanks for calling ${clientConfig.business_name}!`;

              const result = await provider.sendSMS({
                to: action.data.to || routerEvent.call.from_number,
                body: body,
                metadata: { callId: routerEvent.call.call_id, clientId: clientConfig.client_id }
              });

              if (result.success) {
                logTheatrical.success(`SMS sent via Text180 for ${clientConfig.client_id}`);
              } else {
                logTheatrical.error(`Failed to send SMS: ${result.error}`);
              }
            } catch (smsError) {
              logTheatrical.error(`SMS sending exception: ${smsError}`);
            }
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed by Divine System',
      client: clientConfig.client_id,
      event: eventType,
      decision: decision.action
    });

  } catch (error) {
    logTheatrical.error(`Webhook processing error for ${clientConfig.client_id}: ${error}`);

    res.status(200).json({
      success: false,
      message: 'Webhook received but processing failed',
      client: clientConfig.client_id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * POST /api/webhooks/retell/:clientId
 * Handle Retell webhooks with explicit client ID (RECOMMENDED)
 */
router.post('/retell/:clientId', asyncHandler(async (req: Request, res: Response) => {
  const { clientId } = req.params;

  // Load client configuration
  const clientConfig = await clientConfigService.getConfig(clientId);

  if (!clientConfig) {
    logTheatrical.warn(`Unknown client ID in webhook: ${clientId}`);
    return res.status(404).json(
      createErrorResponse(`Client configuration not found: ${clientId}`, 'NOT_FOUND', 404)
    );
  }

  logTheatrical.info(`Loading config for client: ${clientConfig.client_id} (${clientConfig.business_name})`);

  await processRetellWebhook(req, res, clientConfig);
}));

/**
 * POST /api/webhooks/retell/:clientId/function
 * Handle Retell function calls with explicit client ID
 */
router.post('/retell/:clientId/function', asyncHandler(async (req: Request, res: Response) => {
  const { clientId } = req.params;

  const clientConfig = await clientConfigService.getConfig(clientId);

  if (!clientConfig) {
    logTheatrical.warn(`Unknown client ID in function call: ${clientId}`);
    return res.status(404).json(
      createErrorResponse(`Client configuration not found: ${clientId}`, 'NOT_FOUND', 404)
    );
  }

  logTheatrical.info(`Function call for client: ${clientConfig.client_id}`);

  // Import function dispatcher
  const { functionDispatcherService } = await import('../services/divine/function-dispatcher.service');

  const result = await functionDispatcherService.dispatch(req.body, clientConfig);

  res.status(200).json({
    response: result.response.response,
    data: result.response.data,
  });
}));

/**
 * POST /api/webhooks/retell
 * Handle Retell webhooks - attempts to find client by agent ID
 * (Fallback route - prefer using /retell/:clientId)
 */
router.post('/retell', asyncHandler(async (req: Request, res: Response) => {
  const webhookData = req.body;
  const agentId = webhookData.call?.agent_id || webhookData.agent_id;

  logTheatrical.info(`Retell webhook received (no clientId), agent_id: ${agentId}`);

  // Try to find client by agent ID
  let clientConfig: ClientConfig | null = null;

  if (agentId) {
    clientConfig = await findClientByAgentId(agentId);
  }

  if (!clientConfig) {
    // Fall back to default config
    logTheatrical.warn(`No client config found for agent_id: ${agentId}, using defaults`);
    clientConfig = await clientConfigService.getConfigOrDefault('default');
  } else {
    logTheatrical.info(`Found client config by agent_id: ${clientConfig.client_id}`);
  }

  await processRetellWebhook(req, res, clientConfig);
}));

/**
 * GET /api/webhooks/retell/test
 * Test endpoint to verify webhook is accessible
 */
router.get('/retell/test', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Retell webhook endpoint is accessible',
    urls: {
      withClientId: '/api/webhooks/retell/:clientId',
      withoutClientId: '/api/webhooks/retell',
      functionCall: '/api/webhooks/retell/:clientId/function',
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/webhooks/retell/:clientId/test
 * Test endpoint to verify client-specific webhook
 */
router.get('/retell/:clientId/test', asyncHandler(async (req: Request, res: Response) => {
  const { clientId } = req.params;

  const clientConfig = await clientConfigService.getConfig(clientId);

  if (!clientConfig) {
    return res.status(404).json({
      success: false,
      message: `Client configuration not found: ${clientId}`,
      availableClients: await clientConfigService.listClients(),
    });
  }

  res.json({
    success: true,
    message: `Webhook endpoint configured for ${clientConfig.business_name}`,
    client: {
      id: clientConfig.client_id,
      name: clientConfig.business_name,
      industry: clientConfig.industry,
      features: {
        sms_enabled: clientConfig.sms_enabled,
        email_enabled: clientConfig.email_enabled,
        appointment_booking_enabled: clientConfig.appointment_booking_enabled,
        zoho_crm_enabled: clientConfig.zoho_crm_enabled,
      },
    },
    webhookUrl: `/api/webhooks/retell/${clientId}`,
    functionCallUrl: `/api/webhooks/retell/${clientId}/function`,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/webhooks/clients
 * List all configured clients
 */
router.get('/clients', asyncHandler(async (req: Request, res: Response) => {
  const clients = await clientConfigService.listClients();
  const configs = await clientConfigService.getAllConfigs();

  res.json({
    success: true,
    count: clients.length,
    clients: configs.map(c => ({
      id: c.client_id,
      name: c.business_name,
      industry: c.industry,
      webhookUrl: `/api/webhooks/retell/${c.client_id}`,
    })),
  });
}));

export default router;
