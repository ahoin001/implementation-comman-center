-- Note severity for at-a-glance scanning (info | warning | urgent)
ALTER TABLE app_implementation_center_v1.notes
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'info';

ALTER TABLE app_implementation_center_v1.notes
  DROP CONSTRAINT IF EXISTS notes_severity_check;

ALTER TABLE app_implementation_center_v1.notes
  ADD CONSTRAINT notes_severity_check
  CHECK (severity IN ('info', 'warning', 'urgent'));

COMMENT ON COLUMN app_implementation_center_v1.notes.severity IS
  'Note glance state: info, warning, or urgent';
