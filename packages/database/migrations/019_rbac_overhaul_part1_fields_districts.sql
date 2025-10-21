-- =====================================================
-- Phase 11.1: RBAC Overhaul - Fields & Districts Structure
-- =====================================================
-- This migration creates the normalized reference tables for
-- fields and districts, replacing TEXT columns with proper FKs.
--
-- Changes:
-- 1. Create fields reference table (3 fields: Luzon, Visayan, Mindanao)
-- 2. Create districts reference table with field FK
-- 3. Populate districts from existing churches data
-- 4. Add field_id and district_id FK columns to churches
-- 5. Update churches with FK values from TEXT fields
-- 6. Create indexes for performance
--
-- Duration: ~2 seconds
-- Rollback: See rollback section at bottom
-- =====================================================

-- Step 1: Create fields reference table
-- This table represents the 3 main geographic fields in the organization
CREATE TABLE IF NOT EXISTS fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the 3 main fields
INSERT INTO fields (name) VALUES
  ('Luzon'),
  ('Visayan'),
  ('Mindanao')
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE fields IS 'Geographic fields (Luzon, Visayan, Mindanao) - top-level organizational structure';
COMMENT ON COLUMN fields.name IS 'Field name - must be one of: Luzon, Visayan, Mindanao';

-- Step 2: Create districts reference table
-- Districts belong to a field and contain multiple churches
CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (name, field_id)
);

COMMENT ON TABLE districts IS 'Districts within fields - each district belongs to one field and contains multiple churches';
COMMENT ON COLUMN districts.name IS 'District name (e.g., "Manila", "Cebu", "Davao")';
COMMENT ON COLUMN districts.field_id IS 'Reference to parent field';

-- Step 3: Populate districts from existing churches
-- Extract unique district/field combinations from churches table
-- This will clean duplicates and establish the canonical list
INSERT INTO districts (name, field_id)
SELECT DISTINCT
  TRIM(c.district) as district_name,
  f.id as field_id
FROM churches c
JOIN fields f ON TRIM(c.field) = f.name
WHERE c.district IS NOT NULL
  AND TRIM(c.district) != ''
ON CONFLICT (name, field_id) DO NOTHING;

-- Step 4: Add field_id and district_id FK columns to churches
-- These will eventually replace the TEXT columns
ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS field_id UUID REFERENCES fields(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES districts(id) ON DELETE RESTRICT;

COMMENT ON COLUMN churches.field_id IS 'Foreign key to fields table - will replace TEXT field column';
COMMENT ON COLUMN churches.district_id IS 'Foreign key to districts table - will replace TEXT district column';

-- Step 5: Populate the FK columns from existing TEXT fields
-- Update churches.field_id from churches.field (TEXT)
UPDATE churches c
SET field_id = f.id
FROM fields f
WHERE TRIM(c.field) = f.name
  AND c.field_id IS NULL;

-- Update churches.district_id from churches.district (TEXT)
UPDATE churches c
SET district_id = d.id
FROM districts d
JOIN fields f ON d.field_id = f.id
WHERE TRIM(c.district) = d.name
  AND TRIM(c.field) = f.name
  AND c.district_id IS NULL;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_churches_field_id ON churches(field_id);
CREATE INDEX IF NOT EXISTS idx_churches_district_id ON churches(district_id);
CREATE INDEX IF NOT EXISTS idx_districts_field_id ON districts(field_id);

-- Step 7: Add constraints to ensure data integrity
-- Make field_id NOT NULL for churches (all churches must have a field)
-- Note: We don't make district_id NOT NULL because some churches might not have districts yet
ALTER TABLE churches
  ALTER COLUMN field_id SET NOT NULL;

-- =====================================================
-- Verification Queries (run these manually to verify)
-- =====================================================
-- SELECT * FROM fields ORDER BY name;
-- SELECT d.name as district, f.name as field FROM districts d JOIN fields f ON d.field_id = f.id ORDER BY f.name, d.name;
-- SELECT name, field, field_id, district, district_id FROM churches WHERE field_id IS NULL OR district_id IS NULL;
-- SELECT f.name as field, COUNT(DISTINCT d.id) as district_count, COUNT(c.id) as church_count
-- FROM fields f
-- LEFT JOIN districts d ON f.id = d.field_id
-- LEFT JOIN churches c ON f.id = c.field_id
-- GROUP BY f.id, f.name
-- ORDER BY f.name;

-- =====================================================
-- Rollback (if needed)
-- =====================================================
-- ALTER TABLE churches DROP COLUMN IF EXISTS district_id;
-- ALTER TABLE churches DROP COLUMN IF EXISTS field_id;
-- DROP TABLE IF EXISTS districts CASCADE;
-- DROP TABLE IF EXISTS fields CASCADE;
