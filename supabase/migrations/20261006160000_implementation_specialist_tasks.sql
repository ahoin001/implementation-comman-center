UPDATE app_implementation_center_v1.launch_task_templates
SET
  title = 'Get branding guidelines and logos',
  description = 'Ask the client for logo files (jpg, png, eps) and brand guidelines.'
WHERE task_key = 'branding';

UPDATE app_implementation_center_v1.launch_task_templates
SET
  title = 'Get custom header images',
  description = 'Ask the client for homepage 1920x424, career advice 1920x334, and pricing 1920x257 pngs.'
WHERE task_key = 'header_images';

UPDATE app_implementation_center_v1.launch_task_templates
SET
  description = 'Web Scribble creates the Smartway admin accounts. Ask the client for the email addresses that need access.',
  party = 'webscribble'
WHERE task_key = 'smartway_admins';

INSERT INTO app_implementation_center_v1.launch_task_templates
  (task_key, phase_key, group_key, title, description, party, default_status, sort_order)
VALUES
  (
    'update_pricing',
    'prelaunch',
    'pricing',
    'Update pricing on the career center',
    'Implementation specialist updates pricing on the career center after offers are approved.',
    'webscribble',
    'not_started',
    145
  )
ON CONFLICT (task_key) DO UPDATE SET
  phase_key = EXCLUDED.phase_key,
  group_key = EXCLUDED.group_key,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  party = EXCLUDED.party,
  default_status = EXCLUDED.default_status,
  sort_order = EXCLUDED.sort_order;

UPDATE app_implementation_center_v1.implementation_tasks
SET
  title = 'Get branding guidelines and logos',
  description = CASE
    WHEN description IS NULL
      OR btrim(description) = ''
      OR description = 'Client provides logo files (jpg, png, eps) and brand guidelines.'
    THEN 'Ask the client for logo files (jpg, png, eps) and brand guidelines.'
    ELSE description
  END
WHERE task_key = 'branding';

UPDATE app_implementation_center_v1.implementation_tasks
SET
  title = 'Get custom header images',
  description = CASE
    WHEN description IS NULL
      OR btrim(description) = ''
      OR description = 'Homepage 1920x424, career advice 1920x334, pricing 1920x257, png.'
    THEN 'Ask the client for homepage 1920x424, career advice 1920x334, and pricing 1920x257 pngs.'
    ELSE description
  END
WHERE task_key = 'header_images';

UPDATE app_implementation_center_v1.implementation_tasks
SET
  party = 'webscribble',
  description = CASE
    WHEN description IS NULL
      OR btrim(description) = ''
      OR description = 'Client sends the email addresses that need Smartway access.'
    THEN 'Web Scribble creates the Smartway admin accounts. Ask the client for the email addresses that need access.'
    ELSE description
  END
WHERE task_key = 'smartway_admins';

INSERT INTO app_implementation_center_v1.implementation_tasks
  (user_id, implementation_id, task_key, status, phase_key, group_key, title, description, party, sort_order)
SELECT
  i.user_id,
  i.id,
  t.task_key,
  t.default_status,
  t.phase_key,
  t.group_key,
  t.title,
  t.description,
  t.party,
  t.sort_order
FROM app_implementation_center_v1.implementations i
CROSS JOIN app_implementation_center_v1.launch_task_templates t
WHERE t.task_key = 'update_pricing'
ON CONFLICT (implementation_id, task_key) DO NOTHING;
