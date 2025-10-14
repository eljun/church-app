-- Migration 008 Part 2: Add coordinator helper functions and RLS policies
-- Run this AFTER 008_add_coordinator_role.sql has been committed

-----------------------------------
-- Helper functions
-----------------------------------

-- Add helper function to check if user is coordinator
CREATE OR REPLACE FUNCTION is_coordinator()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'coordinator'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Add helper to include coordinator
CREATE OR REPLACE FUNCTION is_coordinator_or_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('coordinator', 'superadmin')
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-----------------------------------
-- EVENTS TABLE: Add coordinator policies
-----------------------------------

-- Coordinator can read all events (like superadmin)
CREATE POLICY "Coordinator can read all events"
  ON events FOR SELECT
  USING (is_coordinator());

-- Coordinator can create any event (like superadmin)
CREATE POLICY "Coordinator can create any event"
  ON events FOR INSERT
  WITH CHECK (is_coordinator());

-- Coordinator can update any event (like superadmin)
CREATE POLICY "Coordinator can update any event"
  ON events FOR UPDATE
  USING (is_coordinator())
  WITH CHECK (is_coordinator());

-----------------------------------
-- EVENT REGISTRATIONS: Add coordinator policies
-----------------------------------

-- Coordinator has full access to event registrations (like superadmin)
CREATE POLICY "Coordinator can manage all event registrations"
  ON event_registrations
  FOR ALL
  USING (is_coordinator())
  WITH CHECK (is_coordinator());

-----------------------------------
-- MEMBERS TABLE: Add coordinator read access
-----------------------------------

-- Coordinator can read all members (needed to view event registrations with member details)
CREATE POLICY "Coordinator can read all members"
  ON members FOR SELECT
  USING (is_coordinator());

-----------------------------------
-- CHURCHES TABLE: Add coordinator read access
-----------------------------------

-- Coordinator can read all churches (needed to view member church details in registrations)
CREATE POLICY "Coordinator can read all churches"
  ON churches FOR SELECT
  USING (is_coordinator());

-----------------------------------
-- USERS TABLE: Add coordinator read access
-----------------------------------

-- Coordinator can read all users (needed to see who registered/confirmed attendance)
CREATE POLICY "Coordinator can read all users"
  ON users FOR SELECT
  USING (is_coordinator());

-----------------------------------
-- Comments
-----------------------------------

COMMENT ON FUNCTION is_coordinator() IS 'Helper function to check if current user is a coordinator';
COMMENT ON FUNCTION is_coordinator_or_superadmin() IS 'Helper function to check if current user is coordinator or superadmin';
