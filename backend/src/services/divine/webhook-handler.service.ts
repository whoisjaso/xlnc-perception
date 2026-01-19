// Divine Agentic Intelligence System - Webhook Handler Service
// Central routing for all Retell webhook events

import { logger } from '../../utils/logger';
import {
  RetellWebhookEvent,
  RetellWebhookEventSchema,
  RetellCall,
  ClientConfig,
  WebhookResponse,
} from '../../types';
import { customerService } from './customer.service';
import { conversationService } from './conversation.service';
import { contextBuilderService } from './context-builder.service';
import { postCallProcessor } from './post-call-processor';
import { slackService } from './slack.service';

export interface WebhookHandlerResult {
  success: boolean;
  response: WebhookResponse;
  backgroundJobQueued?: boolean;
}

export class WebhookHandlerService {
  private readonly eventHandlers: Map<string, (call: RetellCall, config: ClientConfig) => Promise<WebhookResponse>>;

  constructor() {
    this.eventHandlers = new Map([
      ['call_started', this.handleCallStarted.bind(this)],
      ['call_ended', this.handleCallEnded.bind(this)],
      ['call_analyzed', this.handleCallAnalyzed.bind(this)],
    ]);
  }

  async validateAndRoute(
    rawPayload: unknown,
    clientId: string,
    clientConfig: ClientConfig
  ): Promise<WebhookHandlerResult> {
    const startTime = Date.now();

    // Validate payload
    const parseResult = RetellWebhookEventSchema.safeParse(rawPayload);
    if (!parseResult.success) {
      logger.error(
        { error: parseResult.error, clientId },
        'Invalid Retell webhook payload'
      );
      return {
        success: false,
        response: { status: 'error', message: 'Invalid payload' },
      };
    }

    const event = parseResult.data;
    const handler = this.eventHandlers.get(event.event);

    if (!handler) {
      logger.warn({ eventType: event.event, clientId }, 'Unknown webhook event type');
      return {
        success: true,
        response: { status: 'received', message: 'Event type not handled' },
      };
    }

    try {
      const response = await handler(event.call, clientConfig);

      const processingTime = Date.now() - startTime;
      logger.info(
        {
          eventType: event.event,
          callId: event.call.call_id,
          clientId,
          processingTime,
        },
        'Webhook event processed successfully'
      );

      // Queue background processing for call_ended
      let backgroundJobQueued = false;
      if (event.event === 'call_ended') {
        this.queueBackgroundProcessing(event.call, clientConfig);
        backgroundJobQueued = true;
      }

      return {
        success: true,
        response,
        backgroundJobQueued,
      };
    } catch (error) {
      logger.error(
        {
          error,
          eventType: event.event,
          callId: event.call.call_id,
          clientId,
        },
        'Webhook handler error'
      );

      // Send Slack alert for critical errors
      await slackService.sendError(
        'Webhook Handler Failed',
        `Event: ${event.event}, Call: ${event.call.call_id}`,
        {
          clientId,
          callId: event.call.call_id,
          error: error instanceof Error ? error : new Error('Unknown error'),
        }
      );

      return {
        success: false,
        response: { status: 'error', message: 'Internal processing error' },
      };
    }
  }

  private async handleCallStarted(
    call: RetellCall,
    config: ClientConfig
  ): Promise<WebhookResponse> {
    logger.info(
      {
        callId: call.call_id,
        agentId: call.agent_id,
        fromNumber: call.from_number,
        direction: call.direction,
      },
      'Call started'
    );

    const phone = call.from_number || call.to_number || '';

    // Get or create customer
    const customer = await customerService.getOrCreate(config.client_id, phone);

    // Start conversation record
    await conversationService.startConversation({
      customerId: customer.id,
      clientId: config.client_id,
      callId: call.call_id,
      direction: call.direction || 'inbound',
      phone,
    });

    // Build context for Retell dynamic variables
    const context = await contextBuilderService.buildContext(phone, config);

    return {
      status: 'received',
      response_data: context,
    };
  }

  private async handleCallEnded(
    call: RetellCall,
    config: ClientConfig
  ): Promise<WebhookResponse> {
    logger.info(
      {
        callId: call.call_id,
        duration: call.duration_ms,
        status: call.call_status,
      },
      'Call ended'
    );

    // Quick response - heavy processing happens in background
    return {
      status: 'received',
      message: 'Post-call processing queued',
    };
  }

  private async handleCallAnalyzed(
    call: RetellCall,
    config: ClientConfig
  ): Promise<WebhookResponse> {
    logger.info(
      {
        callId: call.call_id,
        summary: call.call_analysis?.call_summary,
        sentiment: call.call_analysis?.user_sentiment,
      },
      'Call analyzed by Retell'
    );

    // Update conversation with Retell's analysis
    if (call.call_analysis) {
      try {
        await conversationService.updateFromRetellAnalysis(call.call_id, {
          summary: call.call_analysis.call_summary,
          sentiment: call.call_analysis.user_sentiment,
          successful: call.call_analysis.call_successful,
          customData: call.call_analysis.custom_analysis_data,
        });
      } catch (error) {
        logger.error({ error, callId: call.call_id }, 'Failed to update conversation with analysis');
      }
    }

    return {
      status: 'processed',
      message: 'Analysis stored',
    };
  }

  private queueBackgroundProcessing(call: RetellCall, config: ClientConfig): void {
    // Use setImmediate to not block the response
    setImmediate(async () => {
      try {
        const phone = call.from_number || call.to_number || '';
        const transcript = call.transcript_object || [];

        await postCallProcessor.process({
          callId: call.call_id,
          clientId: config.client_id,
          phone,
          transcript: transcript.map((t) => ({
            role: t.role,
            content: t.content,
          })),
          summary: call.call_analysis?.call_summary,
          durationMs: call.duration_ms,
          callStatus: call.call_status,
          callOutcome: call.call_analysis?.user_sentiment,
          businessName: config.business_name,
        });
      } catch (error) {
        logger.error(
          { error, callId: call.call_id },
          'Background post-call processing failed'
        );
      }
    });
  }
}

export const webhookHandlerService = new WebhookHandlerService();
