-- Create user_settings table
CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL UNIQUE,
    -- Onboarding
    "onboarding_finished" boolean DEFAULT false NOT NULL,
    -- Display preferences
    "theme" text DEFAULT 'system' NOT NULL,
    "language" text DEFAULT 'en' NOT NULL,
    "date_format" text DEFAULT 'DD/MM/YYYY' NOT NULL,
    "time_format" text DEFAULT '24h' NOT NULL,
    -- Currency preferences
    "default_currency" text DEFAULT 'USD' NOT NULL,
    -- Notifications
    "notifications_enabled" boolean DEFAULT true NOT NULL,
    "email_notifications" boolean DEFAULT true NOT NULL,
    -- Extensible metadata
    "metadata" jsonb DEFAULT '{}' NOT NULL,
    -- Timestamps
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL
);

-- Primary key
ALTER TABLE "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id");

-- Foreign key to auth.users
ALTER TABLE "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Check constraints
ALTER TABLE "public"."user_settings"
    ADD CONSTRAINT "user_settings_theme_check"
    CHECK (theme IN ('light', 'dark', 'system'));

ALTER TABLE "public"."user_settings"
    ADD CONSTRAINT "user_settings_time_format_check"
    CHECK (time_format IN ('12h', '24h'));

-- Index on user_id
CREATE INDEX "user_settings_user_id_idx"
    ON "public"."user_settings" USING btree ("user_id");

-- Updated_at trigger
CREATE OR REPLACE TRIGGER "set_user_settings_updated_at"
    BEFORE UPDATE ON "public"."user_settings"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."set_updated_at"();

-- Enable RLS
ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Enable users to view and edit their own settings"
    ON "public"."user_settings"
    TO "authenticated"
    USING ((SELECT auth.uid()) = user_id);

-- Auto-insert trigger: create settings when new user signs up
CREATE OR REPLACE FUNCTION "public"."create_user_settings_on_signup"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO "public"."user_settings" ("user_id")
    VALUES (NEW.id);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER "on_auth_user_created_settings"
    AFTER INSERT ON "auth"."users"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."create_user_settings_on_signup"();
