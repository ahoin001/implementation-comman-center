-- Implementation Command Center — hub-spoke schema
-- Pattern matches Loveable hub: public.projects + memberships + app_* schema
-- DO NOT confuse public.projects (app registry) with implementations (association work)

-- =============================================================================
-- 1) App schema
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS app_implementation_center_v1;

-- =============================================================================
-- 2) Register app in hub (public.projects = mini-app registry)
-- =============================================================================
INSERT INTO public.projects (name, schema_name, slug)
VALUES (
  'Implementation Command Center',
  'app_implementation_center_v1',
  'implementation-center'
)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- 3) Core tables (owner-scoped via user_id)
-- =============================================================================

-- Association implementations (what the UI calls "Projects")
CREATE TABLE IF NOT EXISTS app_implementation_center_v1.implementations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  abbreviation  text NOT NULL DEFAULT '',
  logo_url      text,
  launch_date   date,
  waiting_on    text NOT NULL DEFAULT 'none'
                  CHECK (waiting_on IN (
                    'client_assets','client_data','membership','internal_dev',
                    'qa','scheduling','ready','none'
                  )),
  -- Contact + links as jsonb (matches current app shape; easy to edit)
  contact       jsonb NOT NULL DEFAULT '{}'::jsonb,
  links         jsonb NOT NULL DEFAULT '{}'::jsonb,
  archived      boolean NOT NULL DEFAULT false,
  archived_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_icc_implementations_user
  ON app_implementation_center_v1.implementations (user_id);
CREATE INDEX IF NOT EXISTS idx_icc_implementations_user_archived
  ON app_implementation_center_v1.implementations (user_id, archived);
CREATE INDEX IF NOT EXISTS idx_icc_implementations_launch
  ON app_implementation_center_v1.implementations (user_id, launch_date);

-- Launch Desk tasks (normalized — better for realtime + filters than one jsonb blob)
CREATE TABLE IF NOT EXISTS app_implementation_center_v1.implementation_tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  implementation_id uuid NOT NULL
                    REFERENCES app_implementation_center_v1.implementations(id) ON DELETE CASCADE,
  task_key        text NOT NULL
                    CHECK (task_key IN (
                      'site_design','kickoff_call','follow_up_email','data_import',
                      'sso','smartway_training','job_backfill'
                    )),
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','done','not_needed','blocked')),
  blocked_reason  text,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (implementation_id, task_key)
);

CREATE INDEX IF NOT EXISTS idx_icc_tasks_user
  ON app_implementation_center_v1.implementation_tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_icc_tasks_impl
  ON app_implementation_center_v1.implementation_tasks (implementation_id);
CREATE INDEX IF NOT EXISTS idx_icc_tasks_status
  ON app_implementation_center_v1.implementation_tasks (user_id, status);

-- Notes
CREATE TABLE IF NOT EXISTS app_implementation_center_v1.notes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  implementation_id uuid NOT NULL
                      REFERENCES app_implementation_center_v1.implementations(id) ON DELETE CASCADE,
  content           text NOT NULL,
  pinned            boolean NOT NULL DEFAULT false,
  is_meeting_summary boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_icc_notes_impl
  ON app_implementation_center_v1.notes (implementation_id, created_at DESC);

-- Calendar events
CREATE TABLE IF NOT EXISTS app_implementation_center_v1.calendar_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  implementation_id uuid NOT NULL
                      REFERENCES app_implementation_center_v1.implementations(id) ON DELETE CASCADE,
  title             text NOT NULL,
  event_type        text NOT NULL
                      CHECK (event_type IN ('kickoff','adhoc','training')),
  event_date        date NOT NULL,
  event_time        time,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_icc_events_user_date
  ON app_implementation_center_v1.calendar_events (user_id, event_date);

