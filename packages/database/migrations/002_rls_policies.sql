-- Row Level Security Policies for Church App

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to get current user's church_id
CREATE OR REPLACE FUNCTION get_user_church_id()
RETURNS UUID AS $$
  SELECT church_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is admin or superadmin
CREATE OR REPLACE FUNCTION is_admin_or_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-----------------------------------
-- USERS TABLE POLICIES
-----------------------------------

-- Superadmin can read all users
CREATE POLICY "Superadmin can read all users"
  ON users FOR SELECT
  USING (is_superadmin());

-- Admins can read users from their church
CREATE POLICY "Admins can read users from their church"
  ON users FOR SELECT
  USING (
    get_user_role() = 'admin' AND
    church_id = get_user_church_id()
  );

-- Users can read their own record
CREATE POLICY "Users can read their own record"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Only superadmin can insert users (during setup)
CREATE POLICY "Superadmin can insert users"
  ON users FOR INSERT
  WITH CHECK (is_superadmin());

-- Users can update their own record (limited fields)
CREATE POLICY "Users can update their own record"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = get_user_role()); -- Can't change their own role

-----------------------------------
-- CHURCHES TABLE POLICIES
-----------------------------------

-- Everyone (including members) can read active churches
CREATE POLICY "Everyone can read active churches"
  ON churches FOR SELECT
  USING (is_active = true);

-- Superadmin can read all churches
CREATE POLICY "Superadmin can read all churches"
  ON churches FOR SELECT
  USING (is_superadmin());

-- Superadmin can insert/update/delete churches
CREATE POLICY "Superadmin can manage churches"
  ON churches FOR ALL
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-----------------------------------
-- MEMBERS TABLE POLICIES
-----------------------------------

-- Superadmin can read all members
CREATE POLICY "Superadmin can read all members"
  ON members FOR SELECT
  USING (is_superadmin());

-- Admins can read members from their church
CREATE POLICY "Admins can read their church members"
  ON members FOR SELECT
  USING (
    get_user_role() = 'admin' AND
    church_id = get_user_church_id()
  );

-- Superadmin can insert members to any church
CREATE POLICY "Superadmin can insert members"
  ON members FOR INSERT
  WITH CHECK (is_superadmin());

-- Admins can insert members to their church only
CREATE POLICY "Admins can insert members to their church"
  ON members FOR INSERT
  WITH CHECK (
    get_user_role() = 'admin' AND
    church_id = get_user_church_id()
  );

-- Superadmin can update any member
CREATE POLICY "Superadmin can update any member"
  ON members FOR UPDATE
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Admins can update members from their church
CREATE POLICY "Admins can update their church members"
  ON members FOR UPDATE
  USING (
    get_user_role() = 'admin' AND
    church_id = get_user_church_id()
  )
  WITH CHECK (
    get_user_role() = 'admin' AND
    church_id = get_user_church_id()
  );

-- Only superadmin can delete members (soft delete preferred)
CREATE POLICY "Only superadmin can delete members"
  ON members FOR DELETE
  USING (is_superadmin());

-----------------------------------
-- TRANSFER REQUESTS TABLE POLICIES
-----------------------------------

-- Superadmin can read all transfer requests
CREATE POLICY "Superadmin can read all transfer requests"
  ON transfer_requests FOR SELECT
  USING (is_superadmin());

-- Admins can read transfer requests involving their church
CREATE POLICY "Admins can read relevant transfer requests"
  ON transfer_requests FOR SELECT
  USING (
    get_user_role() = 'admin' AND
    (from_church_id = get_user_church_id() OR to_church_id = get_user_church_id())
  );

-- Admins can create transfer requests from their church
CREATE POLICY "Admins can create transfer requests"
  ON transfer_requests FOR INSERT
  WITH CHECK (
    get_user_role() = 'admin' AND
    from_church_id = get_user_church_id()
  );

-- Admins can approve requests TO their church
CREATE POLICY "Admins can approve incoming requests"
  ON transfer_requests FOR UPDATE
  USING (
    get_user_role() = 'admin' AND
    to_church_id = get_user_church_id() AND
    status = 'pending'
  )
  WITH CHECK (
    get_user_role() = 'admin' AND
    to_church_id = get_user_church_id()
  );

-- Superadmin can update any transfer request
CREATE POLICY "Superadmin can update any transfer request"
  ON transfer_requests FOR UPDATE
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-----------------------------------
-- TRANSFER HISTORY TABLE POLICIES
-----------------------------------

