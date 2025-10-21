-- =====================================================
-- Phase 11.2b: RBAC Overhaul - User Table Updates
-- =====================================================
-- This migration updates the user table and migrates admin users.
-- MUST be run AFTER 020_rbac_overhaul_part2a_add_roles.sql is committed.
--
-- Changes:
-- 1. Migrate existing 'admin' users to 'church_secretary'
-- 2. Add field_id column to users table (for field_secretary role)
-- 3. Update role constraint to include new roles
-- 4. Add helpful comments for documentation
-- 5. Create indexes for performance
--
-- Duration: ~1 second
-- Rollback: See rollback section at bottom
-- =====================================================

-- Step 1: Migrate existing 'admin' users to 'church_secretary'
-- This renames the role for clarity while maintaining the same permissions
UPDATE users
SET role = 'church_secretary'
WHERE role = 'admin';

-- Step 2: Add field_id column to users table
-- This is used by field_secretary role to determine their field scope
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS field_id TEXT;

COMMENT ON COLUMN users.field_id IS 'For field_secretary role - field name (Luzon, Visayan, or Mindanao). Determines which field churches/districts the user can access.';

-- Step 3: Update district_id column comment for clarity
-- The district_id column should store TEXT values matching district names
COMMENT ON COLUMN users.district_id IS 'For pastor role - district name. Determines which district churches the pastor can access. Should match a district.name value.';

-- Step 4: Update church_id column comment for clarity
COMMENT ON COLUMN users.church_id IS 'For church_secretary role - UUID reference to single church assignment.';

-- Step 5: Update assigned_church_ids column comment for clarity
COMMENT ON COLUMN users.assigned_church_ids IS 'For bibleworker role - Array of church UUIDs for multiple church assignments.';

-- Step 6: Drop old role constraint and add new one with all 6 roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN (
    'superadmin',
    'field_secretary',
    'pastor',
    'church_secretary',
    'coordinator',
    'bibleworker'
  ));

COMMENT ON CONSTRAINT users_role_check ON users IS 'Ensures role is one of the 6 valid roles: superadmin, field_secretary, pastor, church_secretary, coordinator, or bibleworker';

-- Step 7: Create index on field_id for faster field-based queries
CREATE INDEX IF NOT EXISTS idx_users_field_id ON users(field_id)
  WHERE field_id IS NOT NULL;

-- Step 8: Create index on district_id for faster district-based queries
CREATE INDEX IF NOT EXISTS idx_users_district_id ON users(district_id)
  WHERE district_id IS NOT NULL;

-- Step 9: Add table comment documenting the role structure
COMMENT ON TABLE users IS 'User accounts with role-based access control.
Roles and their assignments:
- superadmin: No assignment needed (national access)
- field_secretary: field_id required (field-level access)
- pastor: district_id required (district-level access)
- church_secretary: church_id required (single church access)
- coordinator: No assignment needed (events-only access across all churches)
- bibleworker: assigned_church_ids required (multi-church read access)';

-- =====================================================
-- Verification Queries (run these manually to verify)
-- =====================================================
-- Check all roles are present in enum:
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'user_role'::regtype ORDER BY enumlabel;
--
-- Check no 'admin' role users remain:
-- SELECT id, email, role FROM users WHERE role = 'admin';
--
-- Check church_secretary users:
-- SELECT id, email, role, church_id FROM users WHERE role = 'church_secretary';
--
-- Check role distribution:
-- SELECT role, COUNT(*) as user_count FROM users GROUP BY role ORDER BY role;
--
-- Check field assignments:
-- SELECT id, email, role, field_id FROM users WHERE field_id IS NOT NULL;

-- =====================================================
-- Data Migration Notes
-- =====================================================
-- After running this migration, you may need to:
-- 1. Assign field_id to any field_secretary users
-- 2. Verify all pastor users have correct district_id values
-- 3. Verify all church_secretary users have correct church_id values
-- 4. Verify all bibleworker users have correct assigned_church_ids arrays
--
-- Example assignment queries:
-- UPDATE users SET field_id = 'Luzon' WHERE role = 'field_secretary' AND email = 'luzon.secretary@example.com';
-- UPDATE users SET district_id = 'Manila' WHERE role = 'pastor' AND email = 'manila.pastor@example.com';

-- =====================================================
-- Rollback (if needed)
-- =====================================================
-- To rollback user changes:
-- UPDATE users SET role = 'admin' WHERE role = 'church_secretary';
-- ALTER TABLE users DROP COLUMN IF EXISTS field_id;
-- DROP INDEX IF EXISTS idx_users_field_id;
-- DROP INDEX IF EXISTS idx_users_district_id;
