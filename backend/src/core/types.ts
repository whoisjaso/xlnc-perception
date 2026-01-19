export interface RetellWebhookEvent {
    event_id: string;
    event_type: 'call_started' | 'call_ended' | 'call_analyzed' | 'inbound_call_received' | 'function_call_invoked' | 'context_request';
    call: RetellCall;
    timestamp: string;
    // Additional fields depending on event type
}

export interface RetellCall {
    call_id: string;
    agent_id: string;
    client_id?: string; // Custom field we track
    from_number: string;
    to_number: string;
    direction: 'inbound' | 'outbound';
    call_status: 'registered' | 'ongoing' | 'ended' | 'error';
    start_timestamp?: number;
    end_timestamp?: number;
    duration_seconds?: number; // In plan it's duration_seconds
    duration_ms?: number;
    transcript?: string;
    recording_url?: string;
    public_log_url?: string;
    metadata?: Record<string, any>;
    retell_llm_dynamic_variables?: Record<string, any>;
}

// ClientConfig is now imported from ../types (defined in types/retell.types.ts)

export interface RouteDecision {
    action: 'noop' | 'parallel_execute' | 'respond_with_context' | 'handoff';
    actions?: ParallelAction[];
    logData?: any;
    response?: any; // For context requests
}

export interface ParallelAction {
    type: 'sms' | 'email' | 'crm' | 'internal_notification';
    immediate: boolean; // if true, execute now; if false, queue
    provider?: string;
    template?: string;
    data: any;
    generateWithAI?: boolean;
}

export interface RouteContext {
    requestId: string;
    timestamp: Date;
}
