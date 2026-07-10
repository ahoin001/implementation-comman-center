-- Follow-up compound substeps (email sent + documents received)
ALTER TABLE app_implementation_center_v1.implementation_tasks
  ADD COLUMN IF NOT EXISTS substeps jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE app_implementation_center_v1.implementation_tasks
SET substeps = jsonb_build_object(
  'email_sent', true,
  'documents_received', true
)
WHERE task_key = 'follow_up_email'
  AND status IN ('done', 'not_needed')
  AND (substeps = '{}'::jsonb OR substeps IS NULL);
