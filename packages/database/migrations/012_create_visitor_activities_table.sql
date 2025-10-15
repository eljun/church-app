-- Migration: Create visitor_activities table for follow-up tracking
-- Purpose: Track all interactions and follow-up activities with visitors
-- Supports: Phone calls, home visits, bible studies, emails, scheduled follow-ups

-- Create activity type enum
CREATE TYPE activity_type AS ENUM (
  'phone_call',
  'home_visit',
  'bible_study',
  'follow_up_email',
  'text_message',
  'scheduled_visit',
  'other'
);

-- Create visitor_activities table
CREATE TABLE visitor_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id), -- Who performed/scheduled the activity

  -- Activity Details
  activity_type activity_type NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,

  -- Scheduling
  scheduled_date TIMESTAMPTZ, -- When the activity is scheduled for
  completed_date TIMESTAMPTZ, -- When the activity was actually completed
  is_completed BOOLEAN DEFAULT false NOT NULL,

  -- Outcome (for completed activities)
  outcome TEXT, -- Result of the interaction (e.g., "interested", "not interested", "scheduled bible study")

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX idx_visitor_activities_visitor_id ON visitor_activities(visitor_id);
CREATE INDEX idx_visitor_activities_user_id ON visitor_activities(user_id);
CREATE INDEX idx_visitor_activities_scheduled_date ON visitor_activities(scheduled_date);
CREATE INDEX idx_visitor_activities_completed ON visitor_activities(is_completed);
CREATE INDEX idx_visitor_activities_created_at ON visitor_activities(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_visitor_activities_updated_at
  BEFORE UPDATE ON visitor_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Enable RLS
ALTER TABLE visitor_activities ENABLE ROW LEVEL SECURITY;

-- Superadmin: Full access
CREATE POLICY "Superadmin has full access to visitor activities"
  ON visitor_activities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Admin: Can manage activities for visitors associated with their church
CREATE POLICY "Admin can manage visitor activities for their church"
  ON visitor_activities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN visitors ON visitors.associated_church_id = users.church_id
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND visitors.id = visitor_activities.visitor_id
    )
  );

-- Admin: Can insert activities for visitors in their church
CREATE POLICY "Admin can create visitor activities for their church"
  ON visitor_activities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN visitors ON visitors.associated_church_id = users.church_id
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND visitors.id = visitor_activities.visitor_id
    )
  );

-- Coordinator: Can view all visitor activities (read-only for reporting)
CREATE POLICY "Coordinator can view all visitor activities"
  ON visitor_activities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'coordinator'
    )
  );

-- Users can view activities they created or are assigned to
CREATE POLICY "Users can view their own visitor activities"
  ON visitor_activities
  FOR SELECT
  USING (user_id = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE visitor_activities IS 'Tracks follow-up activities and interactions with visitors. Used for visitor engagement and conversion workflow.';
COMMENT ON COLUMN visitor_activities.visitor_id IS 'Reference to the visitor this activity is for';
COMMENT ON COLUMN visitor_activities.user_id IS 'User who performed or is assigned to this activity';
COMMENT ON COLUMN visitor_activities.activity_type IS 'Type of activity (phone call, home visit, bible study, etc.)';
COMMENT ON COLUMN visitor_activities.scheduled_date IS 'When this activity is scheduled to occur';
COMMENT ON COLUMN visitor_activities.completed_date IS 'When this activity was actually completed';
COMMENT ON COLUMN visitor_activities.is_completed IS 'Whether this activity has been completed';
COMMENT ON COLUMN visitor_activities.outcome IS 'Result or outcome of the activity after completion';
