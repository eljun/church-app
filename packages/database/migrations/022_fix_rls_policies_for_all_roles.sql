-- Migration 022: Fix RLS Policies for All Roles After RBAC Overhaul
--
-- This migration fixes broken RLS policies after the RBAC overhaul and adds missing ones
--
-- Issues being fixed:
-- 1. Old policies reference 'admin' role which was renamed to 'church_secretary' in migration 020
-- 2. No policies exist for 'pastor' role (uses assigned_church_ids)
-- 3. No policies exist for 'bibleworker' role (uses assigned_church_ids)
-- 4. No policies exist for 'field_secretary' role
--
-- Solution: Drop old broken policies and create new ones for all 6 roles

-----------------------------------
-- MEMBERS TABLE POLICIES
-----------------------------------

-- Drop old broken policies
-- 1. Policies that reference 'admin' (renamed to church_secretary)
DROP POLICY IF EXISTS "Admins can read their church members" ON members;
DROP POLICY IF EXISTS "Admins can insert members to their church" ON members;
DROP POLICY IF EXISTS "Admins can update their church members" ON members;

-- 2. Old pastor policies that use district/field instead of assigned_church_ids
DROP POLICY IF EXISTS "Pastor can read members in district" ON members;
DROP POLICY IF EXISTS "Pastor can update members in district" ON members;

-- 3. Old bibleworker policies (from migration 013 and 016)
DROP POLICY IF EXISTS "Bibleworker can read assigned members" ON members;
DROP POLICY IF EXISTS "Bibleworker can update assigned members" ON members;
DROP POLICY IF EXISTS "Bibleworker can read assigned church members" ON members;

-- Church Secretary: Single church access
CREATE POLICY "Church Secretary can read their church members"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'church_secretary'
        AND members.church_id = users.church_id
    )
  );

CREATE POLICY "Church Secretary can insert members to their church"
  ON members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'church_secretary'
        AND members.church_id = users.church_id
    )
  );

CREATE POLICY "Church Secretary can update their church members"
  ON members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'church_secretary'
        AND members.church_id = users.church_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'church_secretary'
        AND members.church_id = users.church_id
    )
  );

-- Field Secretary: Field-wide access
CREATE POLICY "Field Secretary can read members from their field"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN churches c ON members.church_id = c.id
      WHERE u.id = auth.uid()
        AND u.role = 'field_secretary'
        AND c.field = u.field_id
    )
  );

CREATE POLICY "Field Secretary can insert members to field churches"
  ON members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN churches c ON members.church_id = c.id
      WHERE u.id = auth.uid()
        AND u.role = 'field_secretary'
        AND c.field = u.field_id
    )
  );

CREATE POLICY "Field Secretary can update members from their field"
  ON members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN churches c ON members.church_id = c.id
      WHERE u.id = auth.uid()
        AND u.role = 'field_secretary'
        AND c.field = u.field_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN churches c ON members.church_id = c.id
      WHERE u.id = auth.uid()
        AND u.role = 'field_secretary'
        AND c.field = u.field_id
    )
  );

-- Pastor: Assigned churches access
CREATE POLICY "Pastor can read members from assigned churches"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'pastor'
        AND members.church_id = ANY(users.assigned_church_ids)
    )
  );

CREATE POLICY "Pastor can insert members to assigned churches"
  ON members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'pastor'
        AND members.church_id = ANY(users.assigned_church_ids)
    )
  );

CREATE POLICY "Pastor can update members from assigned churches"
  ON members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'pastor'
        AND members.church_id = ANY(users.assigned_church_ids)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'pastor'
        AND members.church_id = ANY(users.assigned_church_ids)
    )
  );

-- Bibleworker: Assigned churches access (read-only for most operations)
CREATE POLICY "Bibleworker can read members from assigned churches"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'bibleworker'
        AND members.church_id = ANY(users.assigned_church_ids)
    )
  );

-----------------------------------
-- CHURCHES TABLE POLICIES
-----------------------------------

-- Drop old broken policies
DROP POLICY IF EXISTS "Admins can read users from their church" ON users;

-- Drop existing bibleworker church policy (from migration 016)
DROP POLICY IF EXISTS "Bibleworker can read assigned churches" ON churches;

-- Field Secretary can read churches in their field
CREATE POLICY "Field Secretary can read churches in their field"
  ON churches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'field_secretary'
        AND churches.field = users.field_id
    )
  );

-- Pastor can read their assigned churches
CREATE POLICY "Pastor can read assigned churches"
  ON churches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'pastor'
        AND churches.id = ANY(users.assigned_church_ids)
    )
  );

-- Church Secretary can read their church
CREATE POLICY "Church Secretary can read their church"
  ON churches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'church_secretary'
        AND churches.id = users.church_id
    )
  );

-- Bibleworker can read their assigned churches
CREATE POLICY "Bibleworker can read assigned churches"
  ON churches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'bibleworker'
        AND churches.id = ANY(users.assigned_church_ids)
    )
  );

-----------------------------------
-- ATTENDANCE TABLE POLICIES
-----------------------------------

