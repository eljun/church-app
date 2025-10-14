-- Add Event Scope System for Hierarchical Events
-- This allows events to be scoped at different organizational levels

-- Step 1: Add country field to churches table
ALTER TABLE churches ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Philippines';

-- Step 2: Create event_scope enum (skip if already exists)
DO $$ BEGIN
  CREATE TYPE event_scope AS ENUM ('national', 'field', 'district', 'church');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 3: Add scope fields to events table (without defaults initially)
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_scope event_scope;
ALTER TABLE events ADD COLUMN IF NOT EXISTS scope_value TEXT;

-- Step 4: Update existing events with church_id to have church scope
UPDATE events
SET event_scope = 'church',
    scope_value = church_id::text
WHERE event_scope IS NULL AND church_id IS NOT NULL;

-- Step 5: Update existing organization-wide events (where church_id is null)
UPDATE events
SET event_scope = 'national',
    scope_value = 'Philippines'
WHERE event_scope IS NULL AND church_id IS NULL;

-- Step 6: Now set default for new events
ALTER TABLE events ALTER COLUMN event_scope SET DEFAULT 'church';

-- Step 7: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_scope ON events(event_scope);
CREATE INDEX IF NOT EXISTS idx_events_scope_value ON events(scope_value);
CREATE INDEX IF NOT EXISTS idx_churches_country ON churches(country);

-- Step 8: Add check constraint to ensure scope_value is set when scope is set
-- Made more lenient to allow proper data states
ALTER TABLE events DROP CONSTRAINT IF EXISTS check_scope_value;
ALTER TABLE events ADD CONSTRAINT check_scope_value
CHECK (
  event_scope IS NULL OR
  (event_scope = 'national' AND scope_value IS NOT NULL) OR
  (event_scope = 'field' AND scope_value IS NOT NULL) OR
  (event_scope = 'district' AND scope_value IS NOT NULL) OR
  (event_scope = 'church' AND (scope_value IS NOT NULL OR church_id IS NOT NULL))
);

-- Step 9: Add comment for documentation
COMMENT ON COLUMN events.event_scope IS 'Organizational level: national (country-wide), field (Luzon/Visayas/Mindanao), district (district-level), church (single church)';
COMMENT ON COLUMN events.scope_value IS 'Value depends on scope: country name for national, field name for field, district name for district, church_id for church';
