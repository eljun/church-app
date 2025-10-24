-- Update RLS policies for transfer_history to allow church secretaries, pastors, and bibleworkers
-- to insert records when approving/rejecting transfers

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Admins and superadmin can insert transfer history" ON transfer_history;

-- Create new policy that allows all staff roles to insert transfer history
CREATE POLICY "Staff can insert transfer history"
  ON transfer_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('superadmin', 'field_secretary', 'pastor', 'church_secretary', 'bibleworker')
    )
  );

-- Update SELECT policy to allow church staff to view transfers involving their churches
DROP POLICY IF EXISTS "Admins can read their members transfer history" ON transfer_history;

CREATE POLICY "Staff can read transfer history for their scope"
  ON transfer_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND (
          users.role IN ('superadmin', 'field_secretary')
          OR (
            users.role IN ('pastor', 'church_secretary', 'bibleworker')
            AND (
              from_church_id = users.church_id
              OR to_church_id = users.church_id
            )
          )
        )
    )
  );
