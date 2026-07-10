-- Add final Launch step to Launch Desk
ALTER TABLE app_implementation_center_v1.implementation_tasks
  DROP CONSTRAINT IF EXISTS implementation_tasks_task_key_check;

ALTER TABLE app_implementation_center_v1.implementation_tasks
  ADD CONSTRAINT implementation_tasks_task_key_check
  CHECK (task_key IN (
    'site_design','kickoff_call','follow_up_email','data_import',
    'sso','smartway_training','job_backfill','launch'
  ));

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
    'sso','smartway_training','job_backfill','launch'
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

INSERT INTO app_implementation_center_v1.implementation_tasks
  (user_id, implementation_id, task_key, status)
SELECT i.user_id, i.id, 'launch', 'pending'
FROM app_implementation_center_v1.implementations i
ON CONFLICT (implementation_id, task_key) DO NOTHING;
