-- Kickoff call answers and skipped prompts, per implementation.

ALTER TABLE app_implementation_center_v1.implementations
  ADD COLUMN IF NOT EXISTS kickoff jsonb NOT NULL DEFAULT '{"hiddenChapters":[],"hiddenSteps":[],"hiddenPrompts":[],"answers":{}}'::jsonb;

COMMENT ON COLUMN app_implementation_center_v1.implementations.kickoff IS
  'Kickoff script answers and the chapters, steps, and prompts this project is not asking.';
