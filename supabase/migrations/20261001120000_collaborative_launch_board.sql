-- Collaborative launch board: template tasks, comments, favorites, profiles, team RLS

ALTER TABLE app_implementation_center_v1.implementation_tasks
  DROP CONSTRAINT IF EXISTS implementation_tasks_task_key_check;

ALTER TABLE app_implementation_center_v1.implementation_tasks
  DROP CONSTRAINT IF EXISTS implementation_tasks_status_check;

ALTER TABLE app_implementation_center_v1.implementation_tasks
  ADD CONSTRAINT implementation_tasks_status_check
  CHECK (status IN (
    'pending','done','not_needed','blocked',
    'not_started','in_progress','complete','na','as_needed'
  ));

ALTER TABLE app_implementation_center_v1.implementation_tasks
  ADD COLUMN IF NOT EXISTS phase_key text,
  ADD COLUMN IF NOT EXISTS group_key text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS party text,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS app_implementation_center_v1.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_implementation_center_v1.implementation_favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  implementation_id uuid NOT NULL REFERENCES app_implementation_center_v1.implementations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, implementation_id)
);

CREATE TABLE IF NOT EXISTS app_implementation_center_v1.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES app_implementation_center_v1.implementation_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_icc_task_comments_task
  ON app_implementation_center_v1.task_comments (task_id, created_at);

CREATE TABLE IF NOT EXISTS app_implementation_center_v1.launch_task_templates (
  task_key text PRIMARY KEY,
  phase_key text NOT NULL,
  group_key text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  party text NOT NULL,
  default_status text NOT NULL,
  sort_order integer NOT NULL
);

INSERT INTO app_implementation_center_v1.launch_task_templates
  (task_key, phase_key, group_key, title, description, party, default_status, sort_order)
