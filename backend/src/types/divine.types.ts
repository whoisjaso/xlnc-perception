// Divine Agentic Intelligence System - Core Type Definitions
// PRISM, Intent Classification, and Behavioral Analysis Types

import { z } from 'zod';

// ============================================
// PRISM BEHAVIORAL ANALYSIS TYPES
// ============================================

export const PRISMNeedSchema = z.enum([
  'significance',
  'acceptance',
  'approval',
  'intelligence',
  'pity',
  'power',
]);

export const PRISMScoresSchema = z.object({
  significance: z.number().min(0).max(100),
  acceptance: z.number().min(0).max(100),
  approval: z.number().min(0).max(100),
  intelligence: z.number().min(0).max(100),
  pity: z.number().min(0).max(100),
  power: z.number().min(0).max(100),
});

export const SixAxisScoresSchema = z.object({
  suggestibility: z.number().min(0).max(100),
  focus: z.number().min(0).max(100),
  openness: z.number().min(0).max(100),
  connection: z.number().min(0).max(100),
  compliance: z.number().min(0).max(100),
  expectancy: z.number().min(0).max(100),
});

export const PsychologicalProfileSchema = z.object({
  dominantNeed: PRISMNeedSchema,
  secondaryNeed: PRISMNeedSchema.optional(),
  prismScores: PRISMScoresSchema,
  sixAxisScores: SixAxisScoresSchema.optional(),
  confidenceLevel: z.number().min(0).max(1),
  analysisTimestamp: z.string().datetime(),
});

export const ResponseCalibrationSchema = z.object({
  opener: z.string(),
  valueFrame: z.string(),
  closeFrame: z.string(),
  avoidPhrases: z.array(z.string()),
  usePhrases: z.array(z.string()),
});

// ============================================
// INTENT CLASSIFICATION TYPES
// ============================================

export const IntentCategorySchema = z.enum([
  'booking_request',
  'information_inquiry',
  'pricing_question',
  'callback_request',
  'complaint',
  'compliment',
  'transfer_request',
  'cancellation',
  'general_inquiry',
  'sales_opportunity',
  'support_request',
  'other',
]);

export const IntentClassificationSchema = z.object({
  intent: IntentCategorySchema,
  confidence: z.number().min(0).max(1),
  entities: z.record(z.string()),
  subIntent: z.string().optional(),
  actionRequired: z.boolean(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
});

export const ConversationAnalysisSchema = z.object({
  intent: IntentClassificationSchema,
  prismProfile: PsychologicalProfileSchema.optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']),
  sentimentScore: z.number().min(-1).max(1),
  topicsDiscussed: z.array(z.string()),
  keyEntities: z.record(z.string()),
  customerQuestions: z.array(z.string()),
  agentCommitments: z.array(z.string()),
  nextBestAction: z.string(),
  summary: z.string(),
});

// ============================================
// CUSTOMER CONTEXT TYPES
// ============================================

export const CustomerContextSchema = z.object({
  isReturningCustomer: z.boolean(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string(),

  // History
  totalCalls: z.number().default(0),
  lastContactAt: z.string().datetime().optional(),
  lastCallSummary: z.string().optional(),

  // Behavioral Profile
  dominantNeed: PRISMNeedSchema.optional(),
  secondaryNeed: PRISMNeedSchema.optional(),
  prismScores: PRISMScoresSchema.optional(),

  // Preferences
  preferredLanguage: z.string().default('en'),
  timezone: z.string().optional(),

  // CRM Data
  crmId: z.string().optional(),
  crmProvider: z.enum(['zoho', 'hubspot', 'salesforce', 'ghl']).optional(),
  leadScore: z.number().optional(),
  lifetimeValue: z.number().optional(),

  // Tags & Notes
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),

  // Area Code Detection
  areaCode: z.string().optional(),
});

// ============================================
// POST-CALL ACTION TYPES
// ============================================

export const PostCallActionSchema = z.object({
  type: z.enum(['sms', 'email', 'crm_sync', 'slack_alert', 'webhook', 'schedule_callback']),
  immediate: z.boolean().default(false),
  scheduledFor: z.string().datetime().optional(),
  data: z.record(z.unknown()),
  priority: z.number().min(1).max(10).default(5),
});

export const PostCallDecisionSchema = z.object({
  actions: z.array(PostCallActionSchema),
  shouldFollowUp: z.boolean(),
  followUpDelay: z.number().optional(), // minutes
  escalationRequired: z.boolean(),
  escalationReason: z.string().optional(),
});

// ============================================
// MESSAGE TEMPLATES
// ============================================

export const MessageTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  channel: z.enum(['sms', 'email']),
  subject: z.string().optional(),
  body: z.string(),
  variables: z.array(z.string()),
  intent: IntentCategorySchema.optional(),
  language: z.string().default('en'),
});

export const GeneratedMessageSchema = z.object({
  channel: z.enum(['sms', 'email']),
  subject: z.string().optional(),
  body: z.string(),
  personalized: z.boolean(),
  aiGenerated: z.boolean(),
});

// ============================================
// QUEUE MESSAGE TYPES
// ============================================

