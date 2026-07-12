CREATE TABLE IF NOT EXISTS "case_links" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"case_id" varchar(26) NOT NULL,
	"linked_case_id" varchar(26) NOT NULL,
	"created_by" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "case_notes" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"case_id" varchar(26) NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"author_id" varchar(20) NOT NULL,
	"content" varchar(2000) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "case_links" ADD CONSTRAINT "case_links_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "case_links" ADD CONSTRAINT "case_links_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "case_links" ADD CONSTRAINT "case_links_linked_case_id_cases_id_fk" FOREIGN KEY ("linked_case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "case_links_unique_idx" ON "case_links" USING btree ("case_id","linked_case_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "case_links_case_idx" ON "case_links" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "case_notes_case_idx" ON "case_notes" USING btree ("case_id");