-- Migration 008 Part 2 PATCH: Add missing read access for coordinators
-- Run this if you already ran part2 but are getting "Cannot read properties of null" errors

-----------------------------------
-- MEMBERS TABLE: Add coordinator read access
-----------------------------------

-- Coordinator can read all members (needed to view event registrations with member details)
CREATE POLICY "Coordinator can read all members"
  ON members FOR SELECT
  USING (is_coordinator());

-----------------------------------
-- CHURCHES TABLE: Add coordinator read access
-----------------------------------

-- Coordinator can read all churches (needed to view member church details in registrations)
CREATE POLICY "Coordinator can read all churches"
  ON churches FOR SELECT
  USING (is_coordinator());

-----------------------------------
-- USERS TABLE: Add coordinator read access
-----------------------------------

-- Coordinator can read all users (needed to see who registered/confirmed attendance)
CREATE POLICY "Coordinator can read all users"
  ON users FOR SELECT
  USING (is_coordinator());
