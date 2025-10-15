-- Migration: Create visitors table for guest/visitor tracking
-- Purpose: Track visitors/guests who attend events or weekly services
-- Supports: Adults, youth, children with parent linking, international visitors, follow-up tracking

-- Create visitor type enum
CREATE TYPE visitor_type AS ENUM ('adult', 'youth', 'child');

-- Create follow-up status enum
CREATE TYPE follow_up_status AS ENUM (
  'pending',
  'contacted',
  'interested',
  'not_interested',
  'converted'
);

-- Create referral source enum
CREATE TYPE referral_source AS ENUM (
  'member_invitation',
  'online',
  'walk_in',
  'social_media',
  'other'
);

-- Create visitors table
CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Information
  full_name TEXT NOT NULL,
  birthday DATE,
  age INTEGER,
  gender TEXT, -- 'male', 'female', 'other'

  -- Contact Information
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  country TEXT DEFAULT 'Philippines' NOT NULL,

  -- Baptism Status
  is_baptized BOOLEAN DEFAULT false NOT NULL,
  date_of_baptism DATE,
  baptized_at_church TEXT, -- Name of church where they were baptized (if from another church)
  baptized_at_country TEXT, -- Country where baptized (for international visitors)

  -- Church Association (for follow-up)
  associated_church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
  association_reason TEXT, -- 'nearby', 'referred', 'expressed_interest', etc.

  -- Emergency Contact (especially for children)
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  relationship TEXT, -- 'parent', 'guardian', 'spouse', 'sibling', etc.

  -- Visitor Type & Child Tracking
  visitor_type visitor_type DEFAULT 'adult' NOT NULL,
  is_accompanied_child BOOLEAN DEFAULT false NOT NULL,
  accompanied_by_member_id UUID REFERENCES members(id) ON DELETE SET NULL, -- If child is with a member parent
  accompanied_by_visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL, -- If child is with a visitor parent

  -- Additional Info
  notes TEXT, -- Special needs, dietary restrictions, etc.
  referral_source referral_source, -- How they found out about the church
  first_visit_date DATE,

  -- Follow-up Tracking
  follow_up_status follow_up_status DEFAULT 'pending' NOT NULL,
  follow_up_notes TEXT,
  assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Elder/coordinator assigned for follow-up

  -- Audit Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT age_positive CHECK (age >= 0 OR age IS NULL),
  CONSTRAINT baptism_date_check CHECK (
    (is_baptized = true AND date_of_baptism IS NOT NULL) OR
    (is_baptized = false)
  ),
  CONSTRAINT accompanied_by_check CHECK (
    (is_accompanied_child = false AND accompanied_by_member_id IS NULL AND accompanied_by_visitor_id IS NULL) OR
    (is_accompanied_child = true AND (accompanied_by_member_id IS NOT NULL OR accompanied_by_visitor_id IS NOT NULL))
  )
);

-- Create indexes for common queries
CREATE INDEX idx_visitors_associated_church ON visitors(associated_church_id);
CREATE INDEX idx_visitors_follow_up_status ON visitors(follow_up_status);
CREATE INDEX idx_visitors_accompanied_by_member ON visitors(accompanied_by_member_id);
CREATE INDEX idx_visitors_accompanied_by_visitor ON visitors(accompanied_by_visitor_id);
CREATE INDEX idx_visitors_baptized ON visitors(is_baptized);
CREATE INDEX idx_visitors_visitor_type ON visitors(visitor_type);
CREATE INDEX idx_visitors_country ON visitors(country);
CREATE INDEX idx_visitors_assigned_to ON visitors(assigned_to_user_id);
CREATE INDEX idx_visitors_full_name ON visitors(full_name);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_visitors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_visitors_updated_at
  BEFORE UPDATE ON visitors
  FOR EACH ROW
  EXECUTE FUNCTION update_visitors_updated_at();

-- Add RLS policies
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- Superadmin: Full access to all visitors
CREATE POLICY "Superadmin can manage all visitors"
  ON visitors
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Admin: Can manage visitors associated with their church
CREATE POLICY "Admin can manage visitors in their church"
  ON visitors
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.church_id = visitors.associated_church_id
    )
  );

-- Admin: Can insert visitors with their church association
CREATE POLICY "Admin can create visitors for their church"
  ON visitors
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.church_id = visitors.associated_church_id
    )
  );

-- Coordinator: Can view all visitors (for event registration)
CREATE POLICY "Coordinator can view all visitors"
  ON visitors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'coordinator'
    )
  );

-- Coordinator: Can create and update visitors (for event registration)
CREATE POLICY "Coordinator can create visitors"
  ON visitors
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'coordinator'
    )
  );

CREATE POLICY "Coordinator can update visitors"
  ON visitors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'coordinator'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE visitors IS 'Tracks visitors/guests who attend events or weekly services. Supports adults, youth, children with parent linking, and international visitors.';
COMMENT ON COLUMN visitors.associated_church_id IS 'Church responsible for follow-up with this visitor';
COMMENT ON COLUMN visitors.is_accompanied_child IS 'True if this visitor is a child accompanied by a parent (member or visitor)';
COMMENT ON COLUMN visitors.accompanied_by_member_id IS 'Reference to member parent if child is accompanied by a church member';
COMMENT ON COLUMN visitors.accompanied_by_visitor_id IS 'Reference to visitor parent if child is accompanied by another visitor';
COMMENT ON COLUMN visitors.follow_up_status IS 'Status of follow-up: pending → contacted → interested/not_interested → converted (to member)';
COMMENT ON COLUMN visitors.referral_source IS 'How the visitor found out about the church or event';
