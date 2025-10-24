-- Fix RLS policies for transfer_requests and members tables
-- Update old 'admin' role references to new role system (church_secretary, pastor, bibleworker)
-- Add DELETE policy to allow cleaning up processed transfers

-----------------------------------
-- TRANSFER REQUESTS TABLE POLICIES
-----------------------------------

-- Drop old policies that use 'admin' role
DROP POLICY IF EXISTS "Admins can read relevant transfer requests" ON transfer_requests;
DROP POLICY IF EXISTS "Admins can create transfer requests" ON transfer_requests;
DROP POLICY IF EXISTS "Admins can approve incoming requests" ON transfer_requests;

-- Create new SELECT policies
CREATE POLICY "Staff can read transfer requests in their scope"
  ON transfer_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND (
          users.role IN ('superadmin', 'field_secretary')
          OR (
            users.role IN ('pastor', 'church_secretary', 'bibleworker')
            AND (from_church_id = users.church_id OR to_church_id = users.church_id)
          )
        )
    )
  );

-- Create new INSERT policy
CREATE POLICY "Staff can create transfer requests from their church"
  ON transfer_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('superadmin', 'field_secretary', 'pastor', 'church_secretary', 'bibleworker')
        AND (
          users.role IN ('superadmin', 'field_secretary')
          OR from_church_id = users.church_id
        )
    )
  );

-- Create new UPDATE policy
CREATE POLICY "Staff can update transfer requests to their church"
  ON transfer_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('superadmin', 'field_secretary', 'pastor', 'church_secretary', 'bibleworker')
        AND status = 'pending'
        AND (
          users.role IN ('superadmin', 'field_secretary')
          OR to_church_id = users.church_id
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('superadmin', 'field_secretary', 'pastor', 'church_secretary', 'bibleworker')
        AND (
          users.role IN ('superadmin', 'field_secretary')
          OR to_church_id = users.church_id
        )
    )
  );

-- **NEW**: Add DELETE policy to allow staff to delete processed transfer requests
CREATE POLICY "Staff can delete processed transfer requests"
  ON transfer_requests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('superadmin', 'field_secretary', 'pastor', 'church_secretary', 'bibleworker')
    )
  );

-----------------------------------
-- MEMBERS TABLE POLICIES (Update migration 005)
-----------------------------------

-- Drop old policy from migration 005
DROP POLICY IF EXISTS "Admins can update members in approved transfers" ON members;

-- Create updated policy with new role names
CREATE POLICY "Staff can update members in approved transfers"
  ON members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('superadmin', 'field_secretary', 'pastor', 'church_secretary', 'bibleworker')
        AND EXISTS (
          SELECT 1 FROM transfer_requests tr
          WHERE tr.member_id = members.id
            AND tr.to_church_id = users.church_id
            AND tr.status = 'pending'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('superadmin', 'field_secretary', 'pastor', 'church_secretary', 'bibleworker')
        AND church_id = users.church_id
    )
  );
