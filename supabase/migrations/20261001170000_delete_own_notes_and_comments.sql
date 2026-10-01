-- Authors can delete their own notes and task comments.
-- Team read/insert/update stays open. Existing FOR ALL policies also
-- allowed delete, so they are split before the owner-only delete rules.

DROP POLICY IF EXISTS icc_notes_team ON app_implementation_center_v1.notes;
DROP POLICY IF EXISTS icc_notes_team_read ON app_implementation_center_v1.notes;
DROP POLICY IF EXISTS icc_notes_team_insert ON app_implementation_center_v1.notes;
DROP POLICY IF EXISTS icc_notes_team_update ON app_implementation_center_v1.notes;
DROP POLICY IF EXISTS icc_notes_delete_own ON app_implementation_center_v1.notes;

CREATE POLICY icc_notes_team_read ON app_implementation_center_v1.notes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY icc_notes_team_insert ON app_implementation_center_v1.notes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY icc_notes_team_update ON app_implementation_center_v1.notes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY icc_notes_delete_own ON app_implementation_center_v1.notes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS icc_comments_team ON app_implementation_center_v1.task_comments;
DROP POLICY IF EXISTS icc_comments_read ON app_implementation_center_v1.task_comments;
DROP POLICY IF EXISTS icc_comments_insert ON app_implementation_center_v1.task_comments;
DROP POLICY IF EXISTS icc_comments_delete_own ON app_implementation_center_v1.task_comments;

CREATE POLICY icc_comments_read ON app_implementation_center_v1.task_comments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY icc_comments_insert ON app_implementation_center_v1.task_comments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY icc_comments_delete_own ON app_implementation_center_v1.task_comments
  FOR DELETE TO authenticated USING (user_id = auth.uid());
