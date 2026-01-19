/**
 * Divine Agentic Intelligence System - Test Type Definitions
 */

export interface RetellWebhookEvent {
    event_type: 'call_started' | 'call_ended' | 'function_call_invoked' | 'context_request';
    call: {
        call_id: string;
        from_number: string;
        to_number: string;
        direction?: 'inbound' | 'outbound';
        agent_id?: string;
        call_status?: string;
        start_timestamp?: string;
        end_timestamp?: string;
        duration_ms?: number;
        transcript?: string;
        transcript_object?: TranscriptEntry[];
        call_analysis?: CallAnalysis;
        cost_metadata?: CostMetadata;
        recording_url?: string;
        metadata?: Record<string, unknown>;
    };
    function_call?: {
        id: string;
        name: string;
        arguments: Record<string, unknown>;
    };
}

export interface TranscriptEntry {
    role: 'agent' | 'customer';
    content: string;
    timestamp: number;
}

export interface CallAnalysis {
    call_summary?: string;
    user_sentiment?: string;
    call_outcome?: string;
}

export interface CostMetadata {
    total_cost?: number;
}

export interface ClientConfig {
    client_id: string;
    business_name: string;
    owner_name: string;
    phone: string;
    address: string;
    business_hours: Record<string, { open: string; close: string } | null>;
    timezone: string;
    calendar_id?: string;
    crm_provider?: 'zoho' | 'hubspot' | 'ghl';
    sms_enabled?: boolean;
    email_enabled?: boolean;
    ai_followup_enabled?: boolean;
}

export interface Customer {
    id: string;
    phone: string;
    name?: string;
    email?: string;
    client_id: string;
    total_calls: number;
    dominant_need?: string;
    secondary_need?: string;
    language: string;
    last_contact_at?: string;
    created_at: string;
}
