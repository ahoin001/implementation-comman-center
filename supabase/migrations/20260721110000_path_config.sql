-- Path options: SSO toggle, image assets, data import inventory
ALTER TABLE app_implementation_center_v1.implementations
  ADD COLUMN IF NOT EXISTS path_config jsonb NOT NULL DEFAULT '{"ssoEnabled":true,"imageAssets":"pending","dataAssets":{}}'::jsonb;

UPDATE app_implementation_center_v1.implementations
SET path_config = COALESCE(
  path_config,
  '{"ssoEnabled":true,"imageAssets":"pending","dataAssets":{}}'::jsonb
)
WHERE path_config IS NULL;

COMMENT ON COLUMN app_implementation_center_v1.implementations.path_config IS
  'Launch Path options: ssoEnabled, imageAssets, dataAssets inventory';
