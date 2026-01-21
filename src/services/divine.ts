// Divine Agentic Intelligence System - Frontend API Service
// API client for Divine system endpoints

import api from './api';

// ============================================
// TYPES
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

export interface DivineSystemStatus {
  services: DivineServicesStatus;
  queue: {
    pending: number;
    processing: number;
    failed: number;
  };
  errors: {
    total: number;
    unresolved: number;
  };
  timestamp: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  avgProcessingTimeMs: number;
}

export interface QueueMessage {
  id: string;
  clientId: string;
  customerId?: string;
  conversationId?: string;
  channel: 'sms' | 'email';
  recipient: string;
  subject?: string;
  body: string;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  scheduledFor: string;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  lastError?: string;
  providerId?: string;
  providerStatus?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  processedAt?: string;
}

export interface ErrorStats {
  total: number;
  byService: Record<string, number>;
  bySeverity: Record<string, number>;
  byClient: Record<string, number>;
  recentErrors: ErrorLogEntry[];
}

export interface ErrorLogEntry {
  id: string;
  service: string;
  operation: string;
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  context: Record<string, unknown>;
  clientId?: string;
  callId?: string;
  userId?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  notified: boolean;
  resolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

export interface BusinessHours {
  monday?: { start: string; end: string; closed?: boolean };
  tuesday?: { start: string; end: string; closed?: boolean };
  wednesday?: { start: string; end: string; closed?: boolean };
  thursday?: { start: string; end: string; closed?: boolean };
  friday?: { start: string; end: string; closed?: boolean };
  saturday?: { start: string; end: string; closed?: boolean };
  sunday?: { start: string; end: string; closed?: boolean };
}

export interface ClientConfig {
  // Core Identity
  client_id: string;
  business_name: string;
  owner_name?: string;
  industry?: string;
  phone?: string;
  email?: string;
  address?: string;
  timezone: string;
  business_hours?: BusinessHours;

  // Integrations
  retell_agent_id?: string;
  zoho_calendar_id?: string;
  zoho_crm_enabled: boolean;

  // Messaging
  sms_provider?: 'txt180' | 'twilio';
  email_provider?: 'sendgrid' | 'zoho';
  sms_enabled: boolean;
  email_enabled: boolean;

  // AI Settings
  ai_followup_enabled?: boolean;
  prism_analysis_enabled?: boolean;

  // Custom Prompts
  greeting_override?: string;
  special_instructions?: string;