VALUES
  ('send_initial_export', 'prelaunch', 'data', 'Send initial data export', 'Client sends the first data export, excluding CVs and resumes.', 'client', 'not_started', 10),
  ('import_initial_data', 'prelaunch', 'data', 'Import initial data', 'Web Scribble imports the first data export.', 'webscribble', 'not_started', 20),
  ('send_final_export', 'prelaunch', 'data', 'Send final data export', 'Client sends the final data export, excluding CVs and resumes.', 'client', 'not_started', 30),
  ('send_resumes', 'prelaunch', 'data', 'Send CVs and resumes', 'Client sends resume files when the site will include them.', 'client', 'not_started', 40),
  ('import_final_data', 'prelaunch', 'data', 'Import final data', 'Web Scribble imports the final data export.', 'webscribble', 'not_started', 50),
  ('confirm_thrive', 'prelaunch', 'integrations', 'Confirm Higher Logic Thrive Jobs', 'Client confirms whether the Thrive Jobs integration should be turned on. Mark N/A if they do not want it.', 'client', 'not_started', 60),
  ('thrive_credentials', 'prelaunch', 'integrations', 'Provide Thrive Jobs test credentials', 'Needed only when the Thrive Jobs integration is on.', 'client', 'not_started', 70),
  ('setup_thrive', 'prelaunch', 'integrations', 'Set up and test Thrive Jobs', 'Web Scribble configures and tests the integration when it is in scope.', 'webscribble', 'not_started', 80),
  ('test_thrive', 'prelaunch', 'integrations', 'Client tests Thrive Jobs', 'Client verifies the integration and flags anything that needs a tweak.', 'client', 'not_started', 90),
  ('review_marketing', 'prelaunch', 'marketing', 'Review marketing tools in Smartway', 'Walk through banner manager, event tracking, and the publishing suite.', 'webscribble', 'not_started', 100),
  ('ga4_tags', 'prelaunch', 'marketing', 'Add Google Analytics tags', 'Client can add GA4 tags, or Web Scribble can assist.', 'client', 'not_started', 110),
  ('develop_offers', 'prelaunch', 'pricing', 'Develop job posting offers and pricing', 'Web Scribble proposes offers and pricing.', 'webscribble', 'not_started', 120),
  ('review_offers', 'prelaunch', 'pricing', 'Review offers, Job Watch, and partner benefits', 'Decide which offers and benefits to include.', 'webscribble', 'not_started', 130),
  ('approve_offers', 'prelaunch', 'pricing', 'Approve offers and pricing', 'Client approves the final offers and pricing.', 'client', 'not_started', 140),
  ('provide_ach_w9', 'prelaunch', 'payment', 'Provide ACH and W-9', 'Client sends completed ACH and W-9 forms.', 'client', 'not_started', 150),
  ('sales_training', 'prelaunch', 'sales', 'Sales training', 'Review the sales process with the client team.', 'client', 'not_started', 160),
  ('sales_coordination', 'prelaunch', 'sales', 'Sales coordination', 'Coordinate sales based on the role Web Scribble will have.', 'webscribble', 'not_started', 170),
  ('branding', 'prelaunch', 'site', 'Provide branding guidelines and logos', 'Client provides logo files (jpg, png, eps) and brand guidelines.', 'client', 'not_started', 180),
  ('header_images', 'prelaunch', 'site', 'Provide custom header images', 'Homepage 1920x424, career advice 1920x334, pricing 1920x257, png.', 'client', 'not_started', 190),
  ('job_categories', 'prelaunch', 'site', 'Provide job categories', 'Client shares preferred categories. Web Scribble defaults can be customized.', 'client', 'not_started', 200),
  ('site_copy', 'prelaunch', 'site', 'Provide site copy', 'Client reviews copy and sends edits.', 'client', 'not_started', 210),
  ('career_tools', 'prelaunch', 'site', 'Confirm career tools', 'Career advice, guides, interview coach, and offer analyzer, and whether coach tools are gated.', 'client', 'not_started', 220),
  ('ofccp', 'prelaunch', 'site', 'Confirm OFCCP', 'Client decides whether Office of Federal Contract Compliance Programs support is enabled.', 'client', 'not_started', 230),
  ('faqs', 'prelaunch', 'site', 'Review and curate FAQs', 'Client updates FAQs when they want changes.', 'client', 'as_needed', 240),
  ('career_advice', 'prelaunch', 'site', 'Review career advice articles', 'Default articles arrive by RSS. Client can hide them or add their own in Smartway.', 'client', 'as_needed', 250),
  ('review_design', 'prelaunch', 'site', 'Review site design and UX', 'Review the staging site look, feel, and experience before launch.', 'client', 'not_started', 260),
  ('final_review', 'prelaunch', 'site', 'Conduct final site review', 'Web Scribble runs the final review before go-live approval.', 'webscribble', 'not_started', 270),
  ('approve_golive', 'prelaunch', 'site', 'Approve the site to go live', 'Client approves the site for launch.', 'client', 'not_started', 280),
  ('smartway_admins', 'prelaunch', 'smartway', 'Create Smartway admin accounts', 'Client sends the email addresses that need Smartway access.', 'webscribble', 'not_started', 290),
  ('conduct_smartway_training', 'prelaunch', 'smartway', 'Conduct Smartway training', 'Tour of Smartway: reports, content, and marketing tools. Can happen before or after launch.', 'webscribble', 'not_started', 300),
  ('sso_credentials', 'prelaunch', 'sso', 'Provide SSO test credentials', 'Member and non-member test accounts for SSO testing.', 'client', 'not_started', 310),
  ('setup_sso', 'prelaunch', 'sso', 'Set up and test SSO', 'Web Scribble coordinates SSO setup and internal testing.', 'webscribble', 'not_started', 320),
  ('test_sso', 'prelaunch', 'sso', 'Client tests SSO', 'Client confirms SSO and flags tweaks.', 'client', 'not_started', 330),
  ('knowledge_base', 'prelaunch', 'resources', 'Share knowledge base', 'Send the Web Scribble knowledge base link and how to get support.', 'webscribble', 'not_started', 340),
  ('transfer_domain', 'launch', 'golive', 'Transfer domain', 'Point the jobs CNAME to lb1.webscribble.co and tell Web Scribble when DNS is updated.', 'client', 'not_started', 350),
  ('launch_career_center', 'launch', 'golive', 'Launch the career center', 'After DNS is updated, confirm the go-live moment.', 'webscribble', 'not_started', 360),
  ('widgets_rss', 'launch', 'golive', 'Add widgets and RSS to the main site', 'Use the Smartway publishing suite for widgets, HTML, and RSS on high-traffic pages.', 'client', 'as_needed', 370),
  ('post_launch_troubleshooting', 'after', 'tech_support', 'Post-launch troubleshooting', 'help@webscribble.com for issues right after launch.', 'webscribble', 'as_needed', 380),
  ('ongoing_tech_support', 'after', 'tech_support', 'Ongoing technical support', 'Ongoing site support through help@webscribble.com.', 'webscribble', 'as_needed', 390),
  ('post_launch_meeting', 'after', 'client_success', 'Set up the post-launch meeting', 'Move the weekly working session to a standing monthly meeting.', 'webscribble', 'not_started', 400),
  ('additional_training', 'after', 'client_success', 'Additional training', 'Schedule more training when the client needs it.', 'webscribble', 'as_needed', 410),
  ('ongoing_success', 'after', 'client_success', 'Ongoing client success', 'Named client-success contact stays available after launch.', 'webscribble', 'as_needed', 420)
