-- Drop existing policy
DROP POLICY IF EXISTS "Enable users to view and edit their own settings" ON "public"."user_settings";

-- Create separate policies for SELECT and UPDATE only (no INSERT/DELETE)
CREATE POLICY "Users can select their own settings"
    ON "public"."user_settings"
    FOR SELECT
    TO "authenticated"
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own settings"
    ON "public"."user_settings"
    FOR UPDATE
    TO "authenticated"
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
