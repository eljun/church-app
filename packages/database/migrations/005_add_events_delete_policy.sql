-- Add DELETE policies for events table
-- This migration adds the missing RLS delete policies for events

-----------------------------------
-- EVENTS TABLE DELETE POLICIES
-----------------------------------

-- Superadmin can delete any event
CREATE POLICY "Superadmin can delete any event"
  ON events FOR DELETE
  USING (is_superadmin());

-- Event creators can delete their own events
CREATE POLICY "Event creators can delete their events"
  ON events FOR DELETE
  USING (created_by = auth.uid());