ON CONFLICT (task_key) DO UPDATE SET
  phase_key = EXCLUDED.phase_key,
  group_key = EXCLUDED.group_key,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  party = EXCLUDED.party,
  default_status = EXCLUDED.default_status,
  sort_order = EXCLUDED.sort_order;

CREATE OR REPLACE FUNCTION app_implementation_center_v1.seed_default_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_implementation_center_v1, public
AS $$
BEGIN
  INSERT INTO app_implementation_center_v1.implementation_tasks
    (user_id, implementation_id, task_key, status, phase_key, group_key, title, description, party, sort_order)
  SELECT
    NEW.user_id, NEW.id, t.task_key, t.default_status,
    t.phase_key, t.group_key, t.title, t.description, t.party, t.sort_order
  FROM app_implementation_center_v1.launch_task_templates t
  ON CONFLICT (implementation_id, task_key) DO NOTHING;
  RETURN NEW;
END;
$$;

INSERT INTO app_implementation_center_v1.implementation_tasks
  (user_id, implementation_id, task_key, status, phase_key, group_key, title, description, party, sort_order)
SELECT
  i.user_id, i.id, t.task_key, t.default_status,
  t.phase_key, t.group_key, t.title, t.description, t.party, t.sort_order
FROM app_implementation_center_v1.implementations i
CROSS JOIN app_implementation_center_v1.launch_task_templates t
ON CONFLICT (implementation_id, task_key) DO UPDATE SET
  phase_key = EXCLUDED.phase_key,
  group_key = EXCLUDED.group_key,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  party = EXCLUDED.party,
  sort_order = EXCLUDED.sort_order;

