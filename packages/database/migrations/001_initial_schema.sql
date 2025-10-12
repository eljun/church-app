-- Church App Initial Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enums
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'member');
CREATE TYPE physical_condition AS ENUM ('fit', 'sickly');
CREATE TYPE spiritual_condition AS ENUM ('active', 'inactive');
CREATE TYPE member_status AS ENUM ('active', 'transferred_out', 'resigned', 'disfellowshipped', 'deceased');
CREATE TYPE transfer_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE transfer_type AS ENUM ('transfer_in', 'transfer_out');
CREATE TYPE event_type AS ENUM ('service', 'baptism', 'conference', 'social', 'other');
CREATE TYPE service_type AS ENUM ('sabbath_morning', 'sabbath_afternoon', 'prayer_meeting', 'other');
CREATE TYPE announcement_target AS ENUM ('all', 'church_specific', 'district_specific', 'field_specific');

-- Churches table
CREATE TABLE churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  field TEXT NOT NULL,
  district TEXT NOT NULL,
  city TEXT,
  province TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  established_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'member' NOT NULL,
  church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE RESTRICT,
  sp TEXT,
  full_name TEXT NOT NULL,
  birthday DATE NOT NULL,
  age INTEGER NOT NULL,
  date_of_baptism DATE,
  baptized_by TEXT,
  physical_condition physical_condition DEFAULT 'fit' NOT NULL,
  illness_description TEXT,
  spiritual_condition spiritual_condition DEFAULT 'active' NOT NULL,
  status member_status DEFAULT 'active' NOT NULL,
  resignation_date DATE,
  disfellowship_date DATE,
  date_of_death DATE,
  cause_of_death TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT age_positive CHECK (age >= 0),
  CONSTRAINT valid_resignation CHECK (resignation_date IS NULL OR status = 'resigned'),
  CONSTRAINT valid_disfellowship CHECK (disfellowship_date IS NULL OR status = 'disfellowshipped'),
  CONSTRAINT valid_death CHECK (date_of_death IS NULL OR status = 'deceased')
);

-- Transfer requests table
CREATE TABLE transfer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  from_church_id UUID NOT NULL REFERENCES churches(id) ON DELETE RESTRICT,
  to_church_id UUID NOT NULL REFERENCES churches(id) ON DELETE RESTRICT,
  request_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status transfer_status DEFAULT 'pending' NOT NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approval_date TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT different_churches CHECK (from_church_id != to_church_id),
  CONSTRAINT approval_validation CHECK (
    (status = 'approved' AND approved_by IS NOT NULL AND approval_date IS NOT NULL) OR
    (status != 'approved')
  )
);

-- Transfer history table
CREATE TABLE transfer_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  from_church TEXT NOT NULL,
  to_church TEXT NOT NULL,
  from_church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
  to_church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
  transfer_date DATE NOT NULL,
  transfer_type transfer_type NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  image_url TEXT,
  is_public BOOLEAN DEFAULT true NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_event_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_audience announcement_target DEFAULT 'all' NOT NULL,
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  district TEXT,
  field TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_expiry CHECK (expires_at IS NULL OR published_at IS NULL OR expires_at >= published_at),
  CONSTRAINT church_specific_validation CHECK (
    (target_audience = 'church_specific' AND church_id IS NOT NULL) OR
    (target_audience != 'church_specific')
  ),
  CONSTRAINT district_specific_validation CHECK (
    (target_audience = 'district_specific' AND district IS NOT NULL) OR
    (target_audience != 'district_specific')
  ),
  CONSTRAINT field_specific_validation CHECK (
    (target_audience = 'field_specific' AND field IS NOT NULL) OR
    (target_audience != 'field_specific')
  )
);

-- Attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  attendance_date DATE NOT NULL,
  service_type service_type NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_attendance UNIQUE (member_id, attendance_date, service_type)
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create Indexes
CREATE INDEX idx_users_church_id ON users(church_id);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_members_church_id ON members(church_id);
CREATE INDEX idx_members_spiritual_condition ON members(spiritual_condition);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_baptism_date ON members(date_of_baptism);
CREATE INDEX idx_members_full_name ON members(full_name);

CREATE INDEX idx_transfer_requests_status ON transfer_requests(status);
CREATE INDEX idx_transfer_requests_to_church ON transfer_requests(to_church_id);
CREATE INDEX idx_transfer_requests_from_church ON transfer_requests(from_church_id);
CREATE INDEX idx_transfer_requests_member ON transfer_requests(member_id);

CREATE INDEX idx_transfer_history_member_id ON transfer_history(member_id);
CREATE INDEX idx_transfer_history_date ON transfer_history(transfer_date);

CREATE INDEX idx_churches_district ON churches(district);
CREATE INDEX idx_churches_field ON churches(field);
CREATE INDEX idx_churches_is_active ON churches(is_active);

CREATE INDEX idx_events_church_id ON events(church_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_is_public ON events(is_public);

CREATE INDEX idx_announcements_target ON announcements(target_audience);
CREATE INDEX idx_announcements_church_id ON announcements(church_id);
CREATE INDEX idx_announcements_is_active ON announcements(is_active);

CREATE INDEX idx_attendance_member_id ON attendance(member_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_church_id ON attendance(church_id);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_churches_updated_at BEFORE UPDATE ON churches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_requests_updated_at BEFORE UPDATE ON transfer_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
