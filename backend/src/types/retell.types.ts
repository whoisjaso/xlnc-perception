// Divine Agentic Intelligence System - Retell Type Definitions
// Complete type-safe webhook and function call handling

import { z } from 'zod';

// ============================================
// RETELL WEBHOOK EVENT SCHEMAS
// ============================================

export const TranscriptEntrySchema = z.object({
  role: z.enum(['agent', 'user', 'system']),
  content: z.string(),
  words: z.array(z.object({
    word: z.string(),
    start: z.number(),
    end: z.number(),
  })).optional(),
});

export const RetellCallSchema = z.object({
  call_id: z.string(),
  agent_id: z.string(),
  call_status: z.enum([
    'registered',
    'ongoing',
    'ended',
    'error',
  ]),
  call_type: z.enum(['web_call', 'phone_call']).optional(),
  from_number: z.string().optional(),
  to_number: z.string().optional(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  start_timestamp: z.number().optional(),
  end_timestamp: z.number().optional(),
  duration_ms: z.number().optional(),
  transcript: z.string().optional(),
  transcript_object: z.array(TranscriptEntrySchema).optional(),
  recording_url: z.string().optional(),
  public_log_url: z.string().optional(),
  call_analysis: z.object({
    call_summary: z.string().optional(),
    user_sentiment: z.enum(['positive', 'negative', 'neutral', 'unknown']).optional(),
    call_successful: z.boolean().optional(),
    custom_analysis_data: z.record(z.unknown()).optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
  retell_llm_dynamic_variables: z.record(z.string()).optional(),
  opt_out_sensitive_data_storage: z.boolean().optional(),
});

export const RetellWebhookEventSchema = z.discriminatedUnion('event', [
  z.object({
    event: z.literal('call_started'),
    call: RetellCallSchema,
  }),
  z.object({
    event: z.literal('call_ended'),
    call: RetellCallSchema,
  }),
  z.object({
    event: z.literal('call_analyzed'),
    call: RetellCallSchema,
  }),
]);

// ============================================
// FUNCTION CALL SCHEMAS
// ============================================

export const FunctionCallArgumentsSchema = z.record(z.unknown());

export const RetellFunctionCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  arguments: FunctionCallArgumentsSchema,
});

export const RetellFunctionCallRequestSchema = z.object({
  call: RetellCallSchema,
  function_call: RetellFunctionCallSchema,
});

// ============================================
// FUNCTION CALL ARGUMENT SCHEMAS
// ============================================

export const CheckCalendarArgsSchema = z.object({
  requested_date: z.string().describe('The date to check (e.g., "tomorrow", "next monday", "2024-01-20")'),
  duration_minutes: z.number().default(30).optional(),
  time_preference: z.enum(['morning', 'afternoon', 'evening', 'any']).optional(),
});

export const BookAppointmentArgsSchema = z.object({
  datetime: z.string().describe('ISO datetime string for the appointment'),
  customer_name: z.string(),
  customer_phone: z.string(),
  customer_email: z.string().email().optional(),
  appointment_type: z.string().optional(),
  notes: z.string().optional(),
});

export const CheckInventoryArgsSchema = z.object({
  query: z.string().describe('Search query for inventory'),
  category: z.string().optional(),
  price_min: z.number().optional(),
  price_max: z.number().optional(),
  filters: z.record(z.string()).optional(),
});

export const GetCustomerHistoryArgsSchema = z.object({
  phone: z.string(),
});

export const TransferCallArgsSchema = z.object({
  reason: z.string(),
  department: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high']).default('medium'),
});

export const CollectInfoArgsSchema = z.object({
  field: z.string().describe('Field being collected (name, email, phone, etc.)'),
  value: z.string(),
});

export const EndCallArgsSchema = z.object({
  reason: z.string(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
  follow_up_required: z.boolean().optional(),
});

// ============================================
// FUNCTION RESPONSE SCHEMAS
// ============================================

export const FunctionResponseSchema = z.object({
  response: z.string().describe('The response to speak to the user'),
  data: z.record(z.unknown()).optional(),
});

export const CalendarSlotsResponseSchema = z.object({
  response: z.string(),
  data: z.object({
    available_slots: z.array(z.object({
      start: z.string(),
      end: z.string(),
      formatted: z.string(),
    })),
    date: z.string(),
  }),
});

export const BookingConfirmationResponseSchema = z.object({
  response: z.string(),
  data: z.object({
    event_id: z.string(),
    confirmed_datetime: z.string(),
    confirmation_sent: z.boolean(),
  }),
});

// ============================================
// CONTEXT REQUEST SCHEMAS
// ============================================

export const ContextRequestSchema = z.object({
  call: RetellCallSchema,
});

export const ContextResponseSchema = z.object({
  response_data: z.record(z.string()),
});

export const DynamicVariablesSchema = z.object({
  is_returning_customer: z.string(),
  customer_name: z.string(),
  call_count: z.string(),
  last_contact: z.string(),
  dominant_need: z.string(),
  psychological_profile: z.string(),
  conversation_notes: z.string(),
  language: z.string(),
  area_code: z.string(),
  business_hours: z.string(),
  special_instructions: z.string(),
});

// ============================================
// CLIENT CONFIGURATION SCHEMAS
// ============================================

export const BusinessHoursSchema = z.object({
  monday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().optional() }).optional(),
  tuesday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().optional() }).optional(),
  wednesday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().optional() }).optional(),
  thursday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().optional() }).optional(),
  friday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().optional() }).optional(),
  saturday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().optional() }).optional(),
  sunday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().optional() }).optional(),
});