export const QueuedMessageSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string(),
  customerId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),

  channel: z.enum(['sms', 'email']),
  recipient: z.string(),
  subject: z.string().optional(),
  body: z.string(),

  status: z.enum(['pending', 'processing', 'sent', 'failed', 'cancelled']),
  scheduledFor: z.string().datetime(),
  priority: z.number().min(1).max(10).default(5),

  attempts: z.number().default(0),
  maxAttempts: z.number().default(3),
  lastAttemptAt: z.string().datetime().optional(),
  lastError: z.string().optional(),

  providerId: z.string().optional(),
  providerStatus: z.string().optional(),

  metadata: z.record(z.unknown()).optional(),

  createdAt: z.string().datetime(),
  processedAt: z.string().datetime().optional(),
});

// ============================================
// ERROR & ALERT TYPES
// ============================================

export const AlertSeveritySchema = z.enum(['info', 'warning', 'error', 'critical']);

export const SystemAlertSchema = z.object({
  id: z.string().uuid(),
  severity: AlertSeveritySchema,
  service: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  callId: z.string().optional(),
  clientId: z.string().optional(),
  customerId: z.string().optional(),
  acknowledged: z.boolean().default(false),
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export const ErrorLogEntrySchema = z.object({
  id: z.string().uuid(),
  service: z.string(),
  operation: z.string(),
  errorType: z.string(),
  errorMessage: z.string(),
  stackTrace: z.string().optional(),
  context: z.record(z.unknown()),
  clientId: z.string().optional(),
  callId: z.string().optional(),
  userId: z.string().uuid().optional(),
  severity: AlertSeveritySchema,
  notified: z.boolean().default(false),
  resolved: z.boolean().default(false),
  resolvedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

// ============================================
// METRICS & ANALYTICS TYPES
// ============================================

export const CallMetricsSchema = z.object({
  totalCalls: z.number(),
  totalDurationMs: z.number(),
  averageDurationMs: z.number(),
  successfulCalls: z.number(),
  failedCalls: z.number(),
  appointmentsBooked: z.number(),
  transfersRequested: z.number(),
  byIntent: z.record(z.number()),
  bySentiment: z.record(z.number()),
  byOutcome: z.record(z.number()),
  period: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
});

export const ClientMetricsSchema = z.object({
  clientId: z.string(),
  callMetrics: CallMetricsSchema,
  messageMetrics: z.object({
    smsSent: z.number(),
    smsDelivered: z.number(),
    smsFailed: z.number(),
    emailsSent: z.number(),
    emailsDelivered: z.number(),
    emailsFailed: z.number(),
  }),
  crmMetrics: z.object({
    leadsCreated: z.number(),
    leadsUpdated: z.number(),
    syncErrors: z.number(),
  }),
  errorCount: z.number(),
  lastActivityAt: z.string().datetime(),
});

// ============================================
// DIVINE SYSTEM STATUS TYPES
// ============================================

export const ServiceStatusSchema = z.object({
  name: z.string(),
  status: z.enum(['operational', 'degraded', 'down', 'unknown']),
  lastCheckedAt: z.string().datetime(),
  latencyMs: z.number().optional(),
  errorRate: z.number().optional(),
  details: z.string().optional(),
});

export const DivineSystemStatusSchema = z.object({
  overall: z.enum(['operational', 'degraded', 'down']),
  services: z.object({
    claude: ServiceStatusSchema,
    sms: ServiceStatusSchema,
    email: ServiceStatusSchema,
    zohoCRM: ServiceStatusSchema,
    zohoCalendar: ServiceStatusSchema,
    slack: ServiceStatusSchema,
    database: ServiceStatusSchema,
    redis: ServiceStatusSchema.optional(),
  }),
  queueStats: z.object({
    pending: z.number(),
    processing: z.number(),
    failed: z.number(),
    avgProcessingTimeMs: z.number(),
  }),
  activeClients: z.number(),
  callsToday: z.number(),
  lastUpdatedAt: z.string().datetime(),
});

// ============================================
// INFERRED TYPES
// ============================================

export type PRISMNeed = z.infer<typeof PRISMNeedSchema>;
export type PRISMScores = z.infer<typeof PRISMScoresSchema>;
export type SixAxisScores = z.infer<typeof SixAxisScoresSchema>;
export type PsychologicalProfile = z.infer<typeof PsychologicalProfileSchema>;
export type ResponseCalibration = z.infer<typeof ResponseCalibrationSchema>;

export type IntentCategory = z.infer<typeof IntentCategorySchema>;
export type IntentClassification = z.infer<typeof IntentClassificationSchema>;
export type ConversationAnalysis = z.infer<typeof ConversationAnalysisSchema>;

export type CustomerContext = z.infer<typeof CustomerContextSchema>;
export type PostCallAction = z.infer<typeof PostCallActionSchema>;
export type PostCallDecision = z.infer<typeof PostCallDecisionSchema>;

export type MessageTemplate = z.infer<typeof MessageTemplateSchema>;
export type GeneratedMessage = z.infer<typeof GeneratedMessageSchema>;
export type QueuedMessage = z.infer<typeof QueuedMessageSchema>;

export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;
export type SystemAlert = z.infer<typeof SystemAlertSchema>;
export type ErrorLogEntry = z.infer<typeof ErrorLogEntrySchema>;

export type CallMetrics = z.infer<typeof CallMetricsSchema>;
export type ClientMetrics = z.infer<typeof ClientMetricsSchema>;
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;
export type DivineSystemStatus = z.infer<typeof DivineSystemStatusSchema>;
