# Retell Agent Setup for XLNC Divine System

This guide covers setting up your Retell AI agent to work with XLNC's Divine Agentic System for calendar booking and other automations.

## Webhook Configuration

Configure these webhook URLs in your Retell Agent dashboard:

### For Smart Tax Nation

**Main Webhook URL** (call events):
```
https://YOUR_BACKEND_DOMAIN/api/webhooks/retell/smart-tax-nation
```

**Function Call URL** (for AI functions):
```
https://YOUR_BACKEND_DOMAIN/api/webhooks/retell/smart-tax-nation/function
```

Replace `YOUR_BACKEND_DOMAIN` with your actual backend URL (e.g., `api.xlnc.app`).

## Function Definitions

Copy these function definitions into your Retell Agent's "Function Calling" configuration:

### 1. check_calendar_availability

**Name:** `check_calendar_availability`

**Description:** Check available appointment slots on a specific date. Use this when the caller asks about availability or wants to schedule an appointment.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "requested_date": {
      "type": "string",
      "description": "The date to check availability for. Can be relative like 'today', 'tomorrow', 'next Monday', or a specific date like '2024-01-15'"
    },
    "time_preference": {
      "type": "string",
      "enum": ["morning", "afternoon", "evening", "any"],
      "description": "Time of day preference: morning (9am-12pm), afternoon (12pm-5pm), evening (5pm+), or any"
    },
    "duration_minutes": {
      "type": "number",
      "description": "Appointment duration in minutes. Defaults to 30 if not specified."
    }
  },
  "required": ["requested_date"]
}
```

### 2. book_appointment

**Name:** `book_appointment`

**Description:** Book an appointment after confirming the time with the caller. Only use this after the caller has selected a specific time slot.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "datetime": {
      "type": "string",
      "description": "The appointment date and time in ISO 8601 format (e.g., '2024-01-15T14:00:00')"
    },
    "customer_name": {
      "type": "string",
      "description": "The caller's full name"
    },
    "customer_phone": {
      "type": "string",
      "description": "The caller's phone number for confirmation"
    },
    "customer_email": {
      "type": "string",
      "description": "The caller's email address (optional)"
    },
    "appointment_type": {
      "type": "string",
      "description": "Type of appointment (e.g., 'Tax Consultation', 'Tax Preparation Review')"
    },
    "notes": {
      "type": "string",
      "description": "Any additional notes about the appointment"
    }
  },
  "required": ["datetime", "customer_name", "customer_phone"]
}
```

### 3. transfer_to_human

**Name:** `transfer_to_human`

**Description:** Transfer the call to a human representative when requested or needed.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "reason": {
      "type": "string",
      "description": "The reason for the transfer"
    },
    "department": {
      "type": "string",
      "enum": ["sales", "support", "billing", "technical", "general"],
      "description": "The department to transfer to"
    },
    "urgency": {
      "type": "string",
      "enum": ["low", "normal", "high"],
      "description": "The urgency level"
    }
  },
  "required": ["reason"]
}
```

### 4. collect_information

**Name:** `collect_information`

**Description:** Store important information provided by the caller.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "field": {
      "type": "string",
      "description": "The type of information (e.g., 'name', 'email', 'tax_situation')"
    },
    "value": {
      "type": "string",
      "description": "The value to store"
    }
  },
  "required": ["field", "value"]
}
```

### 5. end_call

**Name:** `end_call`

**Description:** End the call and log the outcome.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "reason": {
      "type": "string",
      "description": "Why the call is ending"
    },
    "sentiment": {
      "type": "string",
      "enum": ["positive", "neutral", "negative"],
      "description": "Overall sentiment"
    },
    "follow_up_required": {
      "type": "boolean",
      "description": "Whether follow-up is needed"
    }
  },
  "required": ["reason"]
}
```

## Agent Prompt Addition

Add this to your agent's system prompt to guide appointment booking behavior:

```
## Appointment Booking Instructions
When a caller wants to book an appointment:
1. First ask what day works best for them
2. Use check_calendar_availability to find open slots
3. Present 2-3 available options
4. Once they choose a time, confirm their name and phone number
5. Use book_appointment to create the booking
6. Confirm the appointment details back to them

Always be warm and professional. Smart Tax Nation values excellent customer service.
```

## Testing

1. Test the webhook endpoint:
   ```
   GET https://YOUR_BACKEND_DOMAIN/api/webhooks/retell/smart-tax-nation/test
   ```

2. Test a function call manually:
   ```bash
   curl -X POST https://YOUR_BACKEND_DOMAIN/api/webhooks/retell/smart-tax-nation/function \
     -H "Content-Type: application/json" \
     -d '{
       "call": {
         "call_id": "test-123",
         "agent_id": "agent_2902ef6cd0a87f863052e3efff",
         "from_number": "+15555551234"
       },
       "function_call": {
         "name": "check_calendar_availability",
         "arguments": {
           "requested_date": "tomorrow",
           "time_preference": "morning"
         }
       }
     }'
   ```

## Environment Requirements

Ensure these are set in your backend `.env`:

```
# Zoho Calendar (for appointment booking)
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token
ZOHO_CALENDAR_ID=your_calendar_id

# Retell AI
RETELL_WEBHOOK_SECRET=your_webhook_secret
RETELL_AGENT_ID=your_agent_id
```

## Client-Specific Credentials

Each client can have their own Zoho credentials. Add these fields to the client's JSON config:

```json
{
  "zoho_client_id": "client_specific_id",
  "zoho_client_secret": "client_specific_secret",
  "zoho_refresh_token": "client_specific_token",
  "zoho_calendar_id": "client_calendar_id"
}
```

If these are `null`, the system falls back to the global `.env` credentials.
