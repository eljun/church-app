-- Migration: Create missionary_reports table
-- Purpose: Track weekly, biennial, and triennial missionary activities per church
-- Phase: 10.1 - Missionary Report System
--
-- PREREQUISITES:
-- This migration requires migrations 013 and 014 to be applied first:
--   - Migration 013: Adds district_id, field_id, assigned_member_ids columns to users table
--   - Migration 014: Adds assigned_church_ids column to users table
--
-- If you get an error about "column users.district_id does not exist",
-- please run migrations 013 and 014 first before running this migration.

-- Step 1: Create report_type enum
CREATE TYPE report_type AS ENUM ('weekly', 'biennial', 'triennial');

-- Step 2: Create missionary_reports table
CREATE TABLE missionary_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  report_date DATE NOT NULL,
  report_type report_type DEFAULT 'weekly' NOT NULL,

  -- Missionary Activities (metrics)
  bible_studies_given INTEGER DEFAULT 0 NOT NULL CHECK (bible_studies_given >= 0),
  home_visits INTEGER DEFAULT 0 NOT NULL CHECK (home_visits >= 0),
  seminars_conducted INTEGER DEFAULT 0 NOT NULL CHECK (seminars_conducted >= 0),
  conferences_conducted INTEGER DEFAULT 0 NOT NULL CHECK (conferences_conducted >= 0),
  public_lectures INTEGER DEFAULT 0 NOT NULL CHECK (public_lectures >= 0),
  pamphlets_distributed INTEGER DEFAULT 0 NOT NULL CHECK (pamphlets_distributed >= 0),
  books_distributed INTEGER DEFAULT 0 NOT NULL CHECK (books_distributed >= 0),
  magazines_distributed INTEGER DEFAULT 0 NOT NULL CHECK (magazines_distributed >= 0),
  youth_anchor INTEGER DEFAULT 0 NOT NULL CHECK (youth_anchor >= 0),

  -- Optional fields
  notes TEXT,
  highlights TEXT,
  challenges TEXT,

  -- Metadata
  reported_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Unique constraint: one report per church per date per report type
  CONSTRAINT unique_missionary_report UNIQUE (church_id, report_date, report_type)
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_missionary_reports_church_id ON missionary_reports(church_id);
CREATE INDEX idx_missionary_reports_date ON missionary_reports(report_date);
CREATE INDEX idx_missionary_reports_type ON missionary_reports(report_type);
CREATE INDEX idx_missionary_reports_reported_by ON missionary_reports(reported_by);
CREATE INDEX idx_missionary_reports_church_date ON missionary_reports(church_id, report_date);

-- Step 4: Add RLS policies

-- Enable RLS
ALTER TABLE missionary_reports ENABLE ROW LEVEL SECURITY;

-- Superadmin: Full access to all missionary reports
CREATE POLICY "Superadmin full access to missionary reports"
  ON missionary_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Admin: Manage reports for their church
CREATE POLICY "Admin manage their church missionary reports"
  ON missionary_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.church_id = missionary_reports.church_id
    )
  );

-- Pastor: Manage reports for churches in their district/field or assigned churches
CREATE POLICY "Pastor manage district/field missionary reports"
  ON missionary_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'pastor'
      AND (
        -- Assigned churches
        missionary_reports.church_id = ANY(users.assigned_church_ids)
        OR EXISTS (
          SELECT 1 FROM churches c
          WHERE c.id = missionary_reports.church_id
          AND (
            (users.district_id IS NOT NULL AND c.district = users.district_id)
            OR (users.field_id IS NOT NULL AND c.field = users.field_id)
          )
        )
      )
    )
  );

-- Coordinator: Read-only access to all missionary reports
CREATE POLICY "Coordinator view all missionary reports"
  ON missionary_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'coordinator'
    )
  );

-- Step 5: Add table and column comments
COMMENT ON TABLE missionary_reports IS 'Tracks missionary activities reported weekly, biennially, or triennially per church';
COMMENT ON COLUMN missionary_reports.report_type IS 'Type of report: weekly (regular), biennial (every 2 years), triennial (every 3 years)';
COMMENT ON COLUMN missionary_reports.bible_studies_given IS 'Number of Bible studies conducted';
COMMENT ON COLUMN missionary_reports.home_visits IS 'Number of home visits made';
COMMENT ON COLUMN missionary_reports.seminars_conducted IS 'Number of seminars organized';
COMMENT ON COLUMN missionary_reports.conferences_conducted IS 'Number of conferences organized';
COMMENT ON COLUMN missionary_reports.public_lectures IS 'Number of public lectures given';
COMMENT ON COLUMN missionary_reports.pamphlets_distributed IS 'Number of pamphlets distributed';
COMMENT ON COLUMN missionary_reports.books_distributed IS 'Number of books distributed';
COMMENT ON COLUMN missionary_reports.magazines_distributed IS 'Number of magazines distributed';
COMMENT ON COLUMN missionary_reports.youth_anchor IS 'Number of youth anchor activities';
COMMENT ON COLUMN missionary_reports.highlights IS 'Notable achievements or success stories';
COMMENT ON COLUMN missionary_reports.challenges IS 'Difficulties or obstacles encountered';
COMMENT ON COLUMN missionary_reports.reported_by IS 'User who submitted this report (admin, pastor, etc.)';
