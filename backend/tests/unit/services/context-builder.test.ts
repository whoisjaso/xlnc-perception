/**
 * Divine Agentic Intelligence System - Context Builder Tests
 * Unit tests for pre-call context building service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContextBuilderService } from '../../../src/services/divine/context-builder.service';
import { testClientConfig, existingCustomer } from '../../fixtures/retell-events';

vi.mock('../../../src/services/divine/customer.service', () => ({
    customerService: {
        getByPhone: vi.fn().mockResolvedValue(null),
        getOrCreate: vi.fn().mockResolvedValue({
            id: 'cust_new_001',
            phone: '+18325559999',
            totalCalls: 0,
        }),
    },
}));

vi.mock('../../../src/services/divine/conversation.service', () => ({
    conversationService: {
        getCustomerConversations: vi.fn().mockResolvedValue([]),
    },
}));

vi.mock('../../../src/services/divine/prism.service', () => ({
    prismService: {
        getDominantNeed: vi.fn().mockReturnValue('significance'),
        calibrateResponse: vi.fn().mockReturnValue({
            opener: 'What you are building matters',
            valueFrame: 'This amplifies your impact',
        }),
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

describe('ContextBuilderService', () => {
    let service: ContextBuilderService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new ContextBuilderService();
    });

    describe('buildContext', () => {
        it('should return new customer context for unknown phone', async () => {
            const context = await service.buildContext('+18325559999', testClientConfig as any);

            expect(context.is_returning_customer).toBe(false);
            expect(context.language).toBe('en');
        });

        it('should return returning customer context for known phone', async () => {
            const { customerService } = await import(
                '../../../src/services/divine/customer.service'
            );

            (customerService.getByPhone as any).mockResolvedValueOnce(existingCustomer);

            const context = await service.buildContext('+18325551234', testClientConfig as any);

            expect(context.is_returning_customer).toBe(true);
            expect(context.customer_name).toBe('Jane Doe');
            expect(context.call_count).toBe(3);
        });

        it('should include PRISM psychological need for returning customers', async () => {
            const { customerService } = await import(
                '../../../src/services/divine/customer.service'
            );

            (customerService.getByPhone as any).mockResolvedValueOnce(existingCustomer);

            const context = await service.buildContext('+18325551234', testClientConfig as any);

            expect(context.dominant_need).toBe('significance');
        });

        it('should include area code for new customers', async () => {
            const context = await service.buildContext('+18325559999', testClientConfig as any);

            expect(context.area_code).toBe('832');
        });

        it('should include business info in context', async () => {
            const context = await service.buildContext('+18325559999', testClientConfig as any);

            expect(context.business_name).toBe('Test Auto Dealership');
            expect(context.business_hours).toBeDefined();
        });

        it('should summarize conversation history for returning customers', async () => {
            const { customerService } = await import(
                '../../../src/services/divine/customer.service'
            );
            const { conversationService } = await import(
                '../../../src/services/divine/conversation.service'
            );

            (customerService.getByPhone as any).mockResolvedValueOnce(existingCustomer);
            (conversationService.getCustomerConversations as any).mockResolvedValueOnce([
                { summary: 'Asked about SUV inventory', detectedIntent: 'inquiry' },
                { summary: 'Scheduled test drive', detectedIntent: 'appointment' },
            ]);

            const context = await service.buildContext('+18325551234', testClientConfig as any);

            expect(context.notes).toBeDefined();
        });
    });
});
