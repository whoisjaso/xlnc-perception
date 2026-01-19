// Divine Agentic Intelligence System - Function Call Dispatcher
// Routes and executes Retell function calls

import { logger } from '../../utils/logger';
import { z } from 'zod';
import {
  RetellFunctionCallRequest,
  RetellFunctionCallRequestSchema,
  FunctionCallContext,
  FunctionResponse,
  FunctionName,
  ClientConfig,
  CheckCalendarArgsSchema,
  BookAppointmentArgsSchema,
  CheckInventoryArgsSchema,
  GetCustomerHistoryArgsSchema,
  TransferCallArgsSchema,
  CollectInfoArgsSchema,
  EndCallArgsSchema,
  CheckCalendarArgs,
  BookAppointmentArgs,
  CheckInventoryArgs,
  GetCustomerHistoryArgs,
  TransferCallArgs,
  CollectInfoArgs,
  EndCallArgs,
} from '../../types';
import { zohoCalendarService, ZohoCalendarService } from './zoho-calendar.service';
import { customerService } from './customer.service';
import { conversationService } from './conversation.service';
import { messageQueueService } from './message-queue.service';
import { slackService } from './slack.service';
import {
  parseISO,
  format,
  addDays,
  startOfDay,
  isToday,
  isTomorrow,
  nextMonday,
  nextTuesday,
  nextWednesday,
  nextThursday,
  nextFriday,
  nextSaturday,
  nextSunday,
} from 'date-fns';

export interface FunctionDispatchResult {
  success: boolean;
  response: FunctionResponse;
  executionTimeMs: number;
}

