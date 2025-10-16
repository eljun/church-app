-- Migration 013: Add pastor and bibleworker roles with district/field assignments (FIXED VERSION)
-- This is a single-transaction version that can be run all at once

-- Step 1: Add the enum values
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'pastor' AFTER 'coordinator';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'bibleworker' AFTER 'pastor';

-- Step 2: Add new columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS district_id TEXT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS field_id TEXT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS assigned_member_ids UUID[] DEFAULT ARRAY[]::UUID[];

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_district_id ON users(district_id) WHERE district_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_field_id ON users(field_id) WHERE field_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_assigned_member_ids ON users USING GIN(assigned_member_ids) WHERE assigned_member_ids IS NOT NULL;

-- Add constraints (commented out initially to avoid blocking existing users)
-- Uncomment these once you've assigned districts/fields to your pastors:
-- ALTER TABLE users
--   ADD CONSTRAINT check_pastor_has_district_or_field
--   CHECK (
--     role != 'pastor' OR
--     (district_id IS NOT NULL OR field_id IS NOT NULL)
--   );

-- ALTER TABLE users
--   ADD CONSTRAINT check_bibleworker_has_assignments
--   CHECK (
--     role != 'bibleworker' OR
--     (assigned_member_ids IS NOT NULL AND array_length(assigned_member_ids, 1) > 0)
--   );

-- Comments
COMMENT ON COLUMN users.district_id IS 'District ID for pastors - they manage all churches in this district';
COMMENT ON COLUMN users.field_id IS 'Field ID for pastors - they manage all churches in this field';
COMMENT ON COLUMN users.assigned_member_ids IS 'Array of member IDs assigned to bibleworkers for follow-up and support';

-- Step 3: Add helper functions

-- Check if user is a pastor
CREATE OR REPLACE FUNCTION is_pastor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'pastor'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user is a bibleworker
CREATE OR REPLACE FUNCTION is_bibleworker()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'bibleworker'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user has elevated privileges (superadmin, coordinator, or pastor)
CREATE OR REPLACE FUNCTION has_elevated_privileges()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('superadmin', 'coordinator', 'pastor')
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Get pastor's district_id
CREATE OR REPLACE FUNCTION get_pastor_district()
RETURNS TEXT AS $$
  SELECT district_id FROM users
  WHERE id = auth.uid() AND role = 'pastor'
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Get pastor's field_id
CREATE OR REPLACE FUNCTION get_pastor_field()
RETURNS TEXT AS $$
  SELECT field_id FROM users
  WHERE id = auth.uid() AND role = 'pastor'
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if a member is assigned to the current bibleworker
CREATE OR REPLACE FUNCTION is_member_assigned_to_bibleworker(member_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role = 'bibleworker'
      AND member_uuid = ANY(assigned_member_ids)
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Add comments for functions
COMMENT ON FUNCTION is_pastor() IS 'Helper function to check if current user is a pastor';
COMMENT ON FUNCTION is_bibleworker() IS 'Helper function to check if current user is a bibleworker';
COMMENT ON FUNCTION has_elevated_privileges() IS 'Helper function to check if user has elevated privileges (superadmin, coordinator, or pastor)';
COMMENT ON FUNCTION get_pastor_district() IS 'Returns the district_id assigned to the current pastor';
COMMENT ON FUNCTION get_pastor_field() IS 'Returns the field_id assigned to the current pastor';
COMMENT ON FUNCTION is_member_assigned_to_bibleworker(UUID) IS 'Checks if a member is assigned to the current bibleworker';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 013 completed successfully!';
  RAISE NOTICE 'Added columns: district_id, field_id, assigned_member_ids';
  RAISE NOTICE 'Added roles: pastor, bibleworker';
  RAISE NOTICE 'Created 6 helper functions';
END $$;
