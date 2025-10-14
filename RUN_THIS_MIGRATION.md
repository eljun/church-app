# Fix Event Deletion - Database Migration Required

## Problem
Event deletion is not working because the RLS (Row Level Security) DELETE policy is missing for the events table.

## Solution
Run the migration file to add the missing DELETE policies.

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Easiest)
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the contents of: `packages/database/migrations/005_add_events_delete_policy.sql`
6. Click "Run" button

### Option 2: Using psql Command Line
```bash
# From the project root directory
psql -h <your-supabase-host> -U postgres -d postgres -f packages/database/migrations/005_add_events_delete_policy.sql
```

### Option 3: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

## Migration File Location
`packages/database/migrations/005_add_events_delete_policy.sql`

## What This Migration Does
Adds two RLS policies to the events table:
1. **Superadmin can delete any event** - Allows superadmins to delete any event
2. **Event creators can delete their events** - Allows users to delete events they created

## After Running Migration
1. Refresh your browser
2. Try deleting an event again
3. It should work now! ✅

## Verify Migration Success
Run this query in Supabase SQL Editor to verify policies exist:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'events' AND cmd = 'DELETE';
```

You should see 2 policies listed.