  // Feature Flags
  appointment_booking_enabled?: boolean;
  inventory_check_enabled?: boolean;
  human_transfer_enabled?: boolean;
}

export interface ConversationStats {
  total: number;
  byIntent: Record<string, number>;
  bySentiment: Record<string, number>;
  avgDuration: number;
}

export interface Conversation {
  id: string;
  customerId: string;
  clientId: string;
  callId: string;
  direction: string;
  status: string;
  durationMs?: number;
  intent?: string;
  sentiment?: string;
  summary?: string;
  transcript?: Array<{ role: string; content: string }>;
  extractedData?: Record<string, unknown>;
  followUpScheduled?: boolean;
  followUpSentAt?: string;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
}

export interface AnalysisResult {
  intent: {
    intent: string;
    confidence: number;
    entities: Record<string, string>;
    actionRequired: boolean;
    urgency: string;
  };
  prism?: {
    scores: Record<string, number>;
    dominantNeeds: string[];
    communicationStyle: string;
    calibrationGuide: string;
  };
  processingTimeMs: number;
}

// ============================================
// API FUNCTIONS
// ============================================

export const divineApi = {
  // System Status
  async getSystemStatus(): Promise<DivineSystemStatus> {
    const response = await api.get('/divine/status');
    return response.data.data;
  },

  async getServicesStatus(): Promise<{ services: DivineServicesStatus }> {
    const response = await api.get('/divine/services');
    return response.data.data;
  },

  // Client Configuration
  async getClients(): Promise<{ clients: ClientConfig[]; total: number }> {
    const response = await api.get('/divine/clients');
    return response.data.data;
  },

  async getAllClients(): Promise<{ clients: ClientConfig[]; total: number }> {
    return this.getClients();
  },

  async getClient(clientId: string): Promise<{ config: ClientConfig }> {
    const response = await api.get(`/divine/clients/${clientId}`);
    return response.data.data;
  },

  async createClient(config: Partial<ClientConfig>): Promise<{ config: ClientConfig }> {
    const response = await api.post('/divine/clients', config);
    return response.data.data;
  },

  async updateClient(clientId: string, updates: Partial<ClientConfig>): Promise<{ config: ClientConfig }> {
    const response = await api.patch(`/divine/clients/${clientId}`, updates);
    return response.data.data;
  },

  // Queue Management
  async getQueueStats(): Promise<{ stats: QueueStats }> {
    const response = await api.get('/divine/queue/stats');
    return response.data.data;
  },

  async getQueueMessages(params?: { clientId?: string; limit?: number }): Promise<{ messages: QueueMessage[]; total: number }> {
    const response = await api.get('/divine/queue/messages', { params });
    return response.data.data;
  },

  async getFailedMessages(clientId?: string): Promise<{ messages: QueueMessage[]; total: number }> {
    const response = await api.get('/divine/queue/failed', { params: { clientId } });
    return response.data.data;
  },

  async retryMessage(messageId: string): Promise<{ retried: boolean }> {
    const response = await api.post(`/divine/queue/retry/${messageId}`);
    return response.data.data;
  },

  async cancelMessage(messageId: string): Promise<{ cancelled: boolean }> {
    const response = await api.delete(`/divine/queue/${messageId}`);
    return response.data.data;
  },

  // Error Monitoring
  async getErrorStats(hours?: number): Promise<{ stats: ErrorStats }> {
    const response = await api.get('/divine/errors/stats', { params: { hours } });
    return response.data.data;
  },

  async getRecentErrors(limit?: number): Promise<{ errors: ErrorLogEntry[]; total: number }> {
    const response = await api.get('/divine/errors', { params: { limit } });
    return response.data.data;
  },

  async getUnresolvedErrors(): Promise<{ errors: ErrorLogEntry[]; total: number }> {
    const response = await api.get('/divine/errors/unresolved');
    return response.data.data;
  },

  async resolveError(errorId: string): Promise<{ resolved: boolean }> {
    const response = await api.post(`/divine/errors/${errorId}/resolve`);
    return response.data.data;
  },

  // Client Error Monitoring (non-admin users)
  async getClientErrors(limit?: number, includeResolved?: boolean): Promise<{ errors: ErrorLogEntry[]; total: number; clientId: string }> {
    const response = await api.get('/divine/errors/client', { params: { limit, includeResolved } });
    return response.data.data;
  },

  async getClientErrorStats(hours?: number): Promise<{
    stats: {
      total: number;
      unresolved: number;
      critical: number;
      bySeverity: Record<string, number>;
      byService: Record<string, number>;
    };
    clientId: string
  }> {
    const response = await api.get('/divine/errors/client/stats', { params: { hours } });
    return response.data.data;
  },

  async acknowledgeError(errorId: string): Promise<{ acknowledged: boolean }> {
    const response = await api.post(`/divine/errors/${errorId}/acknowledge`);
    return response.data.data;
  },

  // Conversations
  async getConversations(clientId: string, limit?: number): Promise<{ conversations: Conversation[]; total: number }> {
    const response = await api.get('/divine/conversations', { params: { clientId, limit } });
    return response.data.data;
  },

  async getConversationStats(clientId: string, hours?: number): Promise<{ stats: ConversationStats }> {
    const response = await api.get('/divine/conversations/stats', { params: { clientId, hours } });
    return response.data.data;
  },

  async getConversation(callId: string): Promise<{ conversation: Conversation }> {
    const response = await api.get(`/divine/conversations/${callId}`);
    return response.data.data;
  },

  // Analysis
  async analyzeTranscript(transcript: string): Promise<AnalysisResult> {
    const response = await api.post('/divine/analyze/transcript', { transcript });
    return response.data.data;
  },

  async analyzeConversation(transcript: string): Promise<{ analysis: AnalysisResult; processingTimeMs: number }> {
    const response = await api.post('/divine/analyze/full', { transcript });
    return response.data.data;
  },
};

export default divineApi;
