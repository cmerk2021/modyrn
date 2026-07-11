CREATE TABLE IF NOT EXISTS "guilds" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"icon" varchar(255),
	"owner_id" varchar(20) NOT NULL,
	"complexity_mode" varchar(20) DEFAULT 'simple' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"bot_present" boolean DEFAULT false NOT NULL,
	"setup_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dashboard_users" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"username" varchar(32) NOT NULL,
	"global_name" varchar(32),
	"avatar" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth_tokens" (
	"user_id" varchar(20) PRIMARY KEY NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"scope" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"user_agent" text,
	"ip_address" varchar(64),
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guild_members" (
	"guild_id" varchar(20) NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"username" varchar(32) NOT NULL,
	"global_name" varchar(32),
	"nickname" varchar(32),
	"avatar" varchar(255),
	"is_bot" boolean DEFAULT false NOT NULL,
	"role_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"joined_at" timestamp with time zone,
	"account_created_at" timestamp with time zone,
	"present" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guild_members_guild_id_user_id_pk" PRIMARY KEY("guild_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "member_notes" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"author_id" varchar(20) NOT NULL,
	"content" varchar(2000) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dashboard_role_assignments" (
	"guild_id" varchar(20) NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"role_id" varchar(26) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dashboard_role_assignments_guild_id_user_id_role_id_pk" PRIMARY KEY("guild_id","user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dashboard_roles" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"name" varchar(60) NOT NULL,
	"color" varchar(7) DEFAULT '#5865F2' NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "appeals" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"case_id" varchar(26) NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"content" varchar(4000) NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"resolved_by" varchar(20),
	"resolution_note" varchar(2000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cases" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"case_number" integer NOT NULL,
	"action" varchar(24) NOT NULL,
	"status" varchar(16) DEFAULT 'open' NOT NULL,
	"severity" varchar(12) DEFAULT 'low' NOT NULL,
	"origin" varchar(16) DEFAULT 'dashboard' NOT NULL,
	"target_user_id" varchar(20) NOT NULL,
	"moderator_id" varchar(20) NOT NULL,
	"reason" varchar(2000),
	"duration_ms" bigint,
	"expires_at" timestamp with time zone,
	"evidence" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "automod_events" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"rule_id" varchar(26),
	"user_id" varchar(20) NOT NULL,
	"channel_id" varchar(20),
	"actions_taken" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"content_snapshot" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "automod_rules" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"enabled" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"event" varchar(32) NOT NULL,
	"conditions" jsonb NOT NULL,
	"actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"stop_processing" boolean DEFAULT false NOT NULL,
	"exempt_role_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"exempt_channel_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "log_settings" (
	"guild_id" varchar(20) NOT NULL,
	"event_type" varchar(32) NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"channel_id" varchar(20),
	"webhook_url_encrypted" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "log_settings_guild_id_event_type_pk" PRIMARY KEY("guild_id","event_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "embed_templates" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"message" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "managed_messages" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"channel_id" varchar(20) NOT NULL,
	"discord_message_id" varchar(20),
	"message" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reaction_roles" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"channel_id" varchar(20) NOT NULL,
	"message_id" varchar(20),
	"type" varchar(12) DEFAULT 'reaction' NOT NULL,
	"exclusive" boolean DEFAULT false NOT NULL,
	"mappings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scheduled_messages" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"channel_id" varchar(20) NOT NULL,
	"message" jsonb NOT NULL,
	"send_at" timestamp with time zone NOT NULL,
	"recurrence" varchar(100),
	"sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "utility_configs" (
	"guild_id" varchar(20) NOT NULL,
	"module" varchar(32) NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "utility_configs_guild_id_module_pk" PRIMARY KEY("guild_id","module")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "emergency_states" (
	"guild_id" varchar(20) PRIMARY KEY NOT NULL,
	"raid_mode_enabled" boolean DEFAULT false NOT NULL,
	"chat_frozen" boolean DEFAULT false NOT NULL,
	"server_locked" boolean DEFAULT false NOT NULL,
	"invites_restricted" boolean DEFAULT false NOT NULL,
	"activated_by" varchar(20),
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quarantine_profiles" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"target" varchar(24) NOT NULL,
	"quarantine_role_id" varchar(20) NOT NULL,
	"strip_roles" boolean DEFAULT true NOT NULL,
	"duration_minutes" integer,
	"recent_window_minutes" integer,
	"filter" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quarantine_records" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"profile_id" varchar(26),
	"case_id" varchar(26),
	"stripped_role_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics_snapshots" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"day" date NOT NULL,
	"metrics" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"actor_id" varchar(20) NOT NULL,
	"action" varchar(64) NOT NULL,
	"target_type" varchar(32),
	"target_id" varchar(64),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "backups" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20),
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"size_bytes" bigint,
	"location" varchar(500),
	"error" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth_tokens" ADD CONSTRAINT "oauth_tokens_user_id_dashboard_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."dashboard_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_dashboard_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."dashboard_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guild_members" ADD CONSTRAINT "guild_members_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_notes" ADD CONSTRAINT "member_notes_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dashboard_role_assignments" ADD CONSTRAINT "dashboard_role_assignments_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dashboard_role_assignments" ADD CONSTRAINT "dashboard_role_assignments_user_id_dashboard_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."dashboard_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dashboard_role_assignments" ADD CONSTRAINT "dashboard_role_assignments_role_id_dashboard_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."dashboard_roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dashboard_roles" ADD CONSTRAINT "dashboard_roles_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "appeals" ADD CONSTRAINT "appeals_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "appeals" ADD CONSTRAINT "appeals_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cases" ADD CONSTRAINT "cases_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "automod_events" ADD CONSTRAINT "automod_events_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "automod_events" ADD CONSTRAINT "automod_events_rule_id_automod_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."automod_rules"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "automod_rules" ADD CONSTRAINT "automod_rules_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "log_settings" ADD CONSTRAINT "log_settings_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "embed_templates" ADD CONSTRAINT "embed_templates_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "managed_messages" ADD CONSTRAINT "managed_messages_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reaction_roles" ADD CONSTRAINT "reaction_roles_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "utility_configs" ADD CONSTRAINT "utility_configs_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "emergency_states" ADD CONSTRAINT "emergency_states_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quarantine_profiles" ADD CONSTRAINT "quarantine_profiles_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quarantine_records" ADD CONSTRAINT "quarantine_records_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quarantine_records" ADD CONSTRAINT "quarantine_records_profile_id_quarantine_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."quarantine_profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "backups" ADD CONSTRAINT "backups_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guilds_owner_idx" ON "guilds" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guild_members_username_idx" ON "guild_members" USING btree ("guild_id","username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guild_members_joined_idx" ON "guild_members" USING btree ("guild_id","joined_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "member_notes_member_idx" ON "member_notes" USING btree ("guild_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dashboard_role_assignments_user_idx" ON "dashboard_role_assignments" USING btree ("guild_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dashboard_roles_guild_idx" ON "dashboard_roles" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appeals_case_idx" ON "appeals" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appeals_guild_status_idx" ON "appeals" USING btree ("guild_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cases_guild_case_number_idx" ON "cases" USING btree ("guild_id","case_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cases_target_idx" ON "cases" USING btree ("guild_id","target_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cases_moderator_idx" ON "cases" USING btree ("guild_id","moderator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cases_status_idx" ON "cases" USING btree ("guild_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cases_expires_idx" ON "cases" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "automod_events_guild_idx" ON "automod_events" USING btree ("guild_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "automod_events_rule_idx" ON "automod_events" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "automod_rules_guild_enabled_idx" ON "automod_rules" USING btree ("guild_id","enabled");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "automod_rules_priority_idx" ON "automod_rules" USING btree ("guild_id","priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "embed_templates_guild_idx" ON "embed_templates" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "managed_messages_guild_idx" ON "managed_messages" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reaction_roles_guild_idx" ON "reaction_roles" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reaction_roles_message_idx" ON "reaction_roles" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scheduled_messages_due_idx" ON "scheduled_messages" USING btree ("sent","send_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quarantine_profiles_guild_idx" ON "quarantine_profiles" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quarantine_records_active_idx" ON "quarantine_records" USING btree ("guild_id","released_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quarantine_records_expires_idx" ON "quarantine_records" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "analytics_snapshots_guild_day_idx" ON "analytics_snapshots" USING btree ("guild_id","day");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_guild_idx" ON "audit_log" USING btree ("guild_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_actor_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "backups_created_idx" ON "backups" USING btree ("created_at");