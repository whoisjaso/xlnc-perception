/**
 * Divine Agentic Intelligence System - Function Dispatcher Tests
 * Unit tests for Retell function call routing and execution
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FunctionDispatcherService } from '../../../src/services/divine/function-dispatcher.service';
import {
    checkCalendarFunctionCall,
    bookAppointmentFunctionCall,
    unknownFunctionCall,
    testClientConfig,
} from '../../fixtures/retell-events';

// Mock dependencies
vi.mock('../../../src/services/divine/zoho-calendar.service', () => ({
    zohoCalendarService: {
        isConfigured: vi.fn().mockReturnValue(false),
        getAvailableSlots: vi.fn().mockResolvedValue([
            {
                start: new Date('2026-01-18T09:00:00'),
                end: new Date('2026-01-18T09:30:00'),
                formatted: '9:00 AM',
            },
            {
                start: new Date('2026-01-18T10:00:00'),
                end: new Date('2026-01-18T10:30:00'),
                formatted: '10:00 AM',
            },
        ]),
        createEvent: vi.fn().mockResolvedValue({ id: 'event_test_001' }),
        formatSlotsForSpeech: vi.fn().mockReturnValue('I have 9:00 AM and 10:00 AM available.'),
    },
}));

vi.mock('../../../src/services/divine/customer.service', () => ({
    customerService: {
        getOrCreate: vi.fn().mockResolvedValue({
            id: 'cust_test_001',
            phone: '+18325551234',
            name: 'Test Customer',
        }),
        getByPhone: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
    },
}));

vi.mock('../../../src/services/divine/conversation.service', () => ({
    conversationService: {
        addBookingToConversation: vi.fn().mockResolvedValue({}),
        addNoteToConversation: vi.fn().mockResolvedValue({}),
        addDataToConversation: vi.fn().mockResolvedValue({}),
        getCustomerConversations: vi.fn().mockResolvedValue([]),
    },
}));

vi.mock('../../../src/services/divine/message-queue.service', () => ({
    messageQueueService: {
        enqueueSMS: vi.fn().mockResolvedValue({ id: 'msg_test_001' }),
        enqueueEmail: vi.fn().mockResolvedValue({ id: 'email_test_001' }),
    },
}));

vi.mock('../../../src/services/divine/slack.service', () => ({
    slackService: {
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

describe('FunctionDispatcherService', () => {
    let service: FunctionDispatcherService;
    const enabledConfig = {
        ...testClientConfig,
        appointment_booking_enabled: true,
        sms_enabled: true,
        human_transfer_enabled: true,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        service = new FunctionDispatcherService();
    });

    describe('dispatch', () => {
        describe('payload validation', () => {
            it('should reject invalid function call payloads', async () => {
                const invalidPayload = { invalid: 'data' };

                const result = await service.dispatch(invalidPayload, enabledConfig as any);

                expect(result.success).toBe(false);
                expect(result.response.response).toContain('error');
            });

            it('should validate and parse valid payloads', async () => {
                const result = await service.dispatch(
                    checkCalendarFunctionCall,
                    enabledConfig as any
                );

                expect(result.success).toBe(true);
                expect(result.executionTimeMs).toBeGreaterThan(0);
            });
        });

        describe('check_calendar_availability', () => {
            it('should return availability message when calendar is not configured', async () => {
                const result = await service.dispatch(
                    checkCalendarFunctionCall,
                    enabledConfig as any
                );

                expect(result.success).toBe(true);
                expect(result.response.response).toContain('available');
            });

            it('should respect appointment_booking_enabled flag', async () => {
                const disabledConfig = { ...enabledConfig, appointment_booking_enabled: false };

                const result = await service.dispatch(
                    checkCalendarFunctionCall,
                    disabledConfig as any
                );

                expect(result.response.response).toContain('not available');
            });

            it('should parse relative dates correctly', async () => {
                const tomorrowRequest = {
                    ...checkCalendarFunctionCall,
                    function_call: {
                        ...checkCalendarFunctionCall.function_call,
                        arguments: { requested_date: 'tomorrow' },
                    },
                };

                const result = await service.dispatch(tomorrowRequest, enabledConfig as any);

                expect(result.success).toBe(true);
            });
        });

        describe('book_appointment', () => {
            it('should book appointment and queue confirmation SMS', async () => {
                const { messageQueueService } = await import(
                    '../../../src/services/divine/message-queue.service'
                );

                const result = await service.dispatch(
                    bookAppointmentFunctionCall,
                    enabledConfig as any
                );

                expect(result.success).toBe(true);
                expect(result.response.response).toContain('booked');
                expect(messageQueueService.enqueueSMS).toHaveBeenCalled();
            });

            it('should update customer record with provided info', async () => {
                const { customerService } = await import(
                    '../../../src/services/divine/customer.service'
                );

                await service.dispatch(bookAppointmentFunctionCall, enabledConfig as any);

                expect(customerService.update).toHaveBeenCalled();
            });

            it('should add booking info to conversation', async () => {
                const { conversationService } = await import(
                    '../../../src/services/divine/conversation.service'
                );

                await service.dispatch(bookAppointmentFunctionCall, enabledConfig as any);

                expect(conversationService.addBookingToConversation).toHaveBeenCalled();
            });

            it('should skip SMS when sms_enabled is false', async () => {
                const { messageQueueService } = await import(
                    '../../../src/services/divine/message-queue.service'
                );
                const noSmsConfig = { ...enabledConfig, sms_enabled: false };

                await service.dispatch(bookAppointmentFunctionCall, noSmsConfig as any);

                expect(messageQueueService.enqueueSMS).not.toHaveBeenCalled();
            });
        });

        describe('unknown functions', () => {
            it('should handle unknown function names gracefully', async () => {
                const result = await service.dispatch(
                    unknownFunctionCall,
                    enabledConfig as any
                );

                expect(result.success).toBe(false);
                expect(result.response.response).toContain('apologize');
            });
        });

        describe('error handling', () => {
            it('should return user-friendly error on service failure', async () => {
                const { customerService } = await import(
                    '../../../src/services/divine/customer.service'
                );

                (customerService.getOrCreate as any).mockRejectedValueOnce(
                    new Error('Service unavailable')
                );

                const result = await service.dispatch(
                    bookAppointmentFunctionCall,
                    enabledConfig as any
                );

                expect(result.success).toBe(false);
                expect(result.response.response).toContain('apologize');
            });

            it('should track execution time even on failure', async () => {
                const { customerService } = await import(
                    '../../../src/services/divine/customer.service'
                );

                (customerService.getOrCreate as any).mockRejectedValueOnce(
                    new Error('Database error')
                );

                const result = await service.dispatch(
                    bookAppointmentFunctionCall,
                    enabledConfig as any
                );

                expect(result.executionTimeMs).toBeGreaterThan(0);
            });
        });

        describe('performance', () => {
            it('should execute functions within acceptable time', async () => {
                const result = await service.dispatch(
                    checkCalendarFunctionCall,
                    enabledConfig as any
                );

                // Function calls should complete quickly
                expect(result.executionTimeMs).toBeLessThan(1000);
            });
        });
    });
});