export class FunctionDispatcherService {
  async dispatch(
    rawPayload: unknown,
    clientConfig: ClientConfig
  ): Promise<FunctionDispatchResult> {
    const startTime = Date.now();

    // Validate the function call request
    const parseResult = RetellFunctionCallRequestSchema.safeParse(rawPayload);
    if (!parseResult.success) {
      logger.error({ error: parseResult.error }, 'Invalid function call payload');
      return {
        success: false,
        response: {
          response: "I'm sorry, I encountered an error processing that request. Let me try something else.",
        },
        executionTimeMs: Date.now() - startTime,
      };
    }

    const { call, function_call } = parseResult.data;
    const functionName = function_call.name as FunctionName;
    const args = function_call.arguments;

    const context: FunctionCallContext = {
      call,
      clientConfig,
      customerPhone: call.from_number || call.to_number || '',
    };

    logger.info(
      {
        functionName,
        callId: call.call_id,
        clientId: clientConfig.client_id,
      },
      'Dispatching function call'
    );

    try {
      const response = await this.executeFunction(functionName, args, context);

      const executionTimeMs = Date.now() - startTime;
      logger.info(
        {
          functionName,
          callId: call.call_id,
          executionTimeMs,
        },
        'Function call executed successfully'
      );

      return {
        success: true,
        response,
        executionTimeMs,
      };
    } catch (error) {
      logger.error(
        {
          error,
          functionName,
          callId: call.call_id,
        },
        'Function call execution failed'
      );

      return {
        success: false,
        response: {
          response: "I apologize, but I wasn't able to complete that action. Let me help you another way.",
        },
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  private async executeFunction(
    name: FunctionName,
    args: Record<string, unknown>,
    context: FunctionCallContext
  ): Promise<FunctionResponse> {
    switch (name) {
      case 'check_calendar_availability':
        return this.checkCalendarAvailability(
          CheckCalendarArgsSchema.parse(args),
          context
        );

      case 'book_appointment':
        return this.bookAppointment(
          BookAppointmentArgsSchema.parse(args),
          context
        );

      case 'check_inventory':
        return this.checkInventory(
          CheckInventoryArgsSchema.parse(args),
          context
        );

      case 'get_customer_history':
        return this.getCustomerHistory(
          GetCustomerHistoryArgsSchema.parse(args),
          context
        );

      case 'transfer_to_human':
        return this.transferToHuman(
          TransferCallArgsSchema.parse(args),
          context
        );

      case 'collect_information':
        return this.collectInformation(
          CollectInfoArgsSchema.parse(args),
          context
        );

      case 'end_call':
        return this.endCall(
          EndCallArgsSchema.parse(args),
          context
        );

      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }

  // ============================================
  // CALENDAR FUNCTIONS
  // ============================================

  private async checkCalendarAvailability(
    args: CheckCalendarArgs,
    context: FunctionCallContext
  ): Promise<FunctionResponse> {
    if (!context.clientConfig.appointment_booking_enabled) {
      return {
        response: "I apologize, but online appointment booking isn't available right now. Would you like me to have someone call you back?",
      };
    }

    // Parse the requested date
    const targetDate = this.parseRelativeDate(args.requested_date);
    const durationMinutes = args.duration_minutes || 30;

    // Get business hours for the day
    const dayOfWeek = format(targetDate, 'EEEE').toLowerCase() as keyof typeof context.clientConfig.business_hours;
    const businessHours = context.clientConfig.business_hours[dayOfWeek];

    if (!businessHours || businessHours.closed) {
      return {
        response: `We're closed on ${format(targetDate, 'EEEE')}. Would you like to check another day?`,
        data: { closed: true, day: format(targetDate, 'EEEE') },
      };
    }

    // Get calendar service (use client-specific credentials if available)
    const calendarService = this.getCalendarServiceForClient(context.clientConfig);

    // Check Zoho Calendar for availability
    if (!calendarService.isConfigured()) {
      return {
        response: this.generateMockAvailability(targetDate, args.time_preference),
      };
    }

    const slots = await calendarService.getAvailableSlots(
      targetDate,
      durationMinutes,
      {
        start: parseInt(businessHours.start.split(':')[0]),
        end: parseInt(businessHours.end.split(':')[0]),
      }
    );

    // Filter by time preference if specified
    const filteredSlots = this.filterByTimePreference(slots, args.time_preference);

    if (filteredSlots.length === 0) {
      const nextAvailableDay = isToday(targetDate) ? 'tomorrow' : 'the following day';
      return {
        response: `I don't have any ${args.time_preference || ''} slots available on ${format(targetDate, 'EEEE')}. Would you like me to check ${nextAvailableDay}?`,
        data: { available_slots: [], date: format(targetDate, 'yyyy-MM-dd') },
      };
    }

    const speechResponse = calendarService.formatSlotsForSpeech(filteredSlots, 3);

    return {
      response: speechResponse,
      data: {
        available_slots: filteredSlots.map((s) => ({
          start: s.start.toISOString(),
          end: s.end.toISOString(),
          formatted: s.formatted,
        })),
        date: format(targetDate, 'yyyy-MM-dd'),
      },
    };
  }

  private async bookAppointment(
    args: BookAppointmentArgs,
    context: FunctionCallContext
  ): Promise<FunctionResponse> {
    if (!context.clientConfig.appointment_booking_enabled) {
      return {
        response: "I'm unable to book appointments directly. Let me have someone call you to schedule.",
      };
    }

    const appointmentTime = parseISO(args.datetime);

    // Get calendar service (use client-specific credentials if available)
    const calendarService = this.getCalendarServiceForClient(context.clientConfig);

    // Create calendar event
    let eventId = 'mock-event-id';
    if (calendarService.isConfigured()) {
      const event = await calendarService.createEvent({
        title: `${args.customer_name} - ${args.appointment_type || 'Appointment'}`,
        startTime: appointmentTime,
        endTime: new Date(appointmentTime.getTime() + 30 * 60 * 1000),
        description: args.notes || `Booked via voice AI. Phone: ${args.customer_phone}`,
        attendees: args.customer_email ? [args.customer_email] : [],
        location: context.clientConfig.address,
      });
      eventId = event.id;
    }

    // Update customer record
    const customer = await customerService.getOrCreate(
      context.clientConfig.client_id,
      args.customer_phone
    );

    if (args.customer_name) {
      await customerService.update(customer.id, { name: args.customer_name });
    }
    if (args.customer_email) {
      await customerService.update(customer.id, { email: args.customer_email });
    }

    // Queue confirmation SMS
    if (context.clientConfig.sms_enabled) {
      const confirmationMessage = `Your appointment at ${context.clientConfig.business_name} is confirmed for ${format(appointmentTime, "EEEE, MMMM do 'at' h:mm a")}. Location: ${context.clientConfig.address}. Reply CANCEL to cancel.`;

      await messageQueueService.enqueueSMS(
        context.clientConfig.client_id,
        args.customer_phone,
        confirmationMessage,
        {
          customerId: customer.id,
          metadata: {
            type: 'appointment_confirmation',
            eventId,
            appointmentTime: args.datetime,
          },
        }
      );
    }

    // Update conversation with booking info
    await conversationService.addBookingToConversation(context.call.call_id, {
      eventId,
      appointmentTime: args.datetime,
      customerName: args.customer_name,
    });

    const formattedTime = format(appointmentTime, "EEEE, MMMM do 'at' h:mm a");

    return {
      response: `I've booked your appointment for ${formattedTime}. You'll receive a confirmation text shortly. Is there anything else I can help you with?`,
      data: {
        event_id: eventId,
        confirmed_datetime: args.datetime,
        confirmation_sent: context.clientConfig.sms_enabled,
      },
    };
  }

  // ============================================
  // INVENTORY FUNCTIONS
  // ============================================

  private async checkInventory(
    args: CheckInventoryArgs,
    context: FunctionCallContext
  ): Promise<FunctionResponse> {
    if (!context.clientConfig.inventory_check_enabled) {
      return {
        response: "Let me get more details about what you're looking for, and I can have someone reach out with specific options.",
      };
    }

    // TODO: Implement actual inventory lookup
    // For now, return a helpful response
    return {
      response: `I'm checking our inventory for ${args.query}. Let me have one of our specialists call you with specific options. Can I confirm your phone number?`,
      data: {
        query: args.query,
        filters: args.filters,
      },
    };
  }

  // ============================================
  // CUSTOMER FUNCTIONS
  // ============================================

  private async getCustomerHistory(
    args: GetCustomerHistoryArgs,
    context: FunctionCallContext
  ): Promise<FunctionResponse> {
    const customer = await customerService.getByPhone(args.phone);

    if (!customer) {
      return {
        response: "I don't have any previous records for this number. Is this your first time calling us?",
        data: { found: false },
      };
    }

    const history = await conversationService.getCustomerConversations(customer.id, 5);

    if (history.length === 0) {
      return {
        response: `I see you've called before, ${customer.name || 'there'}. How can I help you today?`,
        data: { found: true, callCount: customer.totalCalls },
      };
    }

    const lastCall = history[0];
    const summary = lastCall.summary || 'a general inquiry';

    return {
      response: `Welcome back${customer.name ? `, ${customer.name}` : ''}! Last time we spoke about ${summary}. How can I help you today?`,
      data: {
        found: true,
        customerName: customer.name,
        callCount: customer.totalCalls,
        lastCallSummary: summary,
      },
    };
  }

  // ============================================
  // CALL CONTROL FUNCTIONS
  // ============================================

  private async transferToHuman(
    args: TransferCallArgs,
    context: FunctionCallContext
  ): Promise<FunctionResponse> {
    if (!context.clientConfig.human_transfer_enabled) {
      return {
        response: "I can't transfer you right now, but I'll make sure someone calls you back within the hour. Is that okay?",
      };
    }

    // Alert team via Slack
    await slackService.sendAlert({
      severity: args.urgency === 'high' ? 'warning' : 'info',
      title: 'Transfer Request',
      message: `Call ${context.call.call_id} requesting human transfer`,
      fields: [
        { name: 'Reason', value: args.reason },
        { name: 'Department', value: args.department || 'General' },
        { name: 'Urgency', value: args.urgency },
        { name: 'Phone', value: context.customerPhone },
      ],
    });

    // Log the transfer request
    await conversationService.addNoteToConversation(context.call.call_id, {
      type: 'transfer_request',
      reason: args.reason,
      department: args.department,
      urgency: args.urgency,
    });

    return {
      response: `I'll connect you with ${args.department || 'one of our team members'} right away. Please hold for just a moment.`,
      data: {
        transfer_initiated: true,
        department: args.department,
        urgency: args.urgency,
      },
    };
  }

  private async collectInformation(
    args: CollectInfoArgs,
    context: FunctionCallContext
  ): Promise<FunctionResponse> {
    const customer = await customerService.getOrCreate(
      context.clientConfig.client_id,
      context.customerPhone
    );

    // Update the appropriate field
    const updateData: Record<string, string> = {};

    switch (args.field.toLowerCase()) {
      case 'name':
        updateData.name = args.value;
        break;
      case 'email':
        updateData.email = args.value;
        break;
      default:
        // Store in metadata
        await conversationService.addDataToConversation(context.call.call_id, {
          [args.field]: args.value,
        });
    }

    if (Object.keys(updateData).length > 0) {
      await customerService.update(customer.id, updateData);
    }

    return {
      response: `Got it, I've noted that down.`,
      data: {
        field: args.field,
        value: args.value,
        stored: true,
      },
    };
  }

  private async endCall(
    args: EndCallArgs,
    context: FunctionCallContext
  ): Promise<FunctionResponse> {
    // Log the end reason
    await conversationService.addNoteToConversation(context.call.call_id, {
      type: 'call_end',
      reason: args.reason,
      sentiment: args.sentiment,
      followUpRequired: args.follow_up_required,
    });

    let closingMessage = 'Thank you for calling. Have a great day!';

    if (args.follow_up_required) {
      closingMessage = 'Thank you for calling. Someone from our team will follow up with you shortly. Have a great day!';
    }

    return {
      response: closingMessage,
      data: {
        reason: args.reason,
        sentiment: args.sentiment,
        follow_up_required: args.follow_up_required,
      },
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get a calendar service instance for a client.
   * Uses client-specific credentials if available, otherwise falls back to global env credentials.
   */
  private getCalendarServiceForClient(clientConfig: ClientConfig): ZohoCalendarService {
    // If client has their own Zoho credentials, create a client-specific service
    if (clientConfig.zoho_client_id && clientConfig.zoho_client_secret && clientConfig.zoho_refresh_token) {
      return ZohoCalendarService.forClient(clientConfig);
    }
    // Otherwise use the global singleton (which uses env credentials)
    return zohoCalendarService;
  }

  private parseRelativeDate(dateString: string): Date {
    const lower = dateString.toLowerCase().trim();
    const now = new Date();

    if (lower === 'today') return startOfDay(now);
    if (lower === 'tomorrow') return startOfDay(addDays(now, 1));
    if (lower === 'next week') return startOfDay(addDays(now, 7));

    // Day names
    const dayFunctions: Record<string, (date: Date) => Date> = {
      monday: nextMonday,
      tuesday: nextTuesday,
      wednesday: nextWednesday,
      thursday: nextThursday,
      friday: nextFriday,
      saturday: nextSaturday,
      sunday: nextSunday,
    };

    for (const [day, fn] of Object.entries(dayFunctions)) {
      if (lower.includes(day)) {
        return startOfDay(fn(now));
      }
    }

    // Try to parse as ISO date
    try {
      return parseISO(dateString);
    } catch {
      // Default to tomorrow if can't parse
      return startOfDay(addDays(now, 1));
    }
  }

  private filterByTimePreference(
    slots: Array<{ start: Date; end: Date; formatted: string }>,
    preference?: string
  ): Array<{ start: Date; end: Date; formatted: string }> {
    if (!preference || preference === 'any') return slots;

    return slots.filter((slot) => {
      const hour = slot.start.getHours();

      switch (preference) {
        case 'morning':
          return hour >= 9 && hour < 12;
        case 'afternoon':
          return hour >= 12 && hour < 17;
        case 'evening':
          return hour >= 17;
        default:
          return true;
      }
    });
  }

  private generateMockAvailability(date: Date, preference?: string): string {
    const times = ['9:00 AM', '10:30 AM', '2:00 PM', '3:30 PM'];
    const filtered =
      preference === 'morning'
        ? times.slice(0, 2)
        : preference === 'afternoon'
        ? times.slice(2)
        : times;

    const formatted = format(date, 'EEEE');
    return `For ${formatted}, I have ${filtered.slice(0, 3).join(', ')} available. Which works best for you?`;
  }
}

export const functionDispatcherService = new FunctionDispatcherService();
