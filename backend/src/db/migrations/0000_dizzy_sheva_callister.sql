CREATE TABLE IF NOT EXISTS "voice_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"retell_agent_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"industry" varchar(100),
	"tone" varchar(50),
	"goal" text,
	"traits" text,
	"system_prompt" text,
	"voice_config" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"deployed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "voice_agents_retell_agent_id_unique" UNIQUE("retell_agent_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alert_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"trigger_sentiment_negative" boolean DEFAULT false NOT NULL,
	"trigger_conversion_success" boolean DEFAULT false NOT NULL,
	"trigger_handoff_requested" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "call_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"retell_call_id" varchar(255) NOT NULL,
	"agent_id" varchar(255),
	"from_number" varchar(50),
	"to_number" varchar(50),
	"call_status" varchar(50),
	"call_outcome" varchar(100),
	"call_summary" text,
	"user_sentiment" numeric(3, 2),
	"duration_ms" integer,
	"cost_cents" integer,
	"recording_url" text,
	"transcript" jsonb,
	"metadata" jsonb,
	"start_timestamp" timestamp,
	"end_timestamp" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "call_logs_retell_call_id_unique" UNIQUE("retell_call_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"client_id" varchar(255) NOT NULL,
	"call_id" varchar(255) NOT NULL,
	"direction" varchar(20),
	"status" varchar(50) DEFAULT 'in_progress' NOT NULL,
	"duration_ms" integer,
	"intent" varchar(100),
	"sentiment" varchar(50),
	"summary" text,
	"transcript" jsonb,
	"extracted_data" jsonb,
	"follow_up_scheduled" boolean DEFAULT false,
	"follow_up_sent_at" timestamp,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_call_id_unique" UNIQUE("call_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"email" varchar(255),
	"name" varchar(255),
	"prism_certainty" integer DEFAULT 50,
	"prism_variety" integer DEFAULT 50,
	"prism_significance" integer DEFAULT 50,
	"prism_connection" integer DEFAULT 50,
	"prism_growth" integer DEFAULT 50,
	"prism_contribution" integer DEFAULT 50,
	"total_calls" integer DEFAULT 0,
	"last_call_at" timestamp,
	"crm_id" varchar(255),
	"crm_provider" varchar(50),
	"metadata" jsonb,
	"tags" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "error_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar(255),
	"user_id" uuid,
	"service" varchar(100) NOT NULL,
	"operation" varchar(255) NOT NULL,
	"error_type" varchar(100),
	"error_message" text NOT NULL,
	"stack_trace" text,
	"context" jsonb,
	"severity" varchar(20) DEFAULT 'info',
	"notified" boolean DEFAULT false,
	"resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar(255) NOT NULL,
	"customer_id" uuid,
	"conversation_id" uuid,
	"channel" varchar(20) NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"subject" varchar(500),
	"body" text NOT NULL,
	"message_type" varchar(50),
	"scheduled_for" timestamp DEFAULT now() NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0,
	"max_attempts" integer DEFAULT 3,
	"last_attempt_at" timestamp,
	"last_error" text,
	"dead_letter_at" timestamp,
	"dead_letter_reason" text,
	"provider_id" varchar(255),
	"provider_status" varchar(50),
	"provider_used" varchar(50),
	"cost_cents" real,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"level" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"plan" varchar(50) DEFAULT 'INITIATE' NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"avatar_url" varchar(500),
	"retell_api_key_encrypted" varchar(500),
	"retell_agent_id" varchar(255),
	"client_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(100),
	"retell_call_id" varchar(255),
	"client_id" varchar(100),
	"idempotency_key" varchar(400),
	"payload" jsonb,
	"processed" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_triggers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"n8n_webhook_url" text NOT NULL,
	"trigger_event" varchar(100),
	"filter_criteria" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"execution_count" integer DEFAULT 0 NOT NULL,
	"last_triggered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "webhook_events_idempotency_key_idx" ON "webhook_events" ("idempotency_key");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "voice_agents" ADD CONSTRAINT "voice_agents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alert_configs" ADD CONSTRAINT "alert_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_queue" ADD CONSTRAINT "message_queue_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_queue" ADD CONSTRAINT "message_queue_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_triggers" ADD CONSTRAINT "workflow_triggers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
