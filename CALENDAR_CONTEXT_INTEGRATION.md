# Calendar Context Integration for Retell Agent

## Overview

Your backend now injects **real-time Zoho Calendar availability** into your Retell agent during live calls via the `context_request` webhook event.

## How It Works

1. **Call Starts** → Retell sends `context_request` webhook to your backend
2. **Backend Fetches** → Zoho Calendar service checks available slots for today + tomorrow
3. **Dynamic Variables Returned** → Calendar data injected into agent's conversation context
4. **Agent Uses Context** → Agent can reference these variables in responses to give accurate appointment times

## Available Dynamic Variables

Your agent now has access to these variables during calls:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `{{available_today}}` | Today's available slots (formatted for speech) | "I have 10:00 AM - 11:00 AM, 2:00 PM - 3:00 PM, or 4:00 PM - 5:00 PM available." |
| `{{available_tomorrow}}` | Tomorrow's available slots | "I have 9:00 AM - 10:00 AM, 11:00 AM - 12:00 PM, or 3:00 PM - 4:00 PM available." |
| `{{has_availability}}` | Boolean - whether any slots exist | `true` or `false` |
| `{{next_available}}` | When the next slot is | "today", "tomorrow", or "later this week" |
| `{{returning_customer}}` | Whether caller has called before | `true` or `false` |
| `{{previous_interactions}}` | Number of past calls | `3` |
| `{{last_call_summary}}` | Summary from previous call | "Caller inquired about tax filing for 2024..." |

## How to Use in Your Agent Prompt

### Option 1: Update Global Prompt (Recommended)

Add these variables to your conversation flow's `global_prompt` where the agent checks availability:

```markdown
## CALENDAR AVAILABILITY CONTEXT

You have access to real-time calendar information:
- Today's availability: {{available_today}}
- Tomorrow's availability: {{available_tomorrow}}
- Next available slot: {{next_available}}

When a caller asks about appointment times:
1. If {{has_availability}} is true, offer the specific times from {{available_today}} or {{available_tomorrow}}
2. If false, apologize and ask them to call back or offer to take their information

**Example Response:**
"Let me check our calendar... {{available_today}}"
```

### Option 2: Update Specific Nodes

Add calendar context references in the **Appointment Booking** node:

```markdown
**Before offering times, reference the calendar:**

"Let me see what we have available... {{#if has_availability}}{{available_today}}{{else}}We're fully booked today, but {{available_tomorrow}}{{/if}}"
```

## Update Your Retell Agent

You can update the agent's global prompt using the Retell MCP tools or via the Retell dashboard.

### Via MCP (Recommended):

```typescript
// Update the conversation flow to include calendar context
mcp__retell-ai__retell_update_conversation_flow({
  conversation_flow_id: "conversation_flow_adebf64b666c",
  global_prompt: `
    # SOPHIA: Smart Tax Nation Voice Agent

    ## Dynamic Calendar Context

    **Real-Time Availability:**
    - Today: {{available_today}}
    - Tomorrow: {{available_tomorrow}}
    - Next available: {{next_available}}
    - Availability status: {{has_availability}}

    **Customer History:**
    - Returning customer: {{returning_customer}}
    - Previous calls: {{previous_interactions}}

    [Rest of your existing prompt...]
  `
})
```

## Testing the Integration

### 1. Verify Webhook Configuration

Make sure your Retell agent's webhook URL is set to:
```
https://your-domain.com/api/webhooks/retell/smart-tax-nation
```

### 2. Check Zoho Calendar Credentials

Ensure your Smart Tax Nation config has:
- `zoho_client_id`
- `zoho_client_secret`
- `zoho_refresh_token`
- `zoho_calendar_id`

### 3. Make a Test Call

1. Call your Retell agent
2. When booking, the agent should reference actual available times
3. Check backend logs for:
   ```
   Handling context_request for calendar availability
   Calendar context injected { todaySlots: 5, tomorrowSlots: 7 }
   ```

## Backend Implementation Details

### Files Modified

- `backend/src/core/types.ts` - Added `context_request` event type
- `backend/src/core/router.ts` - Added `handleContextRequest()` method
- `backend/src/routes/webhooks.ts` - Returns dynamic variables for context requests

### Context Request Handler

Located in `backend/src/core/router.ts:49-124`

The handler:
1. Checks if `appointment_booking_enabled` is true
2. Creates Zoho Calendar service instance with client credentials
3. Fetches available slots for today and tomorrow (60-minute appointments)
4. Formats slots for natural speech using `formatSlotsForSpeech()`
5. Returns dynamic variables in the response

### Response Format

When Retell sends a `context_request`, your backend responds with:

```json
{
  "response_data": {
    "retell_llm_dynamic_variables": {
      "available_today": "I have 10:00 AM - 11:00 AM, 2:00 PM - 3:00 PM available.",
      "available_tomorrow": "I have 9:00 AM - 10:00 AM, 1:00 PM - 2:00 PM available.",
      "has_availability": true,
      "next_available": "today",
      "returning_customer": false,
      "previous_interactions": 0
    }
  }
}
```

## Next Steps

1. ✅ Backend is ready (calendar context handler implemented)
2. ⏳ Update Retell agent's global prompt to reference calendar variables
3. ⏳ Test with a live call
4. ⏳ Monitor logs to verify calendar data is being injected

## Troubleshooting

### Agent not receiving calendar context

**Check:**
1. Webhook URL is correct in Retell dashboard
2. `appointment_booking_enabled: true` in client config
3. Zoho credentials are valid in client config
4. Backend logs show "Calendar context injected"

### Calendar shows no availability

**Check:**
1. Business hours configured correctly in client config
2. Zoho Calendar ID is correct
3. OAuth tokens are valid (check for 401 errors in logs)
4. No events blocking all time slots

### Variables not rendering in agent responses

**Check:**
1. Variables are wrapped in `{{variable_name}}` syntax
2. Global prompt or node instructions reference the variables
3. Agent is using conversation flow (not custom LLM)
