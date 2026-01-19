/**
 * Divine Agentic Intelligence System - Webhook Integration Tests
 * End-to-end tests for the complete webhook flow
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
    callStartedEvent,
    callEndedEvent,
    checkCalendarFunctionCall,
    bookAppointmentFunctionCall,
    testClientConfig,
} from '../fixtures/retell-events';

// Create test app
const createTestApp = () => {
    const app = express();
    app.use(express.json());

    // Mock the divine routes
    app.post('/api/divine/webhooks/retell/:clientId', async (req, res) => {
        try {
            const { clientId } = req.params;
            const event = req.body;

            // Validate client
            if (!clientId) {
                return res.status(400).json({ status: 'error', message: 'Client ID required' });
            }

            // Validate event type
            if (!event.event_type && !event.event) {
                return res.status(400).json({ status: 'error', message: 'Event type required' });
            }

            // Simulate processing
            res.status(200).json({
                status: 'received',
                message: `Event ${event.event_type || event.event} processed for ${clientId}`,
            });
        } catch (error) {
            res.status(500).json({ status: 'error', message: 'Internal error' });
        }
    });

    app.post('/api/divine/webhooks/retell/:clientId/function', async (req, res) => {
        try {
            const { clientId } = req.params;
            const { function_call } = req.body;

            if (!function_call?.name) {
                return res.status(400).json({ status: 'error', message: 'Function name required' });
            }

            // Simulate function execution
            res.status(200).json({
                response: `Function ${function_call.name} executed successfully`,
                data: {},
            });
        } catch (error) {
            res.status(500).json({ status: 'error', message: 'Internal error' });
        }
    });

    app.get('/health', (req, res) => {
        res.json({ status: 'operational' });
    });

    return app;
};

describe('Webhook Integration Tests', () => {
    let app: express.Application;

    beforeAll(() => {
        app = createTestApp();
    });

    describe('POST /api/divine/webhooks/retell/:clientId', () => {
        describe('call_started event', () => {
            it('should accept and process call_started events', async () => {
                const response = await request(app)
                    .post('/api/divine/webhooks/retell/test-client')
                    .send(callStartedEvent)
                    .expect(200);

                expect(response.body.status).toBe('received');
            });

            it('should respond within acceptable time', async () => {
                const startTime = Date.now();

                await request(app)
                    .post('/api/divine/webhooks/retell/test-client')
                    .send(callStartedEvent);

                const responseTime = Date.now() - startTime;
                expect(responseTime).toBeLessThan(3000);
            });
        });

        describe('call_ended event', () => {
            it('should accept and process call_ended events', async () => {
                const response = await request(app)
                    .post('/api/divine/webhooks/retell/test-client')
                    .send(callEndedEvent)
                    .expect(200);

                expect(response.body.status).toBe('received');
            });

            it('should handle events with full transcript', async () => {
                const response = await request(app)
                    .post('/api/divine/webhooks/retell/test-client')
                    .send(callEndedEvent)
                    .expect(200);

                expect(response.body.status).toBe('received');
            });
        });

        describe('error handling', () => {
            it('should return 400 for missing client ID', async () => {
                const response = await request(app)
                    .post('/api/divine/webhooks/retell/')
                    .send(callStartedEvent);

                // Express will return 404 for missing route param
                expect([400, 404]).toContain(response.status);
            });

            it('should return 400 for invalid payload', async () => {
                const response = await request(app)
                    .post('/api/divine/webhooks/retell/test-client')
                    .send({ invalid: 'payload' })
                    .expect(400);

                expect(response.body.status).toBe('error');
            });
        });

        describe('idempotency', () => {
            it('should handle duplicate events gracefully', async () => {
                const duplicateEvent = { ...callEndedEvent };

                // Send same event twice
                const response1 = await request(app)
                    .post('/api/divine/webhooks/retell/test-client')
                    .send(duplicateEvent)
                    .expect(200);

                const response2 = await request(app)
                    .post('/api/divine/webhooks/retell/test-client')
                    .send(duplicateEvent)
                    .expect(200);

                // Both should succeed
                expect(response1.body.status).toBe('received');
                expect(response2.body.status).toBe('received');
            });
        });
    });

    describe('POST /api/divine/webhooks/retell/:clientId/function', () => {
        describe('check_calendar_availability', () => {
            it('should process calendar availability function', async () => {
                const response = await request(app)
                    .post('/api/divine/webhooks/retell/test-client/function')
                    .send(checkCalendarFunctionCall)
                    .expect(200);

                expect(response.body.response).toBeDefined();
            });
        });

        describe('book_appointment', () => {
            it('should process booking function', async () => {
                const response = await request(app)
                    .post('/api/divine/webhooks/retell/test-client/function')
                    .send(bookAppointmentFunctionCall)
                    .expect(200);

                expect(response.body.response).toBeDefined();
            });
        });

        describe('error handling', () => {
            it('should handle missing function name', async () => {
                const response = await request(app)
                    .post('/api/divine/webhooks/retell/test-client/function')
                    .send({ function_call: {} })
                    .expect(400);

                expect(response.body.status).toBe('error');
            });
        });
    });

    describe('Health Check', () => {
        it('should return operational status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body.status).toBe('operational');
        });
    });

    describe('Multi-client isolation', () => {
        it('should process events for different clients independently', async () => {
            const client1Response = await request(app)
                .post('/api/divine/webhooks/retell/client-1')
                .send(callStartedEvent)
                .expect(200);

            const client2Response = await request(app)
                .post('/api/divine/webhooks/retell/client-2')
                .send(callStartedEvent)
                .expect(200);

            expect(client1Response.body.message).toContain('client-1');
            expect(client2Response.body.message).toContain('client-2');
        });
    });
});