CREATE OR REPLACE FUNCTION app_implementation_center_v1.map_legacy_task_status(s text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE s
    WHEN 'done' THEN 'complete'
    WHEN 'not_needed' THEN 'na'
    WHEN 'blocked' THEN 'in_progress'
    WHEN 'pending' THEN 'not_started'
    ELSE COALESCE(s, 'not_started')
  END
$$;

UPDATE app_implementation_center_v1.implementation_tasks dest
SET status = app_implementation_center_v1.map_legacy_task_status(src.status)
FROM app_implementation_center_v1.implementation_tasks src
WHERE dest.implementation_id = src.implementation_id
  AND src.status IN ('done', 'not_needed', 'blocked')
  AND (
    (dest.task_key = 'review_design' AND src.task_key = 'site_design')
    OR (dest.task_key IN ('import_initial_data', 'import_final_data') AND src.task_key = 'data_import')
    OR (dest.task_key = 'setup_sso' AND src.task_key = 'sso')
    OR (dest.task_key = 'conduct_smartway_training' AND src.task_key = 'smartway_training')
    OR (dest.task_key IN ('develop_offers', 'approve_offers') AND src.task_key = 'pricing_plan')
    OR (dest.task_key = 'launch_career_center' AND src.task_key = 'launch')
  );

UPDATE app_implementation_center_v1.implementation_tasks dest
SET status = 'complete'
FROM app_implementation_center_v1.implementations i
WHERE dest.implementation_id = i.id
  AND dest.task_key = 'provide_ach_w9'
  AND COALESCE(i.deliverables->'ach'->>'received', 'false') = 'true'
  AND COALESCE(i.deliverables->'w9'->>'received', 'false') = 'true';

INSERT INTO app_implementation_center_v1.profiles (id, display_name)
SELECT id, COALESCE(NULLIF(raw_user_meta_data->>'display_name', ''), split_part(email, '@', 1), 'Teammate')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION app_implementation_center_v1.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_implementation_center_v1, public
AS $$
BEGIN
  INSERT INTO app_implementation_center_v1.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name', ''), split_part(NEW.email, '@', 1), 'Teammate')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO app_implementation_center_v1.user_settings (user_id, user_name)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name', ''), split_part(NEW.email, '@', 1), 'Teammate')
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION app_implementation_center_v1.handle_new_user();

ALTER TABLE app_implementation_center_v1.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_implementation_center_v1.implementation_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_implementation_center_v1.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_implementation_center_v1.launch_task_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS icc_implementations_solo ON app_implementation_center_v1.implementations;
DROP POLICY IF EXISTS icc_implementations_own ON app_implementation_center_v1.implementations;
DROP POLICY IF EXISTS icc_tasks_solo ON app_implementation_center_v1.implementation_tasks;
DROP POLICY IF EXISTS icc_tasks_own ON app_implementation_center_v1.implementation_tasks;
DROP POLICY IF EXISTS icc_notes_solo ON app_implementation_center_v1.notes;
DROP POLICY IF EXISTS icc_notes_own ON app_implementation_center_v1.notes;
DROP POLICY IF EXISTS icc_events_solo ON app_implementation_center_v1.calendar_events;
DROP POLICY IF EXISTS icc_events_own ON app_implementation_center_v1.calendar_events;
DROP POLICY IF EXISTS icc_activities_solo ON app_implementation_center_v1.activities;
DROP POLICY IF EXISTS icc_activities_own ON app_implementation_center_v1.activities;
DROP POLICY IF EXISTS icc_settings_solo ON app_implementation_center_v1.user_settings;
DROP POLICY IF EXISTS icc_settings_own ON app_implementation_center_v1.user_settings;
DROP POLICY IF EXISTS icc_member_feature_defs_solo ON app_implementation_center_v1.member_feature_definitions;

CREATE POLICY icc_implementations_team ON app_implementation_center_v1.implementations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY icc_tasks_team ON app_implementation_center_v1.implementation_tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY icc_notes_team ON app_implementation_center_v1.notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY icc_events_team ON app_implementation_center_v1.calendar_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY icc_activities_team ON app_implementation_center_v1.activities
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY icc_member_feature_defs_team ON app_implementation_center_v1.member_feature_definitions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY icc_settings_own ON app_implementation_center_v1.user_settings
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY icc_profiles_read ON app_implementation_center_v1.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY icc_profiles_insert ON app_implementation_center_v1.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY icc_profiles_update ON app_implementation_center_v1.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY icc_favorites_own ON app_implementation_center_v1.implementation_favorites
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY icc_comments_team ON app_implementation_center_v1.task_comments
  FOR ALL TO authenticated USING (true) WITH CHECK (user_id = auth.uid());
CREATE POLICY icc_templates_read ON app_implementation_center_v1.launch_task_templates
  FOR SELECT TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON app_implementation_center_v1.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_implementation_center_v1.implementation_favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_implementation_center_v1.task_comments TO authenticated;
GRANT SELECT ON app_implementation_center_v1.launch_task_templates TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE
  app_implementation_center_v1.task_comments,
  app_implementation_center_v1.implementation_favorites,
  app_implementation_center_v1.profiles;
