-- Migration 013: Add pastor and bibleworker roles with district/field assignments
-- These roles enable field-level and district-level user management and reporting

-- IMPORTANT: This migration must be run in multiple steps due to PostgreSQL enum limitations
-- Step 1: Add the enum values (must be committed before use)

-- Add 'pastor' value to the user_role enum (after coordinator)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'pastor' AFTER 'coordinator';

-- Add 'bibleworker' value to the user_role enum (after pastor)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'bibleworker' AFTER 'pastor';

-- Note: Role hierarchy and permissions:
-- 1. superadmin - Full system access, manages all churches/districts/fields
-- 2. coordinator - Event management across all churches
-- 3. pastor - Manages members and churches within their assigned district/field
-- 4. bibleworker - Provides support to assigned members, assists with follow-ups
-- 5. admin - Church-level management (single church)
-- 6. member - Read-only access to own data

-- STOP HERE AND COMMIT THIS TRANSACTION
-- Then run the rest of the migration in a separate transaction
-- Or manually run the following commands after this completes:

/*
-----------------------------------
-- Step 2: Add new columns to users table (run after Step 1 is committed)
-----------------------------------

-- Add district_id for pastors (they oversee a district)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS district_id TEXT NULL;

-- Add field_id for pastors (some pastors oversee entire fields)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS field_id TEXT NULL;

-- Add assigned_member_ids for bibleworkers (array of member IDs they support)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS assigned_member_ids UUID[] DEFAULT ARRAY[]::UUID[];

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_district_id ON users(district_id) WHERE district_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_field_id ON users(field_id) WHERE field_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_assigned_member_ids ON users USING GIN(assigned_member_ids) WHERE assigned_member_ids IS NOT NULL;

-- Add constraints
ALTER TABLE users
  ADD CONSTRAINT check_pastor_has_district_or_field
  CHECK (
    role != 'pastor' OR
    (district_id IS NOT NULL OR field_id IS NOT NULL)
  );

ALTER TABLE users
  ADD CONSTRAINT check_bibleworker_has_assignments
  CHECK (
    role != 'bibleworker' OR
    (assigned_member_ids IS NOT NULL AND array_length(assigned_member_ids, 1) > 0)
  );

-- Comments
COMMENT ON COLUMN users.district_id IS 'District ID for pastors - they manage all churches in this district';
COMMENT ON COLUMN users.field_id IS 'Field ID for pastors - they manage all churches in this field';
COMMENT ON COLUMN users.assigned_member_ids IS 'Array of member IDs assigned to bibleworkers for follow-up and support';

-----------------------------------
-- Step 3: Add helper functions
-----------------------------------

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

-- Check if a member is assigned to current bibleworker
CREATE OR REPLACE FUNCTION is_member_assigned_to_bibleworker(member_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role = 'bibleworker'
      AND member_uuid = ANY(assigned_member_ids)
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-----------------------------------
-- Step 4: CHURCHES - Add pastor read policies
-----------------------------------

-- Pastor can read churches in their district
CREATE POLICY "Pastor can read churches in district"
  ON churches FOR SELECT
  USING (
    is_pastor() AND (
      district = get_pastor_district() OR
      field = get_pastor_field()
    )
  );

-- Pastor can update churches in their district (limited fields)
CREATE POLICY "Pastor can update churches in district"
  ON churches FOR UPDATE
  USING (
    is_pastor() AND (
      district = get_pastor_district() OR
      field = get_pastor_field()
    )
  )
  WITH CHECK (
    is_pastor() AND (
      district = get_pastor_district() OR
      field = get_pastor_field()
    )
  );

-----------------------------------
-- Step 5: MEMBERS - Add pastor and bibleworker policies
-----------------------------------

-- Pastor can read members in churches within their district/field
CREATE POLICY "Pastor can read members in district"
  ON members FOR SELECT
  USING (
    is_pastor() AND EXISTS (
      SELECT 1 FROM churches c
      WHERE c.id = members.church_id
        AND (
          c.district = get_pastor_district() OR
          c.field = get_pastor_field()
        )
    )
  );

-- Pastor can update members in their district/field
CREATE POLICY "Pastor can update members in district"
  ON members FOR UPDATE
  USING (
    is_pastor() AND EXISTS (
      SELECT 1 FROM churches c
      WHERE c.id = members.church_id
        AND (
          c.district = get_pastor_district() OR
          c.field = get_pastor_field()
        )
    )
  )
  WITH CHECK (
    is_pastor() AND EXISTS (
      SELECT 1 FROM churches c
      WHERE c.id = members.church_id
        AND (
          c.district = get_pastor_district() OR
          c.field = get_pastor_field()
        )
    )
  );

-- Bibleworker can read assigned members
CREATE POLICY "Bibleworker can read assigned members"
  ON members FOR SELECT
  USING (
    is_bibleworker() AND is_member_assigned_to_bibleworker(members.id)
  );

-- Bibleworker can update assigned members (limited fields like notes, spiritual condition)
CREATE POLICY "Bibleworker can update assigned members"
  ON members FOR UPDATE
  USING (
    is_bibleworker() AND is_member_assigned_to_bibleworker(members.id)
  )
  WITH CHECK (
    is_bibleworker() AND is_member_assigned_to_bibleworker(members.id)
  );

-----------------------------------
-- Step 6: EVENTS - Add pastor policies
-----------------------------------

-- Pastor can read events in their district/field
CREATE POLICY "Pastor can read events in district"
  ON events FOR SELECT
  USING (
    is_pastor() AND (
      scope = 'field' OR
      scope = 'district' OR
      (scope = 'church' AND EXISTS (
        SELECT 1 FROM churches c
        WHERE c.id = events.church_id
          AND (
            c.district = get_pastor_district() OR
            c.field = get_pastor_field()
          )
      ))
    )
  );

-- Pastor can create events in their district/field
CREATE POLICY "Pastor can create events in district"
  ON events FOR INSERT
  WITH CHECK (
    is_pastor() AND (
      scope = 'field' OR
      scope = 'district' OR
      (scope = 'church' AND EXISTS (
        SELECT 1 FROM churches c
        WHERE c.id = events.church_id
          AND (
            c.district = get_pastor_district() OR
            c.field = get_pastor_field()
          )
      ))
    )
  );

-- Pastor can update events in their district/field
CREATE POLICY "Pastor can update events in district"
  ON events FOR UPDATE
  USING (
    is_pastor() AND (
      scope = 'field' OR
      scope = 'district' OR
      (scope = 'church' AND EXISTS (
        SELECT 1 FROM churches c
        WHERE c.id = events.church_id
          AND (
            c.district = get_pastor_district() OR
            c.field = get_pastor_field()
          )
      ))
    )
  )
  WITH CHECK (
    is_pastor() AND (
      scope = 'field' OR
      scope = 'district' OR
      (scope = 'church' AND EXISTS (
        SELECT 1 FROM churches c
        WHERE c.id = events.church_id
          AND (
            c.district = get_pastor_district() OR
            c.field = get_pastor_field()
          )
      ))
    )
  );

-----------------------------------
-- Step 7: EVENT REGISTRATIONS - Add pastor and bibleworker policies
-----------------------------------

-- Pastor can manage event registrations in their district/field
CREATE POLICY "Pastor can manage event registrations in district"
  ON event_registrations FOR ALL
  USING (
    is_pastor() AND EXISTS (
      SELECT 1 FROM events e
      LEFT JOIN churches c ON e.church_id = c.id
      WHERE e.id = event_registrations.event_id
        AND (
          e.scope IN ('field', 'district') OR
          (e.scope = 'church' AND (
            c.district = get_pastor_district() OR
            c.field = get_pastor_field()
          ))
        )
    )
  )
  WITH CHECK (
    is_pastor() AND EXISTS (
      SELECT 1 FROM events e
      LEFT JOIN churches c ON e.church_id = c.id
      WHERE e.id = event_registrations.event_id
        AND (
          e.scope IN ('field', 'district') OR
          (e.scope = 'church' AND (
            c.district = get_pastor_district() OR
            c.field = get_pastor_field()
          ))
        )
    )
  );

-- Bibleworker can view event registrations for assigned members
CREATE POLICY "Bibleworker can view registrations for assigned members"
  ON event_registrations FOR SELECT
  USING (
    is_bibleworker() AND
    event_registrations.member_id IS NOT NULL AND
    is_member_assigned_to_bibleworker(event_registrations.member_id)
  );

-----------------------------------
-- Step 8: VISITORS - Add pastor and bibleworker policies
-----------------------------------

-- Pastor can read visitors associated with churches in their district/field
CREATE POLICY "Pastor can read visitors in district"
  ON visitors FOR SELECT
  USING (
    is_pastor() AND EXISTS (
      SELECT 1 FROM churches c
      WHERE c.id = visitors.associated_church_id
        AND (
          c.district = get_pastor_district() OR
          c.field = get_pastor_field()
        )
    )
  );

-- Pastor can manage visitors in their district/field
CREATE POLICY "Pastor can manage visitors in district"
  ON visitors FOR ALL
  USING (
    is_pastor() AND EXISTS (
      SELECT 1 FROM churches c
      WHERE c.id = visitors.associated_church_id
        AND (
          c.district = get_pastor_district() OR
          c.field = get_pastor_field()
        )
    )
  )
  WITH CHECK (
    is_pastor() AND EXISTS (
      SELECT 1 FROM churches c
      WHERE c.id = visitors.associated_church_id
        AND (
          c.district = get_pastor_district() OR
          c.field = get_pastor_field()
        )
    )
  );

-- Bibleworker can view visitors assigned to them
CREATE POLICY "Bibleworker can view assigned visitors"
  ON visitors FOR SELECT
  USING (
    is_bibleworker() AND
    visitors.assigned_to_user_id = auth.uid()
  );

-- Bibleworker can update visitors assigned to them
CREATE POLICY "Bibleworker can update assigned visitors"
  ON visitors FOR UPDATE
  USING (
    is_bibleworker() AND
    visitors.assigned_to_user_id = auth.uid()
  )
  WITH CHECK (
    is_bibleworker() AND
    visitors.assigned_to_user_id = auth.uid()
  );

-----------------------------------
-- Step 9: ATTENDANCE - Add pastor policies
-----------------------------------

-- Pastor can read attendance records in their district/field
CREATE POLICY "Pastor can read attendance in district"
  ON attendance FOR SELECT
  USING (
    is_pastor() AND EXISTS (
      SELECT 1 FROM churches c
      WHERE c.id = attendance.church_id
        AND (
          c.district = get_pastor_district() OR
          c.field = get_pastor_field()
        )
    )
  );

-- Pastor can manage attendance in their district/field
CREATE POLICY "Pastor can manage attendance in district"
  ON attendance FOR ALL
  USING (
    is_pastor() AND EXISTS (
      SELECT 1 FROM churches c
      WHERE c.id = attendance.church_id
        AND (
          c.district = get_pastor_district() OR
          c.field = get_pastor_field()
        )
    )
  )
  WITH CHECK (
    is_pastor() AND EXISTS (
      SELECT 1 FROM churches c
      WHERE c.id = attendance.church_id
        AND (
          c.district = get_pastor_district() OR
          c.field = get_pastor_field()
        )
    )
  );

-----------------------------------
-- Step 10: VISITOR ACTIVITIES - Add bibleworker policies
-----------------------------------

-- Bibleworker can view activities for assigned visitors
CREATE POLICY "Bibleworker can view activities for assigned visitors"
  ON visitor_activities FOR SELECT
  USING (
    is_bibleworker() AND EXISTS (
      SELECT 1 FROM visitors v
      WHERE v.id = visitor_activities.visitor_id
        AND v.assigned_to_user_id = auth.uid()
    )
  );

-- Bibleworker can create activities for assigned visitors
CREATE POLICY "Bibleworker can create activities for assigned visitors"
  ON visitor_activities FOR INSERT
  WITH CHECK (
    is_bibleworker() AND EXISTS (
      SELECT 1 FROM visitors v
      WHERE v.id = visitor_activities.visitor_id
        AND v.assigned_to_user_id = auth.uid()
    )
  );

-- Bibleworker can update activities for assigned visitors
CREATE POLICY "Bibleworker can update activities for assigned visitors"
  ON visitor_activities FOR UPDATE
  USING (
    is_bibleworker() AND EXISTS (
      SELECT 1 FROM visitors v
      WHERE v.id = visitor_activities.visitor_id
        AND v.assigned_to_user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_bibleworker() AND EXISTS (
      SELECT 1 FROM visitors v
      WHERE v.id = visitor_activities.visitor_id
        AND v.assigned_to_user_id = auth.uid()
    )
  );

-----------------------------------
-- Comments
-----------------------------------

COMMENT ON FUNCTION is_pastor() IS 'Helper function to check if current user is a pastor';
COMMENT ON FUNCTION is_bibleworker() IS 'Helper function to check if current user is a bibleworker';
COMMENT ON FUNCTION has_elevated_privileges() IS 'Helper function to check if user has elevated privileges (superadmin, coordinator, or pastor)';
COMMENT ON FUNCTION get_pastor_district() IS 'Returns the district_id assigned to the current pastor';
COMMENT ON FUNCTION get_pastor_field() IS 'Returns the field_id assigned to the current pastor';
COMMENT ON FUNCTION is_member_assigned_to_bibleworker(UUID) IS 'Checks if a member is assigned to the current bibleworker';

*/
