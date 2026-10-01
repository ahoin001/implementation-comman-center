-- The deployed app still uses the anon key (no session) and writes settings
-- as the solo user. Team policies are authenticated-only, so those writes
-- fail with "new row violates row-level security policy".
-- Restore anon access for the tables that solo client reads and writes.
-- Authenticated policies stay in place for the signed-in app.

INSERT INTO app_implementation_center_v1.user_settings (user_id, user_name)
SELECT
  id,
  COALESCE(NULLIF(raw_user_meta_data->>'display_name', ''), split_part(email, '@', 1), 'Teammate')
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

DROP POLICY IF EXISTS icc_implementations_anon ON app_implementation_center_v1.implementations;
DROP POLICY IF EXISTS icc_tasks_anon ON app_implementation_center_v1.implementation_tasks;
DROP POLICY IF EXISTS icc_notes_anon ON app_implementation_center_v1.notes;
DROP POLICY IF EXISTS icc_events_anon ON app_implementation_center_v1.calendar_events;
DROP POLICY IF EXISTS icc_activities_anon ON app_implementation_center_v1.activities;
DROP POLICY IF EXISTS icc_settings_anon ON app_implementation_center_v1.user_settings;
DROP POLICY IF EXISTS icc_member_feature_defs_anon ON app_implementation_center_v1.member_feature_definitions;

CREATE POLICY icc_implementations_anon ON app_implementation_center_v1.implementations
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY icc_tasks_anon ON app_implementation_center_v1.implementation_tasks
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY icc_notes_anon ON app_implementation_center_v1.notes
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY icc_events_anon ON app_implementation_center_v1.calendar_events
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY icc_activities_anon ON app_implementation_center_v1.activities
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY icc_settings_anon ON app_implementation_center_v1.user_settings
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY icc_member_feature_defs_anon ON app_implementation_center_v1.member_feature_definitions
  FOR ALL TO anon USING (true) WITH CHECK (true);
