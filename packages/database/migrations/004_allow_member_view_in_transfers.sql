-- Migration to allow admins to view member information in transfer requests
-- This allows destination church admins to see member details when reviewing transfers

-- Add RLS policy for admins to read members involved in transfer requests to/from their church
CREATE POLICY "Admins can read members in transfer requests"
  ON members FOR SELECT
  USING (
    get_user_role() = 'admin' AND
    EXISTS (
      SELECT 1 FROM transfer_requests tr
      WHERE tr.member_id = members.id
      AND (tr.from_church_id = get_user_church_id() OR tr.to_church_id = get_user_church_id())
    )
  );
