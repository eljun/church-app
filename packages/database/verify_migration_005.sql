-- Verify that migration 005 was applied successfully

-- Check if the policy exists
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'members'
AND policyname = 'Admins can update members in approved transfers';

-- If the policy exists, you should see 1 row returned
-- If not, the migration wasn't applied

-- Also check all UPDATE policies on members to see what's active
SELECT
  policyname,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'members'
AND cmd = 'UPDATE'
ORDER BY policyname;
