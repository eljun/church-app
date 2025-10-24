-- Add RLS policy to allow viewing members involved in pending transfer requests
-- This allows destination church secretaries to view member details when reviewing transfers

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow viewing members in pending transfers to your church" ON members;

-- Create policy for church secretaries
CREATE POLICY "Allow viewing members in pending transfers to your church"
  ON members FOR SELECT
  USING (
    -- Allow if member is involved in a pending transfer TO the user's church
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN transfer_requests tr ON (
        tr.to_church_id = u.church_id
        AND tr.member_id = members.id
        AND tr.status = 'pending'
      )
      WHERE u.id = auth.uid()
        AND u.role IN ('church_secretary', 'pastor', 'bibleworker')
    )
  );

-- Create policy for pastors with assigned churches
DROP POLICY IF EXISTS "Allow viewing members in pending transfers to assigned churches" ON members;

CREATE POLICY "Allow viewing members in pending transfers to assigned churches"
  ON members FOR SELECT
  USING (
    -- Allow if member is involved in a pending transfer TO any of the user's assigned churches
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN transfer_requests tr ON (
        tr.to_church_id = ANY(u.assigned_church_ids)
        AND tr.member_id = members.id
        AND tr.status = 'pending'
      )
      WHERE u.id = auth.uid()
        AND u.role IN ('pastor', 'bibleworker')
        AND u.assigned_church_ids IS NOT NULL
        AND array_length(u.assigned_church_ids, 1) > 0
    )
  );
