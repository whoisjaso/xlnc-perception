import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  FRONTEND_URL: z.string().url(),
  RETELL_WEBHOOK_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),
  SENDGRID_FROM_NAME: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  REDIS_URL: z.string().url().optional().or(z.literal('')),
  N8N_BASE_URL: z.string().url().optional().or(z.literal('')),
  ENCRYPTION_KEY: z.string().min(32).optional().or(z.literal('')),
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),

  // Divine Agentic System - Claude AI
  ANTHROPIC_API_KEY: z.string().optional(),

  // Divine Agentic System - Zoho (Unified OAuth for CRM + Calendar)
  ZOHO_CLIENT_ID: z.string().optional(),
  ZOHO_CLIENT_SECRET: z.string().optional(),
  ZOHO_REDIRECT_URI: z.string().optional(),
  ZOHO_REFRESH_TOKEN: z.string().optional(),
  ZOHO_CALENDAR_ID: z.string().optional(),

  // Legacy separate credentials (deprecated - use unified above)
  ZOHO_CRM_CLIENT_ID: z.string().optional(),
  ZOHO_CRM_CLIENT_SECRET: z.string().optional(),
  ZOHO_CRM_REFRESH_TOKEN: z.string().optional(),
  ZOHO_CALENDAR_CLIENT_ID: z.string().optional(),
  ZOHO_CALENDAR_CLIENT_SECRET: z.string().optional(),
  ZOHO_CALENDAR_REFRESH_TOKEN: z.string().optional(),

  // Divine Agentic System - Text180 SMS
  TEXT180_AUTH_KEY: z.string().optional(),
  TEXT180_ACCOUNT_ID: z.string().transform(Number).optional(),
  TEXT180_SHORT_CODE: z.string().optional(),
  TEXT180_KEYWORD: z.string().optional(),
  TXT180_API_URL: z.string().optional(), // Legacy
  TXT180_API_KEY: z.string().optional(), // Legacy

  // Divine Agentic System - Slack Alerting
  SLACK_WEBHOOK_URL: z.string().optional(),

  // Divine Agentic System - Zoho Mail
  ZOHO_SMTP_HOST: z.string().optional(),
  ZOHO_SMTP_PORT: z.string().transform(Number).optional(),
  ZOHO_SMTP_USER: z.string().optional(),
  ZOHO_SMTP_PASS: z.string().optional(),
  ZOHO_SMTP_FROM: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  // Debug: Log DATABASE_URL before validation
  console.log('🔍 DATABASE_URL value:', process.env.DATABASE_URL);
  console.log('🔍 DATABASE_URL type:', typeof process.env.DATABASE_URL);
  console.log('🔍 DATABASE_URL length:', process.env.DATABASE_URL?.length);

  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Environment validation failed:');
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  }
  process.exit(1);
}

export default env;