-- Drop old broken policies
DROP POLICY IF EXISTS "Admins can read their church attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can insert attendance" ON attendance;

-- Drop existing bibleworker attendance policy (will be recreated)
DROP POLICY IF EXISTS "Bibleworker can read attendance from assigned churches" ON attendance;

-- Church Secretary
CREATE POLICY "Church Secretary can read their church attendance"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'church_secretary'
        AND attendance.church_id = users.church_id
    )
  );

CREATE POLICY "Church Secretary can insert attendance for their church"
  ON attendance FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'church_secretary'
        AND attendance.church_id = users.church_id
    )
  );

-- Field Secretary
CREATE POLICY "Field Secretary can read attendance from their field"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN churches c ON attendance.church_id = c.id
      WHERE u.id = auth.uid()
        AND u.role = 'field_secretary'
        AND c.field = u.field_id
    )
  );

CREATE POLICY "Field Secretary can insert attendance for field churches"
  ON attendance FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN churches c ON attendance.church_id = c.id
      WHERE u.id = auth.uid()
        AND u.role = 'field_secretary'
        AND c.field = u.field_id
    )
  );

-- Pastor
CREATE POLICY "Pastor can read attendance from assigned churches"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'pastor'
        AND attendance.church_id = ANY(users.assigned_church_ids)
    )
  );

CREATE POLICY "Pastor can insert attendance for assigned churches"
  ON attendance FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'pastor'
        AND attendance.church_id = ANY(users.assigned_church_ids)
    )
  );

-- Bibleworker
CREATE POLICY "Bibleworker can read attendance from assigned churches"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'bibleworker'
        AND attendance.church_id = ANY(users.assigned_church_ids)
    )
  );

-----------------------------------
-- TRANSFER REQUESTS TABLE POLICIES
-----------------------------------

-- Drop old broken policies
DROP POLICY IF EXISTS "Admins can read relevant transfer requests" ON transfer_requests;
DROP POLICY IF EXISTS "Admins can create transfer requests" ON transfer_requests;
DROP POLICY IF EXISTS "Admins can approve incoming requests" ON transfer_requests;

-- Church Secretary
CREATE POLICY "Church Secretary can read relevant transfer requests"
  ON transfer_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'church_secretary'
        AND (
          transfer_requests.from_church_id = users.church_id
          OR transfer_requests.to_church_id = users.church_id
        )
    )
  );

CREATE POLICY "Church Secretary can create transfer requests"
  ON transfer_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'church_secretary'
        AND transfer_requests.from_church_id = users.church_id
    )
  );

CREATE POLICY "Church Secretary can approve incoming requests"
  ON transfer_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'church_secretary'
        AND transfer_requests.to_church_id = users.church_id
        AND transfer_requests.status = 'pending'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'church_secretary'
        AND transfer_requests.to_church_id = users.church_id
    )
  );

-- Field Secretary
CREATE POLICY "Field Secretary can read transfer requests in their field"
  ON transfer_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN churches c1 ON transfer_requests.from_church_id = c1.id
      JOIN churches c2 ON transfer_requests.to_church_id = c2.id
      WHERE u.id = auth.uid()
        AND u.role = 'field_secretary'
        AND (c1.field = u.field_id OR c2.field = u.field_id)
    )
  );

-- Pastor
CREATE POLICY "Pastor can read transfer requests for assigned churches"
  ON transfer_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'pastor'
        AND (
          transfer_requests.from_church_id = ANY(users.assigned_church_ids)
          OR transfer_requests.to_church_id = ANY(users.assigned_church_ids)
        )
    )
  );

CREATE POLICY "Pastor can create transfer requests from assigned churches"
  ON transfer_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'pastor'
        AND transfer_requests.from_church_id = ANY(users.assigned_church_ids)
    )
  );

CREATE POLICY "Pastor can approve incoming transfer requests"
  ON transfer_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'pastor'
        AND transfer_requests.to_church_id = ANY(users.assigned_church_ids)
        AND transfer_requests.status = 'pending'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'pastor'
        AND transfer_requests.to_church_id = ANY(users.assigned_church_ids)
    )
  );

-----------------------------------
-- COMMENTS
-----------------------------------

COMMENT ON POLICY "Church Secretary can read their church members" ON members IS 'Allows church secretaries to view members from their assigned church';
COMMENT ON POLICY "Pastor can read members from assigned churches" ON members IS 'Allows pastors to view members from churches in their assigned_church_ids array';
COMMENT ON POLICY "Bibleworker can read members from assigned churches" ON members IS 'Allows bibleworkers to view members from churches in their assigned_church_ids array';
COMMENT ON POLICY "Field Secretary can read members from their field" ON members IS 'Allows field secretaries to view members from all churches in their field';

-----------------------------------
-- VERIFICATION QUERIES
-----------------------------------
-- Run these manually to verify the policies are working:
--
-- Check all member policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename = 'members'
-- ORDER BY policyname;
--
-- Test as different roles (run as the specific user):
-- SELECT COUNT(*) FROM members; -- Should return members based on role
