/**
 * Divine Agentic Intelligence System - Webhook Handler Tests
 * Unit tests for the central webhook routing service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookHandlerService } from '../../../src/services/divine/webhook-handler.service';
import {
    callStartedEvent,
    callEndedEvent,
    contextRequestEvent,
    testClientConfig,
} from '../../fixtures/retell-events';

// Mock dependencies
vi.mock('../../../src/services/divine/customer.service', () => ({
    customerService: {
        getOrCreate: vi.fn().mockResolvedValue({
            id: 'cust_test_001',
            phone: '+18325551234',
            name: 'Test Customer',
            totalCalls: 1,
        }),
        getByPhone: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
    },
}));

vi.mock('../../../src/services/divine/conversation.service', () => ({
    conversationService: {
        startConversation: vi.fn().mockResolvedValue({ id: 'conv_test_001' }),
        updateFromRetellAnalysis: vi.fn().mockResolvedValue({}),
        endConversation: vi.fn().mockResolvedValue({}),
    },
}));

vi.mock('../../../src/services/divine/context-builder.service', () => ({
    contextBuilderService: {
        buildContext: vi.fn().mockResolvedValue({
            is_returning_customer: false,
            customer_name: 'there',
            language: 'en',
        }),
    },
}));

vi.mock('../../../src/services/divine/post-call-processor', () => ({
    postCallProcessor: {
        process: vi.fn().mockResolvedValue({}),
    },
}));

vi.mock('../../../src/services/divine/slack.service', () => ({
    slackService: {
        sendError: vi.fn().mockResolvedValue({}),
        sendAlert: vi.fn().mockResolvedValue({}),
    },
}));

vi.mock('../../../src/utils/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

describe('WebhookHandlerService', () => {
    let service: WebhookHandlerService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new WebhookHandlerService();
    });

    describe('validateAndRoute', () => {
        describe('payload validation', () => {
            it('should reject invalid payloads', async () => {
                const invalidPayload = { invalid: 'data' };

                const result = await service.validateAndRoute(
                    invalidPayload,
                    'test-client',
                    testClientConfig as any
                );

                expect(result.success).toBe(false);
                expect(result.response.status).toBe('error');
                expect(result.response.message).toBe('Invalid payload');
            });

            it('should accept valid call_started event', async () => {
                const result = await service.validateAndRoute(
                    callStartedEvent,
                    'test-client',
                    testClientConfig as any
                );

                expect(result.success).toBe(true);
                expect(result.response.status).toBe('received');
            });

            it('should accept valid call_ended event', async () => {
                const result = await service.validateAndRoute(
                    callEndedEvent,
                    'test-client',
                    testClientConfig as any
                );

                expect(result.success).toBe(true);
                expect(result.response.status).toBe('received');
            });
        });

        describe('event routing', () => {
            it('should route call_started to correct handler', async () => {
                const { customerService } = await import(
                    '../../../src/services/divine/customer.service'
                );

                await service.validateAndRoute(
                    callStartedEvent,
                    'test-client',
                    testClientConfig as any
                );

                expect(customerService.getOrCreate).toHaveBeenCalledWith(
                    'test-client',
                    '+18325551234'
                );
            });

            it('should queue background processing for call_ended', async () => {
                const result = await service.validateAndRoute(
                    callEndedEvent,
                    'test-client',
                    testClientConfig as any
                );

                expect(result.backgroundJobQueued).toBe(true);
            });

            it('should handle unknown event types gracefully', async () => {
                const unknownEvent = {
                    event_type: 'unknown_event',
                    call: callStartedEvent.call,
                };

                const result = await service.validateAndRoute(
                    unknownEvent,
                    'test-client',
                    testClientConfig as any
                );

                expect(result.success).toBe(true);
                expect(result.response.message).toContain('not handled');
            });
        });

        describe('context building', () => {
            it('should build context for call_started events', async () => {
                const { contextBuilderService } = await import(
                    '../../../src/services/divine/context-builder.service'
                );

                await service.validateAndRoute(
                    callStartedEvent,
                    'test-client',
                    testClientConfig as any
                );

                expect(contextBuilderService.buildContext).toHaveBeenCalled();
            });

            it('should return context in response_data', async () => {
                const result = await service.validateAndRoute(
                    callStartedEvent,
                    'test-client',
                    testClientConfig as any
                );

                expect(result.response.response_data).toBeDefined();
                expect(result.response.response_data?.is_returning_customer).toBe(false);
            });
        });

        describe('idempotency', () => {
            it('should handle duplicate events without error', async () => {
                // Process the same event twice
                const result1 = await service.validateAndRoute(
                    callEndedEvent,
                    'test-client',
                    testClientConfig as any
                );

                const result2 = await service.validateAndRoute(
                    callEndedEvent,
                    'test-client',
                    testClientConfig as any
                );

                // Both should succeed - actual idempotency is handled at DB level
                expect(result1.success).toBe(true);
                expect(result2.success).toBe(true);
            });
        });

        describe('error handling', () => {
            it('should send Slack alert on handler errors', async () => {
                const { customerService } = await import(
                    '../../../src/services/divine/customer.service'
                );
                const { slackService } = await import(
                    '../../../src/services/divine/slack.service'
                );

                // Force an error
                (customerService.getOrCreate as any).mockRejectedValueOnce(
                    new Error('Database error')
                );

                const result = await service.validateAndRoute(
                    callStartedEvent,
                    'test-client',
                    testClientConfig as any
                );

                expect(result.success).toBe(false);
                expect(slackService.sendError).toHaveBeenCalled();
            });

            it('should return error response on handler failure', async () => {
                const { customerService } = await import(
                    '../../../src/services/divine/customer.service'
                );

                (customerService.getOrCreate as any).mockRejectedValueOnce(
                    new Error('Database error')
                );

                const result = await service.validateAndRoute(
                    callStartedEvent,
                    'test-client',
                    testClientConfig as any
                );

                expect(result.response.status).toBe('error');
                expect(result.response.message).toBe('Internal processing error');
            });
        });

        describe('performance', () => {
            it('should respond within acceptable time', async () => {
                const startTime = Date.now();

                await service.validateAndRoute(
                    callEndedEvent,
                    'test-client',
                    testClientConfig as any
                );

                const processingTime = Date.now() - startTime;

                // Should respond quickly (background processing is deferred)
                expect(processingTime).toBeLessThan(500);
            });
        });
    });
});
