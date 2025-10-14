-- Add event registrations table for admin-driven event registration workflow
-- This supports a 3-stage workflow: registration → attendance → final confirmation

-- Create registration status enum
CREATE TYPE event_registration_status AS ENUM (
  'registered',      -- Stage 1: Member registered by admin (pre-event)
  'attended',        -- Stage 2: Admin confirmed attendance (post-event)
  'no_show',         -- Stage 2: Registered but didn't attend
  'confirmed',       -- Stage 3: Superadmin confirmed/locked the record
  'cancelled'        -- Registration cancelled before event
);

-- Create event_registrations table
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Registration metadata
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  registered_by UUID NOT NULL REFERENCES users(id), -- Admin who registered the member

  -- Status tracking
  status event_registration_status DEFAULT 'registered',

  -- Attendance confirmation (Stage 2)
  attendance_confirmed_at TIMESTAMPTZ,
  attendance_confirmed_by UUID REFERENCES users(id), -- Admin who confirmed attendance

  -- Final confirmation (Stage 3)
  final_confirmed_at TIMESTAMPTZ,
  final_confirmed_by UUID REFERENCES users(id), -- Superadmin who locked the record

  -- Additional info
  notes TEXT, -- Admin notes (e.g., "Needs transportation", "Will bring food")

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate registrations for same event
  UNIQUE(event_id, member_id)
);

-- Create indexes for common queries
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_member_id ON event_registrations(member_id);
CREATE INDEX idx_event_registrations_status ON event_registrations(status);
CREATE INDEX idx_event_registrations_registered_by ON event_registrations(registered_by);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_registrations_updated_at
  BEFORE UPDATE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_event_registrations_updated_at();

-- Add RLS policies
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Superadmin: Full access
CREATE POLICY "Superadmin can manage all event registrations"
  ON event_registrations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Admin: Can register members from their church for any event
CREATE POLICY "Admin can register members from their church"
  ON event_registrations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN members ON members.church_id = users.church_id
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND members.id = event_registrations.member_id
    )
  );

-- Admin: Can view and update registrations for their church members
CREATE POLICY "Admin can view registrations for their church members"
  ON event_registrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN members ON members.church_id = users.church_id
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND members.id = event_registrations.member_id
    )
  );

CREATE POLICY "Admin can update registrations for their church members"
  ON event_registrations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN members ON members.church_id = users.church_id
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND members.id = event_registrations.member_id
    )
  );

-- Admin: Can delete registrations they created (before event)
CREATE POLICY "Admin can delete registrations they created"
  ON event_registrations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND event_registrations.registered_by = users.id
      AND event_registrations.status IN ('registered', 'cancelled')
    )
  );

-- Add comments for documentation
COMMENT ON TABLE event_registrations IS 'Admin-driven event registration workflow with 3 stages: registration → attendance → final confirmation';
COMMENT ON COLUMN event_registrations.status IS 'Registration status: registered (pre-event) → attended/no_show (post-event) → confirmed (superadmin locked)';
COMMENT ON COLUMN event_registrations.registered_by IS 'Admin who registered the member for the event';
COMMENT ON COLUMN event_registrations.attendance_confirmed_by IS 'Admin who confirmed attendance after the event';
COMMENT ON COLUMN event_registrations.final_confirmed_by IS 'Superadmin who locked/confirmed the final record';
