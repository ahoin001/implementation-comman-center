-- Shareable client intake: one active link per project, one row per submitted slot.
-- Files live in a private bucket. The client-intake edge function is the only writer.

CREATE TABLE IF NOT EXISTS app_implementation_center_v1.client_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  implementation_id uuid NOT NULL REFERENCES app_implementation_center_v1.implementations(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS client_links_one_active
  ON app_implementation_center_v1.client_links (implementation_id)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS app_implementation_center_v1.client_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  implementation_id uuid NOT NULL REFERENCES app_implementation_center_v1.implementations(id) ON DELETE CASCADE,
  task_key text NOT NULL,
  slot_key text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('file', 'text', 'credentials')),
  storage_path text,
  file_name text,
  content_type text,
  byte_size bigint,
  width integer,
  height integer,
  body jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (implementation_id, task_key, slot_key)
);

CREATE INDEX IF NOT EXISTS idx_icc_client_submissions_project
  ON app_implementation_center_v1.client_submissions (implementation_id, task_key);

ALTER TABLE app_implementation_center_v1.client_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_implementation_center_v1.client_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS icc_client_links_team ON app_implementation_center_v1.client_links;
CREATE POLICY icc_client_links_team ON app_implementation_center_v1.client_links
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS icc_client_submissions_team_read ON app_implementation_center_v1.client_submissions;
CREATE POLICY icc_client_submissions_team_read ON app_implementation_center_v1.client_submissions
  FOR SELECT TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON app_implementation_center_v1.client_links TO authenticated;
GRANT SELECT ON app_implementation_center_v1.client_submissions TO authenticated;

GRANT USAGE ON SCHEMA app_implementation_center_v1 TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA app_implementation_center_v1 TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA app_implementation_center_v1 TO service_role;

ALTER TABLE app_implementation_center_v1.client_submissions REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE app_implementation_center_v1.client_submissions;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('client-deliverables', 'client-deliverables', false, 8388608)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 8388608;

DROP POLICY IF EXISTS client_deliverables_staff_read ON storage.objects;
CREATE POLICY client_deliverables_staff_read
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'client-deliverables');
