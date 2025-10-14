-- Manual Test Script for Transfer Approval
-- Run this in Supabase SQL Editor to test the transfer process

-- Test Data:
-- Source church id: b1f3996d-7c81-437f-986e-5be538a97a6f
-- Destination church id: f3acda8b-864c-44d4-a74c-97980c464574
-- Member id: e4f474cc-6d62-4d8e-92b6-6c62ea7a3f0e

-- Step 1: Check current member state
SELECT
  id,
  full_name,
  church_id,
  (SELECT name FROM churches WHERE id = members.church_id) as current_church
FROM members
WHERE id = 'e4f474cc-6d62-4d8e-92b6-6c62ea7a3f0e';

-- Step 2: Check if there's a pending transfer request
SELECT
  id,
  member_id,
  from_church_id,
  (SELECT name FROM churches WHERE id = transfer_requests.from_church_id) as from_church,
  to_church_id,
  (SELECT name FROM churches WHERE id = transfer_requests.to_church_id) as to_church,
  status,
  request_date
FROM transfer_requests
WHERE member_id = 'e4f474cc-6d62-4d8e-92b6-6c62ea7a3f0e'
AND status = 'pending'
ORDER BY request_date DESC
LIMIT 1;

-- Step 3: Check RLS policies on members table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'members'
AND cmd = 'UPDATE'
ORDER BY policyname;

-- Step 4: Test if the UPDATE would work (as superadmin/service role)
-- This simulates what happens when approval is clicked
-- NOTE: This will NOT actually update because we're just testing the query

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
UPDATE members
SET church_id = 'f3acda8b-864c-44d4-a74c-97980c464574'
WHERE id = 'e4f474cc-6d62-4d8e-92b6-6c62ea7a3f0e';

-- Step 5: Check if the new policy exists
SELECT
  policyname,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'members'
AND policyname = 'Admins can update members in approved transfers';
