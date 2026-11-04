-- Authors can edit their own task comments.

DROP POLICY IF EXISTS icc_comments_update_own ON app_implementation_center_v1.task_comments;

CREATE POLICY icc_comments_update_own ON app_implementation_center_v1.task_comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
