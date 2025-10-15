-- Migration: Update existing attendance table to support visitors
-- Purpose: Enhance the existing attendance table instead of creating a duplicate weekly_attendance table
-- This replaces the previous 011_create_weekly_attendance_table.sql migration

-- Step 1: Add visitor_id column
ALTER TABLE attendance
  ADD COLUMN visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE;

-- Step 2: Make member_id nullable (to support visitor-only attendance)
ALTER TABLE attendance
  ALTER COLUMN member_id DROP NOT NULL;

-- Step 3: Add attended flag (defaults to true for backwards compatibility)
ALTER TABLE attendance
  ADD COLUMN attended BOOLEAN DEFAULT true NOT NULL;

-- Step 4: Add recorded_by column to track who recorded the attendance
ALTER TABLE attendance
  ADD COLUMN recorded_by UUID REFERENCES users(id);

-- Step 5: Add check constraint - must have either member_id OR visitor_id (not both, not neither)
ALTER TABLE attendance
  ADD CONSTRAINT member_or_visitor_attendance_check
  CHECK (
    (member_id IS NOT NULL AND visitor_id IS NULL) OR
    (member_id IS NULL AND visitor_id IS NOT NULL)
  );

-- Step 6: Drop old unique constraint
ALTER TABLE attendance
  DROP CONSTRAINT IF EXISTS unique_attendance;

-- Step 7: Create new partial unique indexes for both members and visitors
-- This ensures a member/visitor can only have one attendance record per date+service
CREATE UNIQUE INDEX unique_member_attendance
  ON attendance(member_id, attendance_date, service_type)
  WHERE member_id IS NOT NULL;

CREATE UNIQUE INDEX unique_visitor_attendance
  ON attendance(visitor_id, attendance_date, service_type)
  WHERE visitor_id IS NOT NULL;

-- Step 8: Add index for visitor_id lookups
CREATE INDEX idx_attendance_visitor_id ON attendance(visitor_id);
CREATE INDEX idx_attendance_recorded_by ON attendance(recorded_by);

-- Step 9: Update RLS policies to support visitor attendance

-- Superadmin: Full access (already exists, no change needed)

-- Admin: Can manage attendance for their church (update existing policy to include visitors)
DROP POLICY IF EXISTS "Admin can manage attendance for their church" ON attendance;
CREATE POLICY "Admin can manage attendance for their church"
  ON attendance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.church_id = attendance.church_id
    )
  );

-- Admin: Can insert attendance for their church
DROP POLICY IF EXISTS "Admin can record attendance for their church" ON attendance;
CREATE POLICY "Admin can record attendance for their church"
  ON attendance
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.church_id = attendance.church_id
    )
  );

-- Coordinator: Can view all attendance records (read-only for reporting)
CREATE POLICY "Coordinator can view all attendance records"
  ON attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'coordinator'
    )
  );

-- Add comments for documentation
COMMENT ON COLUMN attendance.visitor_id IS 'Reference to visitor if attendee is a guest/visitor (mutually exclusive with member_id)';
COMMENT ON COLUMN attendance.attended IS 'True if person attended, false if marked absent. Defaults to true for backwards compatibility.';
COMMENT ON COLUMN attendance.recorded_by IS 'User (admin/coordinator) who recorded this attendance';
COMMENT ON CONSTRAINT member_or_visitor_attendance_check ON attendance IS 'Ensures each attendance record has exactly one of: member_id or visitor_id';

-- Update table comment
COMMENT ON TABLE attendance IS 'Tracks attendance at church services and events for both members and visitors. Can be linked to specific events via event_id or used for general weekly service tracking.';
