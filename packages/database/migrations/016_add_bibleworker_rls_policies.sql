/**
 * Migration 016: Add RLS Policies for Bibleworker Role
 *
 * Adds Row Level Security policies to allow bibleworkers to:
 * - Read ALL events (for calendar and event viewing)
 * - Read members from their assigned churches
 * - Read visitors from their assigned churches
 * - Manage visitor activities
 * - Create and edit their own missionary reports
 */

-- =====================================================
-- Events: Bibleworkers can read all events
-- =====================================================
DROP POLICY IF EXISTS "Bibleworker can read all events" ON events;
CREATE POLICY "Bibleworker can read all events"
  ON events FOR SELECT
  USING (
    get_user_role() = 'bibleworker'
  );

-- =====================================================
-- Members: Bibleworkers can read members from assigned churches
-- =====================================================
DROP POLICY IF EXISTS "Bibleworker can read assigned church members" ON members;
CREATE POLICY "Bibleworker can read assigned church members"
  ON members FOR SELECT
  USING (
    get_user_role() = 'bibleworker' AND
    church_id = ANY(
      SELECT unnest(assigned_church_ids)
      FROM users
      WHERE id = auth.uid()
    )
  );

-- =====================================================
-- Visitors: Bibleworkers can read visitors from assigned churches
-- =====================================================
DROP POLICY IF EXISTS "Bibleworker can read assigned church visitors" ON visitors;
CREATE POLICY "Bibleworker can read assigned church visitors"
  ON visitors FOR SELECT
  USING (
    get_user_role() = 'bibleworker' AND
    associated_church_id = ANY(
      SELECT unnest(assigned_church_ids)
      FROM users
      WHERE id = auth.uid()
    )
  );

-- =====================================================
-- Event Registrations: Bibleworkers can read registrations
-- =====================================================
DROP POLICY IF EXISTS "Bibleworker can read event registrations" ON event_registrations;
CREATE POLICY "Bibleworker can read event registrations"
  ON event_registrations FOR SELECT
  USING (
    get_user_role() = 'bibleworker'
  );

-- =====================================================
-- Churches: Bibleworkers can read assigned churches
-- =====================================================
DROP POLICY IF EXISTS "Bibleworker can read assigned churches" ON churches;
CREATE POLICY "Bibleworker can read assigned churches"
  ON churches FOR SELECT
  USING (
    get_user_role() = 'bibleworker' AND
    id = ANY(
      SELECT unnest(assigned_church_ids)
      FROM users
      WHERE id = auth.uid()
    )
  );

-- =====================================================
-- Missionary Reports: Bibleworkers can manage their reports
-- =====================================================
-- Read reports from assigned churches
DROP POLICY IF EXISTS "Bibleworker can read assigned church missionary reports" ON missionary_reports;
CREATE POLICY "Bibleworker can read assigned church missionary reports"
  ON missionary_reports FOR SELECT
  USING (
    get_user_role() = 'bibleworker' AND
    church_id = ANY(
      SELECT unnest(assigned_church_ids)
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Create reports for assigned churches
DROP POLICY IF EXISTS "Bibleworker can create missionary reports for assigned churches" ON missionary_reports;
CREATE POLICY "Bibleworker can create missionary reports for assigned churches"
  ON missionary_reports FOR INSERT
  WITH CHECK (
    get_user_role() = 'bibleworker' AND
    reported_by = auth.uid() AND
    church_id = ANY(
      SELECT unnest(assigned_church_ids)
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Update only their own reports
DROP POLICY IF EXISTS "Bibleworker can update own missionary reports" ON missionary_reports;
CREATE POLICY "Bibleworker can update own missionary reports"
  ON missionary_reports FOR UPDATE
  USING (
    get_user_role() = 'bibleworker' AND
    reported_by = auth.uid()
  )
  WITH CHECK (
    get_user_role() = 'bibleworker' AND
    reported_by = auth.uid() AND
    church_id = ANY(
      SELECT unnest(assigned_church_ids)
      FROM users
      WHERE id = auth.uid()
    )
  );

-- =====================================================
-- Visitor Activities: Bibleworkers can manage activities
-- =====================================================
-- Read visitor activities
DROP POLICY IF EXISTS "Bibleworker can read visitor activities" ON visitor_activities;
CREATE POLICY "Bibleworker can read visitor activities"
  ON visitor_activities FOR SELECT
  USING (
    get_user_role() = 'bibleworker'
  );

-- Create visitor activities
DROP POLICY IF EXISTS "Bibleworker can create visitor activities" ON visitor_activities;
CREATE POLICY "Bibleworker can create visitor activities"
  ON visitor_activities FOR INSERT
  WITH CHECK (
    get_user_role() = 'bibleworker'
  );

-- Update visitor activities they created
DROP POLICY IF EXISTS "Bibleworker can update own visitor activities" ON visitor_activities;
CREATE POLICY "Bibleworker can update own visitor activities"
  ON visitor_activities FOR UPDATE
  USING (
    get_user_role() = 'bibleworker' AND
    user_id = auth.uid()
  );

-- =====================================================
-- Visitors: Bibleworkers can create visitors
-- =====================================================
-- Create visitors (in addition to read policy above)
DROP POLICY IF EXISTS "Bibleworker can create visitors" ON visitors;
CREATE POLICY "Bibleworker can create visitors"
  ON visitors FOR INSERT
  WITH CHECK (
    get_user_role() = 'bibleworker'
  );

-- Update visitors (for follow-up)
DROP POLICY IF EXISTS "Bibleworker can update visitors" ON visitors;
CREATE POLICY "Bibleworker can update visitors"
  ON visitors FOR UPDATE
  USING (
    get_user_role() = 'bibleworker' AND
    associated_church_id = ANY(
      SELECT unnest(assigned_church_ids)
      FROM users
      WHERE id = auth.uid()
    )
  );
