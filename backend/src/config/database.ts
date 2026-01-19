import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import env from './env';
import * as schema from '../db/schema/users';

// Create PostgreSQL connection
const connectionString = env.DATABASE_URL;

// For querying
const queryClient = postgres(connectionString);

// Initialize Drizzle ORM
export const db = drizzle(queryClient, { schema });

// Test connection
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await queryClient`SELECT 1`;
    console.log('✅ Database connection established');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Auto-run migrations on startup
export const runMigrations = async (): Promise<void> => {
  try {
    console.log('📊 Running database migrations...');

    // Create users table
    await queryClient`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        plan VARCHAR(50) DEFAULT 'INITIATE' NOT NULL,
        is_admin BOOLEAN DEFAULT false NOT NULL,
        avatar_url VARCHAR(500),
        retell_api_key_encrypted VARCHAR(500),
        retell_agent_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create call_logs table
    await queryClient`
      CREATE TABLE IF NOT EXISTS call_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        retell_call_id VARCHAR(255) UNIQUE NOT NULL,
        agent_id VARCHAR(255),
        from_number VARCHAR(50),
        to_number VARCHAR(50),
        call_status VARCHAR(50),
        call_outcome VARCHAR(100),
        call_summary TEXT,
        user_sentiment DECIMAL(3,2),
        duration_ms INTEGER,
        cost_cents INTEGER,
        recording_url TEXT,
        transcript JSONB,
        metadata JSONB,
        start_timestamp TIMESTAMP,
        end_timestamp TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create voice_agents table
    await queryClient`
      CREATE TABLE IF NOT EXISTS voice_agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        retell_agent_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        industry VARCHAR(100),
        tone VARCHAR(50),
        goal TEXT,
        traits TEXT,
        system_prompt TEXT,
        voice_config JSONB,
        is_active BOOLEAN DEFAULT true NOT NULL,
        deployed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create alert_configs table
    await queryClient`
      CREATE TABLE IF NOT EXISTS alert_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255),
        phone VARCHAR(50),
        trigger_sentiment_negative BOOLEAN DEFAULT false NOT NULL,
        trigger_conversion_success BOOLEAN DEFAULT false NOT NULL,
        trigger_handoff_requested BOOLEAN DEFAULT false NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create workflow_triggers table
    await queryClient`
      CREATE TABLE IF NOT EXISTS workflow_triggers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        n8n_webhook_url TEXT NOT NULL,
        trigger_event VARCHAR(100),
        filter_criteria JSONB,
        is_active BOOLEAN DEFAULT true NOT NULL,
        execution_count INTEGER DEFAULT 0 NOT NULL,
        last_triggered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create system_logs table
    await queryClient`
      CREATE TABLE IF NOT EXISTS system_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        level VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create webhook_events table
    await queryClient`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(100),
        retell_call_id VARCHAR(255),
        payload JSONB,
        processed BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    throw error;
  }
};
