-- A note from the team asking the client to send a handoff again.
-- Absent row means nothing was sent back. The launch task stays In progress until a person marks it complete.

CREATE TABLE IF NOT EXISTS app_implementation_center_v1.client_intake_reviews (
  implementation_id uuid NOT NULL REFERENCES app_implementation_center_v1.implementations(id) ON DELETE CASCADE,
  task_key text NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (implementation_id, task_key)
);

ALTER TABLE app_implementation_center_v1.client_intake_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS icc_client_intake_reviews_team ON app_implementation_center_v1.client_intake_reviews;
CREATE POLICY icc_client_intake_reviews_team ON app_implementation_center_v1.client_intake_reviews
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON app_implementation_center_v1.client_intake_reviews TO authenticated;
GRANT ALL ON app_implementation_center_v1.client_intake_reviews TO service_role;

ALTER TABLE app_implementation_center_v1.client_intake_reviews REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE app_implementation_center_v1.client_intake_reviews;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
