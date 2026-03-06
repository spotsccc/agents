-- Fix auth.users triggers for auto-creating public.users and user_settings
-- Functions need proper search_path and must be owned by postgres
-- to correctly insert into tables when auth.users receives a new row

-- ============================================
-- 1. Fix public.users auto-creation trigger
-- ============================================

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS "on_auth_user_created" ON "auth"."users";

-- Create function to handle new user creation in public.users
CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO "public"."users" ("id", "name", "email", "avatar_url")
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data ->> 'avatar_url'
    )
    ON CONFLICT ("id") DO NOTHING;
    RETURN NEW;
END;
$$;

-- Ensure function is owned by postgres
ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

-- Create trigger for public.users
CREATE TRIGGER "on_auth_user_created"
    AFTER INSERT ON "auth"."users"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."handle_new_user"();

-- ============================================
-- 2. Fix user_settings auto-creation trigger
-- ============================================

-- Drop existing trigger first
DROP TRIGGER IF EXISTS "on_auth_user_created_settings" ON "auth"."users";

-- Recreate the function with proper settings for Supabase auth triggers
CREATE OR REPLACE FUNCTION "public"."create_user_settings_on_signup"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO "public"."user_settings" ("user_id")
    VALUES (NEW.id)
    ON CONFLICT ("user_id") DO NOTHING;
    RETURN NEW;
END;
$$;

-- Ensure function is owned by postgres for proper SECURITY DEFINER behavior
ALTER FUNCTION "public"."create_user_settings_on_signup"() OWNER TO "postgres";

-- Recreate the trigger
CREATE TRIGGER "on_auth_user_created_settings"
    AFTER INSERT ON "auth"."users"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."create_user_settings_on_signup"();
