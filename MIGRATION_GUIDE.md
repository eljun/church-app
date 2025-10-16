# Database Migration Guide

This document provides instructions for applying database migrations to your Church App.

## Migration Order

Migrations **must be applied in order**. Do not skip migrations.

### Current Migration Status

To check which migrations have been applied to your database, run this query in Supabase SQL Editor:

```sql
SELECT * FROM pg_type WHERE typname IN (
  'user_role',
  'visitor_type',
  'activity_type',
  'report_type'
);

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'users',
    'churches',
    'members',
    'visitors',
    'visitor_activities',
    'attendance',
    'missionary_reports'
  )
ORDER BY table_name;

-- Check for new columns in users table
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN (
    'district_id',
    'field_id',
    'assigned_church_ids',
    'assigned_member_ids'
  );
```

---

## Migration List

### ✅ Migration 001: Initial Schema
**File:** `001_initial_schema.sql`

**What it does:**
- Creates base tables: `churches`, `users`, `members`, `transfer_requests`, `transfer_history`, `events`, `announcements`, `attendance`
- Creates base enums: `user_role`, `physical_condition`, `spiritual_condition`, `member_status`, etc.
- Sets up initial RLS policies

**Check if applied:**
```sql
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'churches');
```

---

### ✅ Migration 002-012: Incremental Features
These migrations add various features like event registrations, audit logs, visitors, visitor activities, etc.

---

### ✅ Migration 013: Add Pastor & Bible Worker Roles
**File:** `013_add_pastor_bibleworker_roles.sql`

**What it does:**
- Adds `pastor` and `bibleworker` to `user_role` enum
- Adds `district_id` column to users table (for pastors)
- Adds `field_id` column to users table (for pastors)
- Adds `assigned_member_ids` column to users table (for bibleworkers)
- Creates helper functions for role-based queries
- Updates RLS policies for new roles

**Check if applied:**
```sql
-- Check if columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('district_id', 'field_id', 'assigned_member_ids');

-- Should return 3 rows if migration 013 is applied
```

**Apply migration:**
Copy the entire contents of `packages/database/migrations/013_add_pastor_bibleworker_roles.sql` and paste into Supabase SQL Editor, then execute.

---

### ✅ Migration 014: Add Pastor Church Assignments
**File:** `014_add_pastor_church_assignments.sql`

**What it does:**
- Adds `assigned_church_ids` column to users table (array of UUIDs)
- Creates `can_pastor_access_church(UUID)` helper function
- Updates RLS policies to support church assignments

**Check if applied:**
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'assigned_church_ids';

-- Should return 1 row if migration 014 is applied
```

**Apply migration:**
Copy the entire contents of `packages/database/migrations/014_add_pastor_church_assignments.sql` and paste into Supabase SQL Editor, then execute.

---

### 🆕 Migration 015: Create Missionary Reports Table
**File:** `015_create_missionary_reports_table.sql`

**Prerequisites:** Migrations 013 AND 014 must be applied first!

**What it does:**
- Creates `report_type` enum (weekly, biennial, triennial)
- Creates `missionary_reports` table with 9 activity metrics
- Adds indexes for performance
- Sets up RLS policies for role-based access

**Check if applied:**
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'missionary_reports'
);

-- Should return 'true' if migration 015 is applied
```

**Apply migration:**

**Step 1: Verify prerequisites**
```sql
-- Check if district_id, field_id, assigned_church_ids exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('district_id', 'field_id', 'assigned_church_ids', 'assigned_member_ids');

-- Should return 4 rows
-- If it returns fewer than 4 rows, apply migrations 013 and 014 first!
```

**Step 2: Apply migration 015**
Copy the entire contents of `packages/database/migrations/015_create_missionary_reports_table.sql` and paste into Supabase SQL Editor, then execute.

---

## Common Issues

### Error: "column users.district_id does not exist"

**Cause:** Migration 013 has not been applied.

**Solution:** Apply migration 013 first, then migration 014, then migration 015.

### Error: "column users.assigned_church_ids does not exist"

**Cause:** Migration 014 has not been applied.

**Solution:** Apply migration 014 first, then migration 015.

### Error: "type 'report_type' already exists"

**Cause:** Migration 015 has already been partially applied.

**Solution:** Drop the existing type and re-run the migration:
```sql
DROP TYPE IF EXISTS report_type CASCADE;
-- Then re-run migration 015
```

### Error: "table 'missionary_reports' already exists"

**Cause:** Migration 015 has already been applied.

**Solution:** No action needed - migration is already applied!

---

## Quick Migration Checklist for Migration 015

Use this checklist when applying migration 015:

```
□ 1. Check if migrations 013 & 014 are applied (see queries above)
□ 2. If not applied, apply migration 013 first
□ 3. Then apply migration 014
□ 4. Finally, apply migration 015
□ 5. Verify migration 015 was successful:
     SELECT COUNT(*) FROM missionary_reports; -- Should not error
□ 6. Test creating a missionary report via the UI at /missionary-reports/new
```

---

## Rollback Instructions

If you need to rollback migration 015:

```sql
-- Drop the missionary_reports table
DROP TABLE IF EXISTS missionary_reports CASCADE;

-- Drop the report_type enum
DROP TYPE IF EXISTS report_type CASCADE;
```

**Note:** This will delete all missionary report data! Only do this in development/testing.

---

## Testing After Migration

After applying migration 015, test the following:

1. **Create a missionary report:**
   - Navigate to `/missionary-reports/new`
   - Fill in at least one activity metric
   - Submit the form
   - Verify the report appears in `/missionary-reports`

2. **View report details:**
   - Click on a report in the list
   - Verify all data displays correctly

3. **Edit a report:**
   - Click "Edit" on a report
   - Modify some values
   - Save and verify changes

4. **Test role-based access:**
   - As Admin: Should only see reports for their church
   - As Pastor: Should see reports for their district/field
   - As Superadmin: Should see all reports

5. **Test copy last report:**
   - Create a report for a church
   - Create another report for the same church
   - Click "Copy Last Report" button
   - Verify numbers are pre-filled from previous report

---

## Migration Execution via Supabase CLI (Alternative Method)

If you have Supabase CLI installed, you can run migrations using:

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Check migration status
supabase db diff

# Apply pending migrations
supabase db push

# Or apply a specific migration
supabase db execute --file packages/database/migrations/015_create_missionary_reports_table.sql
```

---

## Need Help?

If you encounter issues not covered in this guide:

1. Check the Supabase logs in the Supabase Dashboard
2. Verify your user has the necessary permissions
3. Ensure you're connected to the correct database (production vs. development)
4. Review the migration file for any syntax errors

For migration-specific issues, check the comments at the top of each migration file for additional context.
