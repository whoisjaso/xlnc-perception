// Test the function dispatcher for calendar booking
// This tests the Zoho Calendar integration without needing the full server

import { ZohoCalendarService } from '../src/services/divine/zoho-calendar.service';
import { format, addDays, startOfDay, parseISO } from 'date-fns';
import env from '../src/config/env';

async function testCalendarAvailability() {
  console.log('\n=== Testing Calendar Availability ===\n');

  const calendarService = new ZohoCalendarService();

  if (!calendarService.isConfigured()) {
    console.log('❌ Calendar service not configured. Check env vars.');
    return;
  }

  console.log('✓ Calendar service is configured');

  // Test: Get available slots for tomorrow
  const tomorrow = startOfDay(addDays(new Date(), 1));
  console.log(`\nChecking availability for: ${format(tomorrow, 'EEEE, MMMM do yyyy')}`);

  try {
    const slots = await calendarService.getAvailableSlots(tomorrow, 30, { start: 9, end: 17 });

    console.log(`\n✓ Found ${slots.length} available slots:`);
    slots.slice(0, 5).forEach((slot, i) => {
      console.log(`  ${i + 1}. ${slot.formatted}`);
    });

    // Test speech formatting
    const speech = calendarService.formatSlotsForSpeech(slots, 3);
    console.log(`\nAgent would say: "${speech}"`);

    return slots;
  } catch (error) {
    console.error('❌ Error checking availability:', error);
    return null;
  }
}

async function testBookAppointment(slots: any[] | null) {
  console.log('\n=== Testing Appointment Booking (LIVE) ===\n');

  if (!slots || slots.length === 0) {
    console.log('No slots available to test booking');
    return null;
  }

  const calendarService = new ZohoCalendarService();
  const testSlot = slots[0];

  console.log(`Creating test event at: ${testSlot.formatted}`);

  try {
    const event = await calendarService.createEvent(
      {
        title: 'TEST - Auto Delete - Tax Consultation',
        startTime: testSlot.start,
        endTime: testSlot.end,
        description: 'AUTOMATED TEST - Safe to delete. Created by test-function-dispatch.ts',
        attendees: [],
      },
      'America/New_York'
    );

    console.log('✓ Event created successfully!');
    console.log(`  Event ID: ${event.id}`);
    console.log(`  Title: ${event.title}`);
    console.log(`  Time: ${testSlot.formatted}`);
    console.log('\n⚠️  Remember to delete this test event from Zoho Calendar');

    return event;
  } catch (error) {
    console.error('❌ Failed to create event:', error);
    return null;
  }
}

async function simulateFunctionCall() {
  console.log('\n=== Simulating Retell Function Call ===\n');

  // Simulate the exact payload Retell would send
  const mockPayload = {
    call: {
      call_id: 'test-call-123',
      agent_id: env.RETELL_AGENT_ID || 'agent_2902ef6cd0a87f863052e3efff',
      from_number: '+15555551234',
      to_number: '+18885551234',
      direction: 'inbound',
    },
    function_call: {
      name: 'check_calendar_availability',
      arguments: {
        requested_date: 'tomorrow',
        time_preference: 'morning',
      },
    },
  };

  console.log('Retell would send:');
  console.log(JSON.stringify(mockPayload, null, 2));

  console.log('\nBackend would respond with available slots formatted for speech.');
}

async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  XLNC Divine System - Calendar Function Test       ║');
  console.log('╚════════════════════════════════════════════════════╝');

  // Test 1: Calendar availability
  const slots = await testCalendarAvailability();

  // Test 2: Booking simulation
  await testBookAppointment(slots);

  // Test 3: Function call simulation
  await simulateFunctionCall();

  console.log('\n✅ All tests completed!');
  console.log('\nNext steps:');
  console.log('1. Configure the Retell agent with the function definitions');
  console.log('2. Set the function webhook URL to: /api/webhooks/retell/smart-tax-nation/function');
  console.log('3. Test a live call with the voice agent');
}

main().catch(console.error);
