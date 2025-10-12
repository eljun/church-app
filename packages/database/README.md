# @church-app/database

Database schema, types, and utilities for the Church App.

## Setup

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up
3. Get your project URL and service role key from Project Settings > API

### 2. Run Migrations

Copy the SQL from the migration files and run them in order in the Supabase SQL Editor:

1. `migrations/001_initial_schema.sql` - Creates tables, indexes, and triggers
2. `migrations/002_rls_policies.sql` - Sets up Row Level Security policies

**Important**: Run these in the SQL Editor in your Supabase dashboard.

### 3. Create First Superadmin User

After creating a user via Supabase Auth, manually insert into the users table:

```sql
INSERT INTO public.users (id, email, role, church_id)
VALUES (
  'YOUR_AUTH_USER_ID',  -- Get this from auth.users table
  'admin@yourchurch.com',
  'superadmin',
  NULL
);
```

### 4. Import Existing CSV Data

Set your environment variables:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

Run the import script:

```bash
npm run import-csv path/to/sample-data.csv
```

## Database Schema

See [schema.md](./schema.md) for complete database documentation.

## Types

All TypeScript types are exported from this package:

```typescript
import type { Member, Church, TransferRequest } from '@church-app/database';
```

## Directory Structure

```
packages/database/
├── src/
│   ├── index.ts          # Main exports
│   ├── types.ts          # TypeScript types
│   └── import-csv.ts     # CSV import script
├── migrations/
│   ├── 001_initial_schema.sql
│   └── 002_rls_policies.sql
├── schema.md             # Database documentation
└── README.md             # This file
```

## Notes

- All timestamps use `timestamptz` for timezone support
- RLS policies enforce role-based access control
- Audit logs track all sensitive operations
- Transfer history maintains both internal and external church references
