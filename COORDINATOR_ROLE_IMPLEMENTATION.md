# Coordinator Role Implementation Summary

## Overview
Implemented a new "Coordinator" role in the church app to allow designated users to manage events, registrations, and attendance finalization when superadmins are not present at events.

## Changes Made

### 1. Database Schema Updates

#### Migration: `008_add_coordinator_role.sql`
- Added 'coordinator' value to the `user_role` enum (positioned after 'superadmin', before 'admin')
- Created helper functions:
  - `is_coordinator()`: Check if current user is a coordinator
  - `is_coordinator_or_superadmin()`: Check if user is coordinator or superadmin

#### RLS Policies Added
**Events Table:**
- Coordinators can read all events
- Coordinators can create any event
- Coordinators can update any event

**Event Registrations Table:**
- Coordinators have full access to manage all event registrations (same as superadmin)

**Members Table:**
- Coordinators can read all members (required to view registration details with member names)

**Churches Table:**
- Coordinators can read all churches (required to view church details in registrations)

**Users Table:**
- Coordinators can read all users (required to see who registered members and who confirmed attendance)

### 2. TypeScript Type Updates

#### `packages/database/src/types.ts`
- Updated `UserRole` type from:
  ```typescript
  export type UserRole = 'superadmin' | 'admin' | 'member'
  ```
  To:
  ```typescript
  export type UserRole = 'superadmin' | 'coordinator' | 'admin' | 'member'
  ```

### 3. UI Component Updates

#### Event Registrations Page (`apps/web/app/(protected)/events/[id]/registrations/page.tsx`)
- Updated "Confirm Attendance" link to only show for superadmins and coordinators
- Changed from:
  ```typescript
  {currentUser.role !== 'member' && registrations.length > 0 && (
  ```
  To:
  ```typescript
  {(currentUser.role === 'superadmin' || currentUser.role === 'coordinator') && registrations.length > 0 && (
  ```
- **Result**: Admin users can no longer access attendance confirmation page - they can only register members from their church

#### Attendance Confirmation Page (`apps/web/app/(protected)/events/[id]/attendance/page.tsx`)
- Updated comment to reflect coordinator access
- Changed from: "Only admins and superadmins can confirm attendance"
- To: "Only admins, coordinators, and superadmins can confirm attendance"

#### Attendance Confirmation Form (`apps/web/components/events/registrations/attendance-confirmation-form.tsx`)
- Updated `userRole` prop type to include 'coordinator'
- Updated finalization section visibility from:
  ```typescript
  {userRole === 'superadmin' && allStats.readyToFinalize > 0 && (
  ```
  To:
  ```typescript
  {(userRole === 'superadmin' || userRole === 'coordinator') && allStats.readyToFinalize > 0 && (
  ```
- **Result**: Coordinators can now see and use the "Finalize & Lock" button

#### Registrations Table (`apps/web/components/events/registrations/registrations-table.tsx`)
- Updated `userRole` prop type to include 'coordinator'

#### Sidebar (`apps/web/components/dashboard/sidebar.tsx`)
- Updated `UserData` interface to include 'coordinator' in role type
- Updated `getNavigation()` function to return only "Events" for coordinators
- **Result**: Coordinators see only the Events navigation item in the sidebar

### 4. Middleware & Route Protection

#### Middleware (`apps/web/middleware.ts`)
- Added coordinator role restrictions to prevent direct URL access to unauthorized pages
- Coordinators are automatically redirected to `/events` if they attempt to access:
  - Dashboard (`/`)
  - Members (`/members`)
  - Churches (`/churches`)
  - Transfers (`/transfers`)
  - Reports (`/reports`)
  - Settings (`/settings`)
- Implementation:
  ```typescript
  if (userData?.role === 'coordinator') {
    const coordinatorAllowedPaths = ['/events']
    const isAllowedPath = coordinatorAllowedPaths.some(path =>
      request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
    )
    if (!isAllowedPath && request.nextUrl.pathname !== '/events') {
      return NextResponse.redirect(new URL('/events', request.url))
    }
  }
  ```

### 5. Server Actions Updates

#### Event Registration Actions (`apps/web/lib/actions/event-registrations.ts`)
- Updated `finalizeEventAttendance()` function to allow coordinators
- Changed role check from:
  ```typescript
  if (!currentUser || currentUser.role !== 'superadmin') {
    return { error: 'Only superadmins can finalize event attendance' }
  }
  ```
  To:
  ```typescript
  if (!currentUser || (currentUser.role !== 'superadmin' && currentUser.role !== 'coordinator')) {
    return { error: 'Only superadmins and coordinators can finalize event attendance' }
  }
  ```

## Coordinator Role Permissions Summary

### What Coordinators CAN Do:
✅ **Access Events page only** - Sidebar shows only "Events" navigation
✅ Create events (any scope - church-specific, district-wide, or union-wide)
✅ View all events and registrations
✅ Manage event registrations (add, update, delete)
✅ Confirm attendance (mark as attended/no-show)
✅ **Finalize and lock attendance records** (critical for when superadmin is absent)
✅ Read member/church/user data (via RLS) - for displaying registration details only

### What Coordinators CANNOT Do:
❌ **Access Dashboard, Members, Churches, Transfers, or Reports pages** - Redirected to /events
❌ Manage churches (create, edit, delete)
❌ Manage members (create, edit, delete) - Can only view via event registrations
❌ Approve transfer requests
❌ View reports or analytics
❌ Access settings

## Next Steps

### To Apply These Changes:

**⚠️ IMPORTANT**: Due to PostgreSQL enum limitations, this migration must be run in TWO separate steps:

#### Step 1: Add the enum value
Run the first migration file to add 'coordinator' to the user_role enum:
```bash
# Connect to your Supabase database and run:
# packages/database/migrations/008_add_coordinator_role.sql
```

This will execute:
```sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'coordinator' AFTER 'superadmin';
```

**⏸️ Wait for this transaction to commit before proceeding to Step 2.**

#### Step 2: Add helper functions and RLS policies
After Step 1 is committed, run the second migration file:
```bash
# packages/database/migrations/008_add_coordinator_role_part2.sql
```

This will add:
- Helper functions: `is_coordinator()` and `is_coordinator_or_superadmin()`
- RLS policies for events table (read, create, update)
- RLS policies for event_registrations table (full access)

#### Step 3: Create a coordinator user
```sql
-- Update an existing user to coordinator role
UPDATE users
SET role = 'coordinator'
WHERE email = 'coordinator@example.com';
```

#### Step 4: Test coordinator permissions
- Login as coordinator
- Verify event creation works
- Verify registration management works
- Verify attendance confirmation and finalization works
- Verify admin users can no longer access attendance confirmation

### 🔍 Why Two Steps?
PostgreSQL requires enum values to be committed before they can be used in functions or constraints. The error you encountered:
```
ERROR: 55P04: unsafe use of new value "coordinator" of enum type user_role
HINT: New enum values must be committed before they can be used.
```

This is a PostgreSQL safety mechanism. By splitting the migration into two parts, we ensure the enum value is properly committed before creating functions that reference it.

---

## Troubleshooting

### Issue: "Cannot read properties of null" Errors

**Common errors:**
- `Cannot read properties of null (reading 'full_name')` - Missing members table access
- `Cannot read properties of null (reading 'email')` - Missing users table access
- `Cannot read properties of null (reading 'name')` - Missing churches table access

**Error location:** `components/events/registrations/registrations-table.tsx` and attendance pages

**Cause:** Coordinators don't have RLS policies to read the `members`, `churches`, and `users` tables, so the joined data in event registrations returns null.

**Solution:** Run the patch migration if you already ran Part 2:
```bash
# packages/database/migrations/008_add_coordinator_role_part2_patch.sql
```

This adds three policies:
```sql
CREATE POLICY "Coordinator can read all members" ON members FOR SELECT USING (is_coordinator());
CREATE POLICY "Coordinator can read all churches" ON churches FOR SELECT USING (is_coordinator());
CREATE POLICY "Coordinator can read all users" ON users FOR SELECT USING (is_coordinator());
```

Or re-run the updated Part 2 migration which now includes all three policies.

**Why this is needed:** When fetching event registrations, the query joins with:
- `members` table → to display member names
- `churches` table → to display church names and districts
- `users` table → to display who registered members and who confirmed attendance

Without read access to these tables, the joins return null values causing the application to crash.

## Build Status
✅ Build completed successfully with no TypeScript errors
⚠️ Minor linting warnings for unused imports (can be cleaned up separately)

## Files Modified
1. `packages/database/src/types.ts`
2. `packages/database/migrations/008_add_coordinator_role.sql` (new - Part 1)
3. `packages/database/migrations/008_add_coordinator_role_part2.sql` (new - Part 2)
4. `packages/database/migrations/008_add_coordinator_role_part2_patch.sql` (new - Quick fix)
5. `apps/web/app/(protected)/events/[id]/registrations/page.tsx`
6. `apps/web/app/(protected)/events/[id]/attendance/page.tsx`
7. `apps/web/components/events/registrations/attendance-confirmation-form.tsx`
8. `apps/web/components/events/registrations/registrations-table.tsx`
9. `apps/web/components/dashboard/sidebar.tsx`
10. `apps/web/middleware.ts`
11. `apps/web/lib/actions/event-registrations.ts`

## Migration Notes
- The database migration uses `ADD VALUE IF NOT EXISTS` to safely add the coordinator role
- Existing RLS policies for events and event_registrations remain unchanged
- New policies are additive and non-breaking
- The coordinator role is positioned between superadmin and admin in the enum for logical ordering
