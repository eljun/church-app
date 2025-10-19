/**
 * Migration: Add User Soft Delete
 *
 * Adds is_active column to users table to support soft delete/deactivation.
 * Prevents deletion of users with historical data (missionary reports, events, etc.)
 * while allowing accounts to be deactivated.
 */

-- Add is_active column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Add index for filtering active users
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Add comment
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active. Inactive users cannot log in but historical data is preserved.';

-- Update existing users to be active
UPDATE users SET is_active = true WHERE is_active IS NULL;
