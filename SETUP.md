# Church App - Quick Setup Guide

## What We've Built So Far

✅ **Monorepo Structure** - Turborepo setup for managing multiple apps and shared packages
✅ **Database Schema** - Complete PostgreSQL schema for churches, members, transfers, events, etc.
✅ **Row Level Security** - RBAC policies for Superadmin, Admin, and Member roles
✅ **TypeScript Types** - Shared type definitions for the entire application
✅ **CSV Import Script** - Tool to import your existing member data
✅ **Documentation** - Comprehensive docs for schema and setup

## Project Structure

```
church-app/
├── apps/
│   ├── web/              # Next.js admin portal ⚡️
│   └── mobile/           # Expo mobile app (upcoming)
│
├── packages/
│   ├── database/         # Database schema, migrations, types ✅
│   │   ├── migrations/   # SQL migration files
│   │   ├── src/
│   │   │   ├── types.ts      # TypeScript types
│   │   │   ├── import-csv.ts # CSV import tool
│   │   │   └── index.ts
│   │   ├── schema.md     # Database documentation
│   │   └── README.md
│   │
│   ├── ui/              # Shared UI components (upcoming)
│   ├── utils/           # Shared utilities (upcoming)
│   └── api/             # Shared API client (upcoming)
│
├── data/                # Your existing CSV data
├── turbo.json           # Turborepo config
└── package.json         # Root package.json
```

## Next Steps

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for database to be provisioned (2-3 minutes)

### Step 2: Run Database Migrations

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and run these migration files in order:

   **First**: `packages/database/migrations/001_initial_schema.sql`
   - Creates tables, indexes, enums, triggers

   **Second**: `packages/database/migrations/002_rls_policies.sql`
   - Sets up security policies for RBAC

### Step 3: Get API Keys

1. In Supabase dashboard, go to Project Settings > API
2. Copy these values:
   - Project URL
   - `anon` public key (for web/mobile apps)
   - `service_role` key (for CSV import - keep secret!)

### Step 4: Configure Environment

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

For CSV import, create `packages/database/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 5: Create First Superadmin User

1. Go to Supabase Dashboard > Authentication
2. Click "Add User"
3. Create user with email and password
4. Copy the user's UUID from the users list
5. Go to SQL Editor and run:

```sql
INSERT INTO public.users (id, email, role, church_id)
VALUES (
  'paste-the-uuid-here',
  'admin@yourchurch.com',
  'superadmin',
  NULL
);
```

### Step 6: Import Existing Data

```bash
cd packages/database
npm run import-csv ../../data/sample-data.csv
```

This will:
- Extract unique churches from CSV
- Create church records
- Import all members with their data
- Create transfer history records

### Step 7: Start Development

```bash
# From root directory
npm run dev
```

This starts:
- Web app at [http://localhost:3000](http://localhost:3000)
- Future: Mobile app, API services, etc.

## Available Commands

### From Root

```bash
npm run dev          # Start all apps in development mode
npm run build        # Build all apps for production
npm run lint         # Lint all packages
npm run type-check   # TypeScript check all packages
npm run clean        # Clean all build artifacts
```

### From packages/database

```bash
npm run type-check           # Check TypeScript
npm run import-csv <path>    # Import CSV data
```

### From apps/web

```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint code
```

## Database Schema Overview

### Core Tables

- **users** - Authentication and RBAC (Superadmin, Admin, Member)
- **churches** - Church locations with geographic data
- **members** - Member information, baptism, transfers, status
- **transfer_requests** - Approval workflow for member transfers
- **transfer_history** - Historical record of all transfers
- **events** - Church events and activities
- **announcements** - Targeted communications
- **attendance** - Service attendance tracking
- **audit_logs** - Security audit trail

See [packages/database/schema.md](packages/database/schema.md) for complete details.

## Security Features

✅ Row Level Security (RLS) on all tables
✅ Role-based permissions (Superadmin, Admin, Member)
✅ Audit logging for sensitive operations
✅ Supabase Auth with JWT
✅ Environment variable protection

## Troubleshooting

### "No overload matches this call" in import-csv.ts

This is expected before running migrations. The import script will work once the database schema exists.

### Can't access web app after starting dev server

1. Check that Next.js is running on port 3000
2. Verify `.env.local` exists in `apps/web/`
3. Make sure Supabase keys are correct

### CSV import fails

1. Verify migrations are run in Supabase
2. Check that `.env` has the service role key (not anon key)
3. Ensure CSV file path is correct

## What's Next?

Now that the foundation is set up, the next phases are:

1. **Web Application UI**
   - Authentication pages
   - Dashboard with stats
   - Member management CRUD
   - Transfer request workflows
   - Reports and analytics

2. **Mobile Application**
   - Setup Expo project
   - Church finder with maps
   - Events listing
   - Authentication

3. **Advanced Features**
   - AI-powered insights
   - Natural language queries
   - Automated reports
   - Real-time notifications

## Need Help?

Check the documentation:
- [Main README](README.md) - Project overview
- [Database README](packages/database/README.md) - Database details
- [Database Schema](packages/database/schema.md) - Complete schema docs

---

**Status**: ✅ Foundation Complete - Ready for feature development!
