

export enum ViewState {
  COMMAND_CENTER = 'COMMAND_CENTER',
  REALITY_FORGE = 'REALITY_FORGE', // Voice Agent Builder
  RETELL_SETUP = 'RETELL_SETUP', // Retell AI Configuration
  CALL_INTELLIGENCE = 'CALL_INTELLIGENCE', // Call Analytics
  WORKFLOW_MATRIX = 'WORKFLOW_MATRIX', // n8n Automation
  NEURAL_SETTINGS = 'NEURAL_SETTINGS', // Settings/Integrations
  ADMIN_PANEL = 'ADMIN_PANEL', // Admin Dashboard
  DIVINE_DASHBOARD = 'DIVINE_DASHBOARD' // Divine Agentic Intelligence System
}

export enum PublicPage {
  HOME = 'HOME',
  SOLUTIONS = 'SOLUTIONS',
  SERVICES = 'SERVICES',
  PRICING = 'PRICING',
  CASE_STUDIES = 'CASE_STUDIES',
  ABOUT = 'ABOUT',
  TERMS = 'TERMS',
  PRIVACY = 'PRIVACY',
  STATUS = 'STATUS',
  SIGN_UP = 'SIGN_UP'
}

export interface UserProfile {
  name: string;
  email: string;
  isAdmin: boolean;
  plan: 'INITIATE' | 'SOVEREIGN' | 'EMPIRE';
  avatar?: string;
  clientId?: string | null;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'INFO' | 'WARN' | 'CRITICAL' | 'SUCCESS';
}

export interface Metric {
  label: string;
  value: string;
  change: number; // Percentage
  trend: 'UP' | 'DOWN' | 'NEUTRAL';
  details: string; // "Saving $6,000/yr"
}

export interface AgentConfig {
  name: string;
  industry: string;
  tone: 'AGGRESSIVE' | 'AUTHORITATIVE' | 'EXCLUSIVE' | 'URGENT';
  goal: string;
  traits?: string; // Specific psychological cues or personality traits
}

export interface ChartDataPoint {
  name: string;
  value: number;
  secondary: number;
}

// New Data Models for Deep Analytics & Retell Sync
export interface CallLog {
  id: string; // Retell call_id
  caller: string; // from_number
  duration: string; // derived from duration_ms
  durationSeconds?: number; // For filtering logic
  outcome: string; // call_analysis.call_outcome
  sentiment: number; // Derived or mocked if not provided directly
  summary: string; // call_analysis.call_summary
  transcript: { speaker: 'AI' | 'USER'; text: string; time: string }[];
  timestamp: string; // start_timestamp
  topics: string[];
  audioUrl?: string; // recording_url
  agentId?: string;
  cost?: number;
}

export interface WorkflowStatus {
  id: string;
  name: string;
  trigger: 'WEBHOOK' | 'SCHEDULE';
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  executions: number;
  successRate: number;
}

// Integration Types
export type CRMType = 'ZOHO' | 'HUBSPOT' | 'GOHIGHLEVEL' | 'GOOGLESHEETS' | 'SALESFORCE' | 'RETELL';

export interface IntegrationConfig {
  id: string;
  type: CRMType;
  name: string;
  icon: string; // URL or Lucid Icon name logic
  status: 'CONNECTED' | 'DISCONNECTED' | 'PENDING';
  apiKey?: string;
  meta?: any;
}