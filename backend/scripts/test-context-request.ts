/**
 * Test script to verify context_request handling returns customer data
 */
import { CentralRouter } from '../src/core/router';
import { clientConfigService } from '../src/services/divine/client-config.service';
import { customerService } from '../src/services/divine/customer.service';
import { conversationService } from '../src/services/divine/conversation.service';

async function testContextRequest() {
  console.log('=== Testing context_request handling ===\n');

  // Load Smart Tax Nation config
  const config = await clientConfigService.getConfig('smart-tax-nation');
  if (!config) {
    console.error('ERROR: Could not load smart-tax-nation config');
    process.exit(1);
  }
  console.log('Loaded config for:', config.business_name);

  // Create a test customer if one doesn't exist
  const testPhone = '+15551234567';
  let customer = await customerService.getByPhone(config.client_id, testPhone);

  if (!customer) {
    console.log('Creating test customer...');
    customer = await customerService.getOrCreate(config.client_id, testPhone, {
      name: 'Test Customer',
      email: 'test@example.com',
    });
  }
  console.log('Test customer ID:', customer.id);

  // Create a test conversation if needed
  const conversations = await conversationService.getRecentByCustomer(customer.id, 1);
  if (conversations.length === 0) {
    console.log('Creating test conversation...');
    await conversationService.create({
      customerId: customer.id,
      clientId: config.client_id,
      callId: 'test-call-' + Date.now(),
      direction: 'inbound',
      status: 'completed',
      summary: 'Discussed tax filing options',
      intent: 'tax_filing_inquiry',
    });
  }

  // Increment call count
  await customerService.incrementCallCount(customer.id);

  // Test context_request
  const router = new CentralRouter();
  const mockEvent = {
    event_id: 'test-event-' + Date.now(),
    event_type: 'context_request' as const,
    call: {
      call_id: 'test-call-' + Date.now(),
      from_number: testPhone,
      to_number: '+18001234567',
      agent_id: config.retell_agent_id || 'test-agent',
      direction: 'inbound' as const,
      call_status: 'ongoing' as const,
      transcript: '',
      duration_seconds: 0,
    },
    timestamp: new Date().toISOString(),
  };

  console.log('\nSending context_request...');
  const decision = await router.route(mockEvent, config as any);

  console.log('\n=== RESULT ===');
  console.log('Action:', decision.action);

  if (decision.action === 'respond_with_context' && decision.response) {
    console.log('\nContext Response:');
    console.log(JSON.stringify(decision.response, null, 2));

    // Verify key fields
    const response = decision.response;
    const checks = [
      { field: 'customer_name', expected: 'Test Customer', actual: response.customer_name },
      { field: 'is_returning_customer', expected: 'true', actual: response.is_returning_customer },
      { field: 'returning_customer', expected: true, actual: response.returning_customer },
    ];

    console.log('\n=== VERIFICATION ===');
    let allPassed = true;
    for (const check of checks) {
      const passed = String(check.actual) === String(check.expected);
      console.log(`${passed ? 'PASS' : 'FAIL'}: ${check.field} = ${check.actual} (expected: ${check.expected})`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('\nSUCCESS: context_request returns customer data correctly');
    } else {
      console.log('\nFAILURE: Some checks failed');
      process.exit(1);
    }
  } else {
    console.error('ERROR: Expected respond_with_context action');
    process.exit(1);
  }
}

testContextRequest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