-- Activity feed
CREATE TABLE IF NOT EXISTS app_implementation_center_v1.activities (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  implementation_id uuid
                      REFERENCES app_implementation_center_v1.implementations(id) ON DELETE SET NULL,
  activity_type     text NOT NULL DEFAULT 'other',
  title             text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_icc_activities_user
  ON app_implementation_center_v1.activities (user_id, created_at DESC);

-- Per-user app settings (theme, accent, reminder window — NOT API secrets)
CREATE TABLE IF NOT EXISTS app_implementation_center_v1.user_settings (
  user_id                 uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name               text NOT NULL DEFAULT 'Alex',
  theme                   text NOT NULL DEFAULT 'system'
                            CHECK (theme IN ('light','dark','system')),
  accent_color            text NOT NULL DEFAULT '#0071e3',
  reminder_window_days    integer NOT NULL DEFAULT 14,
  notifications_enabled   boolean NOT NULL DEFAULT true,
  -- Non-secret integration URLs only. API keys stay in Vault / env / local.
  salesforce_instance_url text NOT NULL DEFAULT '',
  jira_instance_url       text NOT NULL DEFAULT '',
  slack_workspace_url     text NOT NULL DEFAULT '',
  google_drive_folder_url text NOT NULL DEFAULT '',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 4) updated_at trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION app_implementation_center_v1.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = app_implementation_center_v1, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_icc_implementations_updated ON app_implementation_center_v1.implementations;
CREATE TRIGGER trg_icc_implementations_updated
  BEFORE UPDATE ON app_implementation_center_v1.implementations
  FOR EACH ROW EXECUTE FUNCTION app_implementation_center_v1.set_updated_at();

DROP TRIGGER IF EXISTS trg_icc_tasks_updated ON app_implementation_center_v1.implementation_tasks;
CREATE TRIGGER trg_icc_tasks_updated
  BEFORE UPDATE ON app_implementation_center_v1.implementation_tasks
  FOR EACH ROW EXECUTE FUNCTION app_implementation_center_v1.set_updated_at();

DROP TRIGGER IF EXISTS trg_icc_events_updated ON app_implementation_center_v1.calendar_events;
CREATE TRIGGER trg_icc_events_updated
  BEFORE UPDATE ON app_implementation_center_v1.calendar_events
  FOR EACH ROW EXECUTE FUNCTION app_implementation_center_v1.set_updated_at();

DROP TRIGGER IF EXISTS trg_icc_settings_updated ON app_implementation_center_v1.user_settings;
CREATE TRIGGER trg_icc_settings_updated
  BEFORE UPDATE ON app_implementation_center_v1.user_settings
  FOR EACH ROW EXECUTE FUNCTION app_implementation_center_v1.set_updated_at();

-- =============================================================================
-- 5) Seed default Launch Desk tasks when an implementation is created
-- =============================================================================
CREATE OR REPLACE FUNCTION app_implementation_center_v1.seed_default_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_implementation_center_v1, public
AS $$
DECLARE
  k text;
BEGIN
  FOREACH k IN ARRAY ARRAY[
    'site_design','kickoff_call','follow_up_email','data_import',
    'sso','smartway_training','job_backfill'
  ]
  LOOP
    INSERT INTO app_implementation_center_v1.implementation_tasks
      (user_id, implementation_id, task_key, status)
    VALUES (NEW.user_id, NEW.id, k, 'pending')
    ON CONFLICT (implementation_id, task_key) DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_icc_seed_tasks ON app_implementation_center_v1.implementations;
CREATE TRIGGER trg_icc_seed_tasks
  AFTER INSERT ON app_implementation_center_v1.implementations
  FOR EACH ROW EXECUTE FUNCTION app_implementation_center_v1.seed_default_tasks();

-- =============================================================================
-- 6) RLS — owner-only (matches churn / hub pattern: user_id = auth.uid())
-- =============================================================================
ALTER TABLE app_implementation_center_v1.implementations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_implementation_center_v1.implementation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_implementation_center_v1.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_implementation_center_v1.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_implementation_center_v1.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_implementation_center_v1.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY icc_implementations_own ON app_implementation_center_v1.implementations
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY icc_tasks_own ON app_implementation_center_v1.implementation_tasks
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY icc_notes_own ON app_implementation_center_v1.notes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY icc_events_own ON app_implementation_center_v1.calendar_events
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY icc_activities_own ON app_implementation_center_v1.activities
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY icc_settings_own ON app_implementation_center_v1.user_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 7) Realtime — subscribe from the client for live multi-tab sync
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE
  app_implementation_center_v1.implementations,
  app_implementation_center_v1.implementation_tasks,
  app_implementation_center_v1.notes,
  app_implementation_center_v1.calendar_events,
  app_implementation_center_v1.activities,
  app_implementation_center_v1.user_settings;

-- =============================================================================
-- 8) Grants (schema usage for authenticated role)
-- =============================================================================
GRANT USAGE ON SCHEMA app_implementation_center_v1 TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA app_implementation_center_v1 TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA app_implementation_center_v1 TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_implementation_center_v1
  GRANT ALL ON TABLES TO authenticated;

-- =============================================================================
-- Hub membership (roles allowed: admin | member | viewer):
--   INSERT INTO public.memberships (user_id, project_id, role)
--   SELECT u.id, p.id, 'admin'
--   FROM auth.users u
--   CROSS JOIN public.projects p
--   WHERE p.slug = 'implementation-center'
--   ON CONFLICT (user_id, project_id) DO NOTHING;
-- =============================================================================
