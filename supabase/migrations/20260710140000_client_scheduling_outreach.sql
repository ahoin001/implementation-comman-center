-- Add client_scheduling waiting reason + outreach tracking
ALTER TABLE app_implementation_center_v1.implementations
  DROP CONSTRAINT IF EXISTS implementations_waiting_on_check;

ALTER TABLE app_implementation_center_v1.implementations
  ADD CONSTRAINT implementations_waiting_on_check
  CHECK (waiting_on IN (
    'client_assets','client_data','membership','client_scheduling',
    'internal_dev','qa','scheduling','ready','none'
  ));

ALTER TABLE app_implementation_center_v1.implementations
  ADD COLUMN IF NOT EXISTS outreach_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_outreach_at timestamptz;