export const ClientConfigSchema = z.object({
  client_id: z.string(),
  business_name: z.string(),
  owner_name: z.string(),
  industry: z.string(),
  phone: z.string(),
  email: z.string().email(),
  address: z.string(),
  timezone: z.string().default('America/New_York'),
  business_hours: BusinessHoursSchema,

  // Integrations - Retell
  retell_agent_id: z.string().optional(),

  // Integrations - Zoho (per-client credentials, falls back to env if null)
  zoho_calendar_id: z.string().optional(),
  zoho_client_id: z.string().nullable().optional(),
  zoho_client_secret: z.string().nullable().optional(),
  zoho_refresh_token: z.string().nullable().optional(),
  zoho_crm_enabled: z.boolean().default(false),

  // Messaging
  sms_provider: z.enum(['txt180', 'twilio']).default('txt180'),
  email_provider: z.enum(['sendgrid', 'zoho']).default('sendgrid'),
  sms_enabled: z.boolean().default(true),
  email_enabled: z.boolean().default(true),

  // AI Settings
  ai_followup_enabled: z.boolean().default(true),
  prism_analysis_enabled: z.boolean().default(true),

  // Custom Prompts
  greeting_override: z.string().optional(),
  special_instructions: z.string().optional(),

  // Feature Flags
  appointment_booking_enabled: z.boolean().default(true),
  inventory_check_enabled: z.boolean().default(false),
  human_transfer_enabled: z.boolean().default(true),
});

// ============================================
// INFERRED TYPES
// ============================================

export type TranscriptEntry = z.infer<typeof TranscriptEntrySchema>;
export type RetellCall = z.infer<typeof RetellCallSchema>;
export type RetellWebhookEvent = z.infer<typeof RetellWebhookEventSchema>;
export type RetellFunctionCall = z.infer<typeof RetellFunctionCallSchema>;
export type RetellFunctionCallRequest = z.infer<typeof RetellFunctionCallRequestSchema>;

export type CheckCalendarArgs = z.infer<typeof CheckCalendarArgsSchema>;
export type BookAppointmentArgs = z.infer<typeof BookAppointmentArgsSchema>;
export type CheckInventoryArgs = z.infer<typeof CheckInventoryArgsSchema>;
export type GetCustomerHistoryArgs = z.infer<typeof GetCustomerHistoryArgsSchema>;
export type TransferCallArgs = z.infer<typeof TransferCallArgsSchema>;
export type CollectInfoArgs = z.infer<typeof CollectInfoArgsSchema>;
export type EndCallArgs = z.infer<typeof EndCallArgsSchema>;

export type FunctionResponse = z.infer<typeof FunctionResponseSchema>;
export type CalendarSlotsResponse = z.infer<typeof CalendarSlotsResponseSchema>;
export type BookingConfirmationResponse = z.infer<typeof BookingConfirmationResponseSchema>;

export type ContextRequest = z.infer<typeof ContextRequestSchema>;
export type ContextResponse = z.infer<typeof ContextResponseSchema>;
export type DynamicVariables = z.infer<typeof DynamicVariablesSchema>;

export type BusinessHours = z.infer<typeof BusinessHoursSchema>;
export type ClientConfig = z.infer<typeof ClientConfigSchema>;

// ============================================
// FUNCTION REGISTRY TYPE
// ============================================

export type FunctionName =
  | 'check_calendar_availability'
  | 'book_appointment'
  | 'check_inventory'
  | 'get_customer_history'
  | 'transfer_to_human'
  | 'collect_information'
  | 'end_call';

export interface FunctionHandler<TArgs = unknown, TResponse = FunctionResponse> {
  name: FunctionName;
  schema: z.ZodSchema<TArgs>;
  handler: (args: TArgs, context: FunctionCallContext) => Promise<TResponse>;
}

export interface FunctionCallContext {
  call: RetellCall;
  clientConfig: ClientConfig;
  customerId?: string;
  customerPhone: string;
}

// ============================================
// WEBHOOK RESPONSE TYPES
// ============================================

export interface WebhookResponse {
  status: 'received' | 'processed' | 'error';
  message?: string;
  response_data?: Record<string, string>;
}

export interface FunctionCallResponse {
  response: string;
  data?: Record<string, unknown>;
}
