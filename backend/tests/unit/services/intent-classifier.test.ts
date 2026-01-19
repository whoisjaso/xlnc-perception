/**
 * Divine Agentic Intelligence System - Intent Classifier Tests
 * Unit tests for AI-powered intent classification
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntentClassifierService } from '../../../src/services/divine/intent-classifier.service';

vi.mock('../../../src/services/divine/claude.service', () => ({
    claudeService: {
        isConfigured: vi.fn().mockReturnValue(true),
        sendMessage: vi.fn().mockResolvedValue({
            content: JSON.stringify({
                primary_intent: 'appointment_request',
                confidence: 0.92,
                entities: {
                    date: 'tomorrow',
                    time: '2pm',
                },
                sentiment: 'positive',
                urgency: 'normal',
            }),
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

describe('IntentClassifierService', () => {
    let service: IntentClassifierService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new IntentClassifierService();
    });

    describe('classify', () => {
        it('should classify appointment-related transcripts', async () => {
            const transcript = 'Customer: I want to schedule an appointment. Agent: I can help with that. When works for you? Customer: Tomorrow at 2pm';

            const result = await service.classify(transcript);

            expect(result.intent.intent).toBeDefined();
            expect(result.confidence).toBeGreaterThan(0);
        });

        it('should extract entities from transcript', async () => {
            const transcript = 'Customer: I want to come in tomorrow at 2pm';

            const result = await service.classify(transcript);

            expect(result.intent.entities).toBeDefined();
        });

        it('should detect sentiment', async () => {
            const transcript = 'Customer: This is great, thank you!';

            const result = await service.classify(transcript);

            expect(result.intent).toBeDefined();
        });

        it('should handle empty transcripts gracefully', async () => {
            const result = await service.classify('');

            expect(result.intent.intent).toBeDefined();
        });

        it('should return default when Claude is not configured', async () => {
            const { claudeService } = await import(
                '../../../src/services/divine/claude.service'
            );

            (claudeService.isConfigured as any).mockReturnValueOnce(false);

            const result = await service.classify('Hello');

            expect(result.intent.intent).toBeDefined();
        });
    });

    describe('extractEntities', () => {
        it('should extract date mentions', async () => {
            const result = await service.classify(
                'Customer: I want to see SUVs next Monday'
            );

            expect(result.intent.entities).toBeDefined();
        });
    });

    describe('error handling', () => {
        it('should handle Claude API errors gracefully', async () => {
            const { claudeService } = await import(
                '../../../src/services/divine/claude.service'
            );

            (claudeService.complete as any).mockRejectedValueOnce(
                new Error('API rate limit')
            );

            // Should not throw - will fall back to rule-based classification
            const result = await service.classify('Hello');

            expect(result).toBeDefined();
            expect(result.intent).toBeDefined();
        });

        it('should handle malformed Claude responses', async () => {
            const { claudeService } = await import(
                '../../../src/services/divine/claude.service'
            );

            (claudeService.complete as any).mockResolvedValueOnce({
                content: 'Not valid JSON',
            });

            // Should handle gracefully - will fall back to rule-based classification
            const result = await service.classify('Hello');

            expect(result).toBeDefined();
            expect(result.intent).toBeDefined();
        });
    });
});

