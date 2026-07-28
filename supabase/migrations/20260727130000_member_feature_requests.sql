-- Global catalog of member feature request definitions (shared across projects)
CREATE TABLE IF NOT EXISTS app_implementation_center_v1.member_feature_definitions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label      text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_icc_member_feature_defs_user
  ON app_implementation_center_v1.member_feature_definitions (user_id, sort_order, created_at);

-- Per-project on/off map: { [definition_id]: boolean }
ALTER TABLE app_implementation_center_v1.implementations
  ADD COLUMN IF NOT EXISTS member_features jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN app_implementation_center_v1.implementations.member_features IS
  'Per-project enabled member feature requests keyed by definition id';

ALTER TABLE app_implementation_center_v1.member_feature_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS icc_member_feature_defs_solo ON app_implementation_center_v1.member_feature_definitions;
CREATE POLICY icc_member_feature_defs_solo ON app_implementation_center_v1.member_feature_definitions
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON TABLE app_implementation_center_v1.member_feature_definitions TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE app_implementation_center_v1.member_feature_definitions;

-- Seed default catalog for solo user (idempotent by label)
INSERT INTO app_implementation_center_v1.member_feature_definitions (user_id, label, sort_order)
SELECT u.id, v.label, v.sort_order
FROM auth.users u
CROSS JOIN (
  VALUES
    ('Member job pricing', 0),
    ('Members see jobs first', 1),
    ('Only members can access job board', 2),
    ('Only members can apply to jobs', 3),
    ('Member-only job visibility', 4)
) AS v(label, sort_order)
WHERE u.id = 'd2435367-b124-48f3-bca0-f0dc47340896'
  AND NOT EXISTS (
    SELECT 1
    FROM app_implementation_center_v1.member_feature_definitions d
    WHERE d.user_id = u.id AND d.label = v.label
  );
