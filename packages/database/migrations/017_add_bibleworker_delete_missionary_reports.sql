/**
 * Migration 017: Add DELETE policy for Bibleworker Missionary Reports
 *
 * Allows bibleworkers to delete their own missionary reports
 */

-- =====================================================
-- Missionary Reports: Bibleworkers can delete their own reports
-- =====================================================
DROP POLICY IF EXISTS "Bibleworker can delete own missionary reports" ON missionary_reports;
CREATE POLICY "Bibleworker can delete own missionary reports"
  ON missionary_reports FOR DELETE
  USING (
    get_user_role() = 'bibleworker' AND
    reported_by = auth.uid()
  );
