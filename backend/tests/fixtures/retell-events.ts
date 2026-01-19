/**
 * Divine Agentic Intelligence System - Retell Event Fixtures
 * Sample webhook payloads for testing
 */

import { RetellWebhookEvent } from './types';

// ============================================
// CALL STARTED EVENTS
// ============================================

export const callStartedEvent = {
    event: 'call_started',
    call: {
        call_id: 'call_test_123',
        from_number: '+18325551234',
        to_number: '+18325555678',
        direction: 'inbound',
        agent_id: 'agent_test_456',
        start_timestamp: new Date().toISOString(),
        metadata: {},
    },
};

// ============================================
// CALL ENDED EVENTS
// ============================================

export const callEndedEvent = {
    event: 'call_ended',
    call: {
        call_id: 'call_test_123',
        from_number: '+18325551234',
        to_number: '+18325555678',
        direction: 'inbound',
        agent_id: 'agent_test_456',
        call_status: 'ended',
        start_timestamp: '2026-01-17T12:00:00.000Z',
        end_timestamp: '2026-01-17T12:05:00.000Z',
        duration_ms: 300000,
        transcript: 'Agent: Hello, how can I help you today?\nCustomer: Hi, I am looking to schedule an appointment.\nAgent: I would be happy to help you with that. When works best for you?\nCustomer: How about tomorrow at 2pm?\nAgent: Let me check availability... Yes, 2pm tomorrow is available. Shall I book that for you?\nCustomer: Yes please.\nAgent: Great, I have booked your appointment for tomorrow at 2pm. You will receive a confirmation shortly.',
        transcript_object: [
            { role: 'agent', content: 'Hello, how can I help you today?', timestamp: 0 },
            { role: 'customer', content: 'Hi, I am looking to schedule an appointment.', timestamp: 3000 },
            { role: 'agent', content: 'I would be happy to help you with that. When works best for you?', timestamp: 8000 },
            { role: 'customer', content: 'How about tomorrow at 2pm?', timestamp: 15000 },
            { role: 'agent', content: 'Let me check availability... Yes, 2pm tomorrow is available. Shall I book that for you?', timestamp: 20000 },
            { role: 'customer', content: 'Yes please.', timestamp: 30000 },
            { role: 'agent', content: 'Great, I have booked your appointment for tomorrow at 2pm. You will receive a confirmation shortly.', timestamp: 35000 },
        ],
        call_analysis: {
            call_summary: 'Customer called to schedule an appointment. Successfully booked for tomorrow at 2pm.',
            user_sentiment: 'Positive',
            call_outcome: 'appointment_booked',
        },
        cost_metadata: {
            total_cost: 0.15,
        },
        recording_url: 'https://storage.retellai.com/recordings/test_123.mp3',
    },
};

export const callEndedNoBookingEvent = {
    event: 'call_ended',
    call: {
        call_id: 'call_test_456',
        from_number: '+18325559999',
        to_number: '+18325555678',
        direction: 'inbound',
        agent_id: 'agent_test_456',
        call_status: 'ended',
        start_timestamp: '2026-01-17T13:00:00.000Z',
        end_timestamp: '2026-01-17T13:02:00.000Z',
        duration_ms: 120000,
        transcript: 'Agent: Hello, how can I help you?\nCustomer: What are your hours?\nAgent: We are open Monday through Friday from 9am to 6pm.\nCustomer: Thank you, goodbye.',
        call_analysis: {
            call_summary: 'Customer inquired about business hours. No appointment booked.',
            user_sentiment: 'Neutral',
            call_outcome: 'information_provided',
        },
    },
};

// ============================================
// FUNCTION CALL EVENTS
// ============================================

export const checkCalendarFunctionCall = {
    event: 'function_call_invoked',
    call: {
        call_id: 'call_test_789',
        from_number: '+18325551234',
        to_number: '+18325555678',
        agent_id: 'agent_test_456',
    },
    function_call: {
        id: 'fc_test_001',
        name: 'check_calendar_availability',
        arguments: {
            requested_date: 'tomorrow',
            duration_minutes: 30,
        },
    },
};

export const bookAppointmentFunctionCall = {
    event: 'function_call_invoked',
    call: {
        call_id: 'call_test_789',
        from_number: '+18325551234',
        to_number: '+18325555678',
        agent_id: 'agent_test_456',
    },
    function_call: {
        id: 'fc_test_002',
        name: 'book_appointment',
        arguments: {
            datetime: '2026-01-18T14:00:00.000Z',
            customer_name: 'John Smith',
            customer_phone: '+18325551234',
            customer_email: 'john@example.com',
            notes: 'New customer - interested in SUV',
        },
    },
};

export const unknownFunctionCall = {
    event: 'function_call_invoked',
    call: {
        call_id: 'call_test_789',
        from_number: '+18325551234',
        to_number: '+18325555678',
        agent_id: 'agent_test_456',
    },
    function_call: {
        id: 'fc_test_003',
        name: 'unknown_function',
        arguments: {},
    },
};

// ============================================
// CONTEXT REQUEST EVENTS
// ============================================

export const contextRequestEvent = {
    event: 'call_started',
    call: {
        call_id: 'call_test_context_001',
        from_number: '+18325551234',
        to_number: '+18325555678',
        direction: 'inbound',
        agent_id: 'agent_test_456',
    },
};

// ============================================
// CLIENT CONFIGURATIONS
// ============================================

export const testClientConfig = {
    client_id: 'test-client',
    business_name: 'Test Auto Dealership',
    owner_name: 'John Test',
    phone: '+18325555678',
    address: '123 Test Street, Houston, TX 77001',
    business_hours: {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '10:00', close: '16:00' },
        sunday: null,
    },
    timezone: 'America/Chicago',
    calendar_id: 'cal_test_123',
    crm_provider: 'zoho',
    sms_enabled: true,
    email_enabled: true,
    ai_followup_enabled: true,
};

// ============================================
// CUSTOMER DATA
// ============================================

export const existingCustomer = {
    id: 'cust_test_001',
    phone: '+18325551234',
    name: 'Jane Doe',
    email: 'jane@example.com',
    client_id: 'test-client',
    total_calls: 3,
    dominant_need: 'significance',
    secondary_need: 'approval',
    language: 'en',
    last_contact_at: '2026-01-15T10:00:00.000Z',
    created_at: '2026-01-01T00:00:00.000Z',
};

export const newCustomerPhone = '+18325559999';
