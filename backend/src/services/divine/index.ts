// Divine Agentic Intelligence System - Service Exports
// Complete service layer for voice AI automation

// ============================================
// AI SERVICES
// ============================================
export { claudeService, ClaudeService, ClaudeMessage, ClaudeResponse } from './claude.service';
export { prismService, PRISMService, PRISMScores, PRISMAnalysis } from './prism.service';
export { intentClassifierService, IntentClassifierService, ClassificationResult, FullAnalysisResult } from './intent-classifier.service';
export { followUpWriterService, FollowUpWriterService, FollowUpContext } from './followup-writer.service';

// ============================================
// COMMUNICATION SERVICES
// ============================================
export { smsService, SMSService, SendSMSResult } from './sms.service';
export { emailService, EmailService, EmailOptions, SendEmailResult } from './email.service';
export { messageQueueService, MessageQueueService } from './message-queue.service';

// ============================================
// CRM & CALENDAR SERVICES
// ============================================
export { zohoCRMService, ZohoCRMService, ZohoLead, LeadData } from './zoho-crm.service';
export { zohoCalendarService, ZohoCalendarService, CalendarEvent, TimeSlot } from './zoho-calendar.service';

// ============================================
// MONITORING SERVICES
// ============================================
export { slackService, SlackAlertService, SlackAlert, AlertSeverity } from './slack.service';
export { errorMonitorService, ErrorMonitorService, ErrorStats } from './error-monitor.service';

// ============================================
// DATA SERVICES
// ============================================
export { customerService, CustomerService, CustomerContext } from './customer.service';
export { conversationService, ConversationService, TranscriptEntry } from './conversation.service';

// ============================================
// CORE PROCESSORS
// ============================================
export { postCallProcessor, PostCallProcessor, PostCallData } from './post-call-processor';
export { webhookHandlerService, WebhookHandlerService, WebhookHandlerResult } from './webhook-handler.service';
export { functionDispatcherService, FunctionDispatcherService, FunctionDispatchResult } from './function-dispatcher.service';
export { contextBuilderService, ContextBuilderService, ContextBuildResult } from './context-builder.service';
export { queueProcessorService, QueueProcessorService, QueueStats, ProcessingResult } from './queue-processor.service';

// ============================================
// CONFIGURATION SERVICES
// ============================================
export { clientConfigService, ClientConfigService, SAMPLE_CLIENT_CONFIG } from './client-config.service';

// ============================================
// IMPORTS FOR STATUS
// ============================================
import { claudeService } from './claude.service';
import { smsService } from './sms.service';
import { emailService } from './email.service';
import { zohoCRMService } from './zoho-crm.service';
import { zohoCalendarService } from './zoho-calendar.service';
import { slackService } from './slack.service';
import { queueProcessorService } from './queue-processor.service';
import { errorMonitorService } from './error-monitor.service';

// ============================================
// SERVICE STATUS
// ============================================
export interface DivineServicesStatus {
  claude: boolean;
  sms: boolean;
  email: boolean;
  zohoCRM: boolean;
  zohoCalendar: boolean;
  slack: boolean;
  overall: 'operational' | 'degraded' | 'down';
}

export function getDivineServicesStatus(): DivineServicesStatus {
  const status = {
    claude: claudeService.isConfigured(),
    sms: smsService.isConfigured(),
    email: emailService.isConfigured(),
    zohoCRM: zohoCRMService.isConfigured(),
    zohoCalendar: zohoCalendarService.isConfigured(),
    slack: slackService.isEnabled(),
    overall: 'operational' as const,
  };

  // Determine overall status
  const criticalServices = [status.claude];
  const importantServices = [status.sms, status.email];

  if (criticalServices.some((s) => !s)) {
    status.overall = 'down';
  } else if (importantServices.some((s) => !s)) {
    status.overall = 'degraded';
  }

  return status;
}

export async function getDivineSystemStatus(): Promise<{
  services: DivineServicesStatus;
  queue: { pending: number; processing: number; failed: number };
  errors: { total: number; unresolved: number };
}> {
  const [queueStats, errorStats] = await Promise.all([
    queueProcessorService.getStats(),
    errorMonitorService.getStats(24),
  ]);

  return {
    services: getDivineServicesStatus(),
    queue: {
      pending: queueStats.pending,
      processing: queueStats.processing,
      failed: queueStats.failed,
    },
    errors: {
      total: errorStats.total,
      unresolved: errorStats.recentErrors.filter((e) => !e.resolved).length,
    },
  };
}

// ============================================
// INITIALIZATION
// ============================================
export function initializeDivineServices(): void {
  queueProcessorService.start();
  errorMonitorService.start();
}

export function shutdownDivineServices(): void {
  queueProcessorService.stop();
  errorMonitorService.stop();
}
