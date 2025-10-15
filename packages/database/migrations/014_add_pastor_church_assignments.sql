/**
 * Migration: Add Pastor Church Assignments
 *
 * Adds assigned_church_ids array column to users table for pastors
 * to allow multi-church assignments in addition to district/field oversight.
 */

-- Add assigned_church_ids column for pastors
ALTER TABLE users
ADD COLUMN IF NOT EXISTS assigned_church_ids UUID[] DEFAULT '{}';

-- Add comment
COMMENT ON COLUMN users.assigned_church_ids IS 'For pastors: Specific churches they directly oversee (in addition to district/field)';

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_users_assigned_church_ids ON users USING GIN (assigned_church_ids);

-- Update helper function to check if user is pastor of a church
CREATE OR REPLACE FUNCTION is_pastor_of_church(user_id UUID, church_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
  church_record RECORD;
BEGIN
  -- Get user details
  SELECT role, district_id, field_id, assigned_church_ids
  INTO user_record
  FROM users
  WHERE id = user_id;

  -- If not a pastor, return false
  IF user_record.role != 'pastor' THEN
    RETURN FALSE;
  END IF;

  -- Check if church is in assigned_church_ids array
  IF church_id_param = ANY(user_record.assigned_church_ids) THEN
    RETURN TRUE;
  END IF;

  -- Get church details
  SELECT district, field
  INTO church_record
  FROM churches
  WHERE id = church_id_param;

  -- Check if pastor oversees this church's district or field
  IF user_record.district_id IS NOT NULL AND church_record.district = user_record.district_id THEN
    RETURN TRUE;
  END IF;

  IF user_record.field_id IS NOT NULL AND church_record.field = user_record.field_id THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
