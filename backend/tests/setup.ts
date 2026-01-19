/**
 * Divine Agentic Intelligence System - Test Setup
 * Global test configuration and mocks
 */

import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// Mock environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.ANTHROPIC_API_KEY = 'test-claude-key';
process.env.RETELL_API_KEY = 'test-retell-key';
process.env.RETELL_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.TXT180_API_KEY = 'test-txt180-key';
process.env.TWILIO_ACCOUNT_SID = 'test-twilio-sid';
process.env.TWILIO_AUTH_TOKEN = 'test-twilio-auth';
process.env.ZOHO_SMTP_HOST = 'smtp.zoho.com';
process.env.ZOHO_SMTP_USER = 'test@zoho.com';
process.env.ZOHO_SMTP_PASS = 'test-pass';
process.env.ZOHO_CRM_CLIENT_ID = 'test-crm-client';
process.env.ZOHO_CRM_CLIENT_SECRET = 'test-crm-secret';
process.env.ZOHO_CRM_REFRESH_TOKEN = 'test-crm-refresh';
process.env.ZOHO_CALENDAR_CLIENT_ID = 'test-cal-client';
process.env.ZOHO_CALENDAR_CLIENT_SECRET = 'test-cal-secret';
process.env.ZOHO_CALENDAR_REFRESH_TOKEN = 'test-cal-refresh';
process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.PORT = '3001';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn(),
        })),
    })),
}));

// Mock external HTTP calls
vi.mock('axios', () => ({
    default: {
        get: vi.fn().mockResolvedValue({ data: {} }),
        post: vi.fn().mockResolvedValue({ data: {} }),
        put: vi.fn().mockResolvedValue({ data: {} }),
        patch: vi.fn().mockResolvedValue({ data: {} }),
        delete: vi.fn().mockResolvedValue({ data: {} }),
    },
}));

// Mock nodemailer
vi.mock('nodemailer', () => ({
    createTransport: vi.fn(() => ({
        sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
        verify: vi.fn().mockResolvedValue(true),
    })),
}));

// Mock Twilio
vi.mock('twilio', () => ({
    default: vi.fn(() => ({
        messages: {
            create: vi.fn().mockResolvedValue({ sid: 'test-sms-sid', status: 'sent' }),
        },
    })),
}));

// Mock Anthropic/Claude
vi.mock('@anthropic-ai/sdk', () => ({
    default: vi.fn(() => ({
        messages: {
            create: vi.fn().mockResolvedValue({
                content: [{ type: 'text', text: 'Test response from Claude' }],
            }),
        },
    })),
}));

// Mock pino logger to reduce test output noise
vi.mock('pino', () => ({
    default: vi.fn(() => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        child: vi.fn().mockReturnThis(),
    })),
}));

// Global test lifecycle hooks
beforeAll(() => {
    // Any global setup
});

afterEach(() => {
    vi.clearAllMocks();
});

afterAll(() => {
    vi.restoreAllMocks();
});

// Test utilities
export const createMockRequest = (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides,
});

export const createMockResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    res.end = vi.fn().mockReturnValue(res);
    return res;
};

export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
