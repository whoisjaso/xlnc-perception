import { RetellWebhookEvent, RouteDecision, ParallelAction, RetellCall } from './types';
import { ClientConfig } from '../types';
import { IntentClassifier, Intent } from '../services/ai/intent-classifier';
import { CustomerMemory } from '../services/memory/customer';
import { ConversationAnalyzer } from '../services/ai/conversation-analyzer';
import { ZohoCalendarService } from '../services/divine/zoho-calendar.service';
import { logger } from '../utils/logger';

export class CentralRouter {
    private intentClassifier: IntentClassifier;
    private customerMemory: CustomerMemory;
    private analyzer: ConversationAnalyzer;

    constructor() {
        this.intentClassifier = new IntentClassifier();
        this.customerMemory = new CustomerMemory();
        this.analyzer = new ConversationAnalyzer();
    }

    async route(event: RetellWebhookEvent, config: ClientConfig): Promise<RouteDecision> {
        const { event_type, call } = event;

        logger.info('Routing Retell Event', { event_type, callId: call.call_id });

        switch (event_type) {
            case 'call_started':
                return this.handleCallStarted(call, config);

            case 'call_ended':
                return this.handleCallEnded(call, config);

            case 'context_request':
                return this.handleContextRequest(call, config);

            case 'function_call_invoked':
                // Function calls usually handled synchronously or via separate endpoint,
                // but here we might just log or handle async side effects
                return { action: 'noop' };

            default:
                return { action: 'noop' };
        }
    }

    private async handleCallStarted(_call: RetellCall, _config: ClientConfig): Promise<RouteDecision> {
        // Logic for call start (e.g. logging)
        return { action: 'noop' };
    }

    private async handleContextRequest(call: RetellCall, config: ClientConfig): Promise<RouteDecision> {
        logger.info('Handling context_request for calendar availability', {
            callId: call.call_id,
            clientId: config.client_id
        });

        const response: Record<string, any> = {};

        // If calendar booking is enabled, fetch available slots
        if (config.appointment_booking_enabled) {
            try {
                const calendarService = ZohoCalendarService.forClient(config as any);

                if (calendarService.isConfigured()) {
                    // Get typical business hours (use Monday as default)
                    const mondayHours = config.business_hours?.monday || { start: '09:00', end: '17:00' };
                    const startHour = parseInt(mondayHours.start.split(':')[0]);
                    const endHour = parseInt(mondayHours.end.split(':')[0]);

                    // Get available slots for today
                    const today = new Date();
                    const slots = await calendarService.getAvailableSlots(
                        today,
                        60, // 60-minute appointments
                        { start: startHour, end: endHour }
                    );

                    // Get tomorrow's slots too
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowSlots = await calendarService.getAvailableSlots(
                        tomorrow,
                        60,
                        { start: startHour, end: endHour }
                    );

                    // Format for agent to speak
                    const todayFormatted = calendarService.formatSlotsForSpeech(slots, 3);
                    const tomorrowFormatted = calendarService.formatSlotsForSpeech(tomorrowSlots, 3);

                    response.available_today = todayFormatted;
                    response.available_tomorrow = tomorrowFormatted;
                    response.has_availability = slots.length > 0 || tomorrowSlots.length > 0;
                    response.next_available = slots.length > 0 ? 'today' : tomorrowSlots.length > 0 ? 'tomorrow' : 'later this week';

                    logger.info('Calendar context injected', {
                        todaySlots: slots.length,
                        tomorrowSlots: tomorrowSlots.length
                    });
                } else {
                    logger.warn('Calendar service not configured for client', { clientId: config.client_id });
                }
            } catch (error) {
                logger.error('Failed to fetch calendar availability for context', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    clientId: config.client_id
                });
            }
        }

        // Load customer memory if available
        try {
            const history = await this.customerMemory.getHistory(call.from_number);
            if (history && history.length > 0) {
                response.returning_customer = true;
                response.previous_interactions = history.length;
                response.last_call_summary = history[0]?.summary || '';
            } else {
                response.returning_customer = false;
            }
        } catch (error) {
            logger.error('Failed to fetch customer memory', { error });
        }

        return {
            action: 'respond_with_context',
            response: response
        };
    }

    private async handleCallEnded(call: RetellCall, config: ClientConfig): Promise<RouteDecision> {
        // Extract intent from transcript
        const intent = await this.intentClassifier.classify(call.transcript);

        // Analyze conversation for behavioral signals
        const analysis = await this.analyzer.analyze({
            transcript: call.transcript,
            duration: call.duration_seconds,
            customerHistory: await this.customerMemory.getHistory(call.from_number)
        });

        // Determine parallel actions
        const actions: ParallelAction[] = [];

        // SMS routing
        if (this.shouldSendSMS(intent, analysis, config)) {
            actions.push({
                type: 'sms',
                immediate: intent.appointment_booked, // Send immediately if appointment booked
                template: this.selectSMSTemplate(intent, analysis),
                data: this.buildSMSData(call, intent, analysis),
                provider: config.sms_provider
            });
        }

        // Email routing
        if (this.shouldSendEmail(intent, analysis, config)) {
            actions.push({
                type: 'email',
                immediate: intent.appointment_booked,
                template: this.selectEmailTemplate(intent, analysis),
                data: this.buildEmailData(call, intent, analysis),
                generateWithAI: config.ai_followup_enabled
            });
        }

        // CRM routing
        if (this.shouldSyncCRM(intent, config)) {
            actions.push({
                type: 'crm',
                provider: config.crm_provider,
                // operation: intent.new_customer ? 'create' : 'update', // simplified for now
                data: this.buildCRMData(call, intent, analysis),
                immediate: false
            });
        }

        return {
            action: 'parallel_execute',
            actions,
            logData: {
                callId: call.call_id,
                intent,
                analysis,
                timestamp: new Date()
            }
        };
    }

    // --- Helpers ---

    private shouldSendSMS(intent: Intent, analysis: any, config: ClientConfig): boolean {
        if (!config.sms_enabled) return false;
        // Example logic: Send SMS if appointment booked OR if specifically requested info
        // For now, let's default to true if appointment booked, or if we need to send follow up
        return intent.appointment_booked;
    }

    private shouldSendEmail(intent: Intent, analysis: any, config: ClientConfig): boolean {
        if (!config.email_enabled) return false;
        return true; // Default to sending email summary or follow up
    }

    private shouldSyncCRM(intent: Intent, config: ClientConfig): boolean {
        return config.crm_provider !== 'none';
    }

    private selectSMSTemplate(intent: Intent, analysis: any): string {
        if (intent.appointment_booked) return 'appointment_confirmation';
        return 'general_followup';
    }

    private selectEmailTemplate(intent: Intent, analysis: any): string {
        return 'call_summary';
    }

    private buildSMSData(call: RetellCall, intent: Intent, analysis: any): any {
        return {
            to: call.from_number,
            customerName: 'Valued Customer', // todo: extract name
            agentName: 'Assistant'
        };
    }

    private buildEmailData(call: RetellCall, intent: Intent, analysis: any): any {
        return {
            to: 'customer@example.com', // todo: extract email
            subject: 'Call Summary',
            transcript: call.transcript
        };
    }

    private buildCRMData(call: RetellCall, intent: Intent, analysis: any): any {
        return {
            lead: {
                phone: call.from_number,
                source: 'Voice Agent'
            }
        };
    }
}
