-- Migration to allow admins to update member church_id when approving transfers
-- This allows destination church admins to update the member's church during transfer approval

-- Add RLS policy for admins to update members when approving transfer requests
CREATE POLICY "Admins can update members in approved transfers"
  ON members FOR UPDATE
  USING (
    get_user_role() = 'admin' AND
    EXISTS (
      SELECT 1 FROM transfer_requests tr
      WHERE tr.member_id = members.id
      AND tr.to_church_id = get_user_church_id()
      AND tr.status = 'pending'
    )
  )
  WITH CHECK (
    get_user_role() = 'admin' AND
    church_id = get_user_church_id()
  );
