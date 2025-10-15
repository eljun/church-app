-- Migration: Update event_registrations to support both members and visitors
-- Purpose: Allow event registrations for guests/visitors in addition to church members
-- Breaking Change: member_id is now nullable (must have member_id XOR visitor_id)

-- Step 1: Add visitor_id column
ALTER TABLE event_registrations
  ADD COLUMN visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE;

-- Step 2: Make member_id nullable (to support visitor-only registrations)
ALTER TABLE event_registrations
  ALTER COLUMN member_id DROP NOT NULL;

-- Step 3: Add check constraint - must have either member_id OR visitor_id (not both, not neither)
ALTER TABLE event_registrations
  ADD CONSTRAINT member_or_visitor_check
  CHECK (
    (member_id IS NOT NULL AND visitor_id IS NULL) OR
    (member_id IS NULL AND visitor_id IS NOT NULL)
  );

-- Step 4: Drop old unique constraint (event_id, member_id)
ALTER TABLE event_registrations
  DROP CONSTRAINT IF EXISTS event_registrations_event_id_member_id_key;

-- Step 5: Create partial unique indexes for both members and visitors
-- This ensures a member/visitor can only be registered once per event
CREATE UNIQUE INDEX unique_event_member_registration
  ON event_registrations(event_id, member_id)
  WHERE member_id IS NOT NULL;

CREATE UNIQUE INDEX unique_event_visitor_registration
  ON event_registrations(event_id, visitor_id)
  WHERE visitor_id IS NOT NULL;

-- Step 6: Add index for visitor_id lookups
CREATE INDEX idx_event_registrations_visitor_id ON event_registrations(visitor_id);

-- Step 7: Update RLS policies to support visitor registrations

-- Admin can register visitors from their church for events
CREATE POLICY "Admin can register visitors from their church"
  ON event_registrations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN visitors ON visitors.associated_church_id = users.church_id
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND visitors.id = event_registrations.visitor_id
    )
  );

-- Admin can view registrations for visitors from their church
CREATE POLICY "Admin can view registrations for their church visitors"
  ON event_registrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN visitors ON visitors.associated_church_id = users.church_id
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND visitors.id = event_registrations.visitor_id
    )
  );

-- Admin can update registrations for visitors from their church
CREATE POLICY "Admin can update registrations for their church visitors"
  ON event_registrations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN visitors ON visitors.associated_church_id = users.church_id
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND visitors.id = event_registrations.visitor_id
    )
  );

-- Coordinator can manage visitor registrations (same as members)
CREATE POLICY "Coordinator can register visitors for events"
  ON event_registrations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'coordinator'
    )
  );

CREATE POLICY "Coordinator can view visitor registrations"
  ON event_registrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'coordinator'
    )
  );

CREATE POLICY "Coordinator can update visitor registrations"
  ON event_registrations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'coordinator'
    )
  );

-- Add comments for documentation
COMMENT ON COLUMN event_registrations.visitor_id IS 'Reference to visitor if this registration is for a guest/visitor (mutually exclusive with member_id)';
COMMENT ON CONSTRAINT member_or_visitor_check ON event_registrations IS 'Ensures each registration has exactly one of: member_id or visitor_id';
