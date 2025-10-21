-- =====================================================
-- Phase 11.2a: RBAC Overhaul - Add New Roles to Enum
-- =====================================================
-- This migration ONLY adds the new role values to the enum.
-- Must be run separately and committed before part 2b.
--
-- Changes:
-- 1. Add field_secretary role to user_role enum
-- 2. Add church_secretary role to user_role enum
--
-- IMPORTANT: Run this file first, commit it, then run 020_rbac_overhaul_part2b.sql
-- PostgreSQL requires enum values to be committed before they can be used.
--
-- Duration: <1 second
-- =====================================================

-- Add field_secretary role (new hierarchical role above pastor)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'field_secretary';

-- Add church_secretary role (renamed from admin for clarity)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'church_secretary';

-- =====================================================
-- Verification Query (run this to verify)
-- =====================================================
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'user_role'::regtype ORDER BY enumlabel;
--
-- Expected output should include:
-- - bibleworker
-- - church_secretary (new)
-- - coordinator
-- - field_secretary (new)
-- - pastor
-- - superadmin
