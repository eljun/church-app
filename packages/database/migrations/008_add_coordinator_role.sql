-- Migration 008: Add coordinator role to user_role enum
-- This role allows designated users to create events, manage registrations, and finalize attendance

-- IMPORTANT: This migration must be run in multiple steps due to PostgreSQL enum limitations
-- Step 1: Add the enum value (must be committed before use)

-- Add 'coordinator' value to the user_role enum (after superadmin, before admin)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'coordinator' AFTER 'superadmin';

-- Note: Coordinators will have permissions between superadmin and admin:
-- - Can create events (any scope)
-- - Can manage event registrations and approvals (all events)
-- - Can finalize attendance (important for when superadmin is not present at events)
-- - Can view all events and registrations
-- - Cannot access church/member management like superadmin
-- - More event management power than regular admins

-- STOP HERE AND COMMIT THIS TRANSACTION
-- Then run the rest of the migration in a separate transaction
-- Or manually run the following commands after this completes:

/*
-----------------------------------
-- Step 2: Update helper functions (run after Step 1 is committed)
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
-- Step 3: EVENTS TABLE - Add coordinator policies
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
-- Step 4: EVENT REGISTRATIONS - Add coordinator policies
-----------------------------------

-- Coordinator has full access to event registrations (like superadmin)
CREATE POLICY "Coordinator can manage all event registrations"
  ON event_registrations
  FOR ALL
  USING (is_coordinator())
  WITH CHECK (is_coordinator());

-----------------------------------
-- Comments
-----------------------------------

COMMENT ON FUNCTION is_coordinator() IS 'Helper function to check if current user is a coordinator';
COMMENT ON FUNCTION is_coordinator_or_superadmin() IS 'Helper function to check if current user is coordinator or superadmin';
*/
