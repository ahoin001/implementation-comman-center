-- Project-level required deliverables (ACH, W-9, SSO credentials, Custom Categories)
ALTER TABLE app_implementation_center_v1.implementations
  ADD COLUMN IF NOT EXISTS deliverables jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE app_implementation_center_v1.implementations
SET deliverables = COALESCE(deliverables, '{}'::jsonb)
WHERE deliverables IS NULL;

COMMENT ON COLUMN app_implementation_center_v1.implementations.deliverables IS
  'Required deliverables: ach, w9, sso_test_credentials, custom_categories';