-- Superadmin can read all transfer history
CREATE POLICY "Superadmin can read all transfer history"
  ON transfer_history FOR SELECT
  USING (is_superadmin());

-- Admins can read transfer history for their church members
CREATE POLICY "Admins can read their members transfer history"
  ON transfer_history FOR SELECT
  USING (
    get_user_role() = 'admin' AND
    (from_church_id = get_user_church_id() OR to_church_id = get_user_church_id())
  );

-- System can insert transfer history (via triggers)
CREATE POLICY "Admins and superadmin can insert transfer history"
  ON transfer_history FOR INSERT
  WITH CHECK (is_admin_or_superadmin());

-----------------------------------
-- EVENTS TABLE POLICIES
-----------------------------------

-- Everyone can read public events
CREATE POLICY "Everyone can read public events"
  ON events FOR SELECT
  USING (is_public = true);

-- Admins can read all events from their church
CREATE POLICY "Admins can read their church events"
  ON events FOR SELECT
  USING (
    get_user_role() = 'admin' AND
    (church_id = get_user_church_id() OR church_id IS NULL)
  );

-- Superadmin can read all events
CREATE POLICY "Superadmin can read all events"
  ON events FOR SELECT
  USING (is_superadmin());

-- Admins can create events for their church
CREATE POLICY "Admins can create events"
  ON events FOR INSERT
  WITH CHECK (
    get_user_role() = 'admin' AND
    (church_id = get_user_church_id() OR church_id IS NULL)
  );

-- Superadmin can create any event
CREATE POLICY "Superadmin can create any event"
  ON events FOR INSERT
  WITH CHECK (is_superadmin());

-- Admins can update their church events
CREATE POLICY "Admins can update their events"
  ON events FOR UPDATE
  USING (
    get_user_role() = 'admin' AND
    created_by = auth.uid()
  )
  WITH CHECK (
    get_user_role() = 'admin' AND
    (church_id = get_user_church_id() OR church_id IS NULL)
  );

-- Superadmin can update any event
CREATE POLICY "Superadmin can update any event"
  ON events FOR UPDATE
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-----------------------------------
-- ANNOUNCEMENTS TABLE POLICIES
-----------------------------------

-- Everyone can read active, published announcements
CREATE POLICY "Everyone can read active announcements"
  ON announcements FOR SELECT
  USING (
    is_active = true AND
    published_at IS NOT NULL AND
    published_at <= NOW() AND
    (expires_at IS NULL OR expires_at > NOW())
  );

-- Admins can read all announcements for their church
CREATE POLICY "Admins can read their announcements"
  ON announcements FOR SELECT
  USING (
    get_user_role() = 'admin' AND
    (church_id = get_user_church_id() OR created_by = auth.uid())
  );

-- Superadmin can read all announcements
CREATE POLICY "Superadmin can read all announcements"
  ON announcements FOR SELECT
  USING (is_superadmin());

-- Admins can create announcements
CREATE POLICY "Admins can create announcements"
  ON announcements FOR INSERT
  WITH CHECK (is_admin_or_superadmin());

-- Admins can update their own announcements
CREATE POLICY "Admins can update their announcements"
  ON announcements FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Superadmin can update any announcement
CREATE POLICY "Superadmin can update any announcement"
  ON announcements FOR UPDATE
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-----------------------------------
-- ATTENDANCE TABLE POLICIES
-----------------------------------

-- Superadmin can read all attendance
CREATE POLICY "Superadmin can read all attendance"
  ON attendance FOR SELECT
  USING (is_superadmin());

-- Admins can read attendance from their church
CREATE POLICY "Admins can read their church attendance"
  ON attendance FOR SELECT
  USING (
    get_user_role() = 'admin' AND
    church_id = get_user_church_id()
  );

-- Admins can insert attendance for their church
CREATE POLICY "Admins can insert attendance"
  ON attendance FOR INSERT
  WITH CHECK (
    get_user_role() = 'admin' AND
    church_id = get_user_church_id()
  );

-- Superadmin can manage all attendance
CREATE POLICY "Superadmin can manage all attendance"
  ON attendance FOR ALL
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-----------------------------------
-- AUDIT LOGS TABLE POLICIES
-----------------------------------

-- Only superadmin can read audit logs
CREATE POLICY "Only superadmin can read audit logs"
  ON audit_logs FOR SELECT
  USING (is_superadmin());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- No one can update or delete audit logs
-- (no policies = no access except via policies above)
