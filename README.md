# Church Management System

A modern, full-stack church management system built with Next.js 15, Supabase, and Shadcn UI.

## 🚀 Status: Phase 1 Complete

✅ Authentication • ✅ Database • ✅ Dashboard UI • ✅ Data Layer

## 📁 Monorepo Structure

```
church-app/
├── apps/web/                      # Next.js 15 web application
│   ├── app/
│   │   ├── (auth)/               # Public routes: /login, /signup
│   │   ├── (protected)/          # Protected routes: /, /members, /churches, etc.
│   │   └── actions/              # Server actions for mutations
│   ├── components/
│   │   ├── ui/                   # Shadcn UI components
│   │   └── dashboard/            # Dashboard components
│   └── lib/
│       ├── queries/              # Data fetching (read operations)
│       ├── actions/              # Data mutations (write operations)
│       ├── validations/          # Zod schemas
│       └── supabase/             # Supabase client setup
│
├── packages/database/            # Shared database package
│   ├── migrations/               # SQL migrations
│   └── src/
│       ├── types.ts              # TypeScript database types
│       ├── import-csv.ts         # CSV import utility
│       └── clean-data.ts         # Data cleaning utility
│
└── data/                         # CSV data files
```

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components)
- **Language:** TypeScript (strict mode)
- **Database:** Supabase PostgreSQL
- **Auth:** Supabase Auth with RLS
- **UI:** Shadcn UI + Tailwind CSS v4
- **Typography:** Custom fonts (Gilroy + Agenor Neue)
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Icons:** Lucide React
- **Monorepo:** Turborepo

## 🗄 Database Schema

**9 Tables with Row Level Security:**
- `users` - Authentication and roles (superadmin, admin, member)
- `churches` - Church locations and details
- `members` - Member records with spiritual/physical tracking
- `transfer_requests` - Member transfer workflow
- `transfer_history` - Complete transfer audit trail
- `events` - Church events and programs
- `announcements` - System-wide announcements
- `attendance` - Service attendance tracking
- `audit_logs` - Complete system audit trail

**See:** [packages/database/schema.md](packages/database/schema.md)

## 🔐 Authentication & Roles

**3 Role Types:**
1. **Superadmin** - Full system access, all churches
2. **Admin** - Single church access, member management
3. **Member** - Limited access (future mobile app)

**Security:**
- Row Level Security (RLS) on all tables
- Automatic role-based data filtering
- Session management with middleware
- Audit logging on all mutations

## 📍 Routes

### Public Routes
- `/login` - Admin login with Shadcn card
- `/signup` - Admin signup with Shadcn card

### Protected Routes (Auth Required)
- `/` - Dashboard home
- `/members` - Member management
- `/churches` - Church management (superadmin only)
- `/transfers` - Transfer requests
- `/reports` - Analytics and reports
- `/settings` - User settings

## ✅ Features Implemented

### Authentication
- [x] Password-based login/signup
- [x] Session management
- [x] Route protection with middleware
- [x] Automatic session refresh

### Dashboard
- [x] Statistics cards (6 metrics)
- [x] Membership growth chart (12 months)
- [x] Recent activities feed
- [x] Role-based sidebar navigation
- [x] Responsive design

### Data Layer
- [x] Members CRUD with validation
- [x] Churches CRUD (superadmin only)
- [x] Transfer request workflow
- [x] Server-side queries (cacheable)
- [x] Server actions with revalidation
- [x] Automatic audit logging

### UI/UX
- [x] Shadcn UI components
- [x] Custom typography (Gilroy + Agenor Neue)
- [x] Consistent design system
- [x] Route groups (clean URLs)
- [x] Loading states
- [x] Error handling
- [x] Accessible components

## 🚦 Quick Start

### 1. Prerequisites
- Node.js 18+
- Supabase account (free tier works)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables

**apps/web/.env.local:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**packages/database/.env:**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Database Setup
```bash
cd packages/database

# Run migrations (in Supabase SQL Editor)
# 1. migrations/001_initial_schema.sql
# 2. migrations/002_rls_policies.sql

# Import sample data (optional)
npm run import
```

### 5. Start Development
```bash
cd apps/web
npm run dev
```

Visit **http://localhost:3000**

## 📊 Current Data

After running import:
- ✅ **705 Members** (cleaned, no duplicates)
- ✅ **83 Churches** across 3 fields
- ✅ **Normalized districts** (CV, NV, WV format)

## 🎯 Roadmap

### Phase 2: Member Management UI (Next)
- [ ] Members list page with data table
- [ ] Advanced search and filters
- [ ] Add/edit member forms
- [ ] Member detail view
- [ ] Bulk operations
- [ ] CSV export

### Phase 3: Transfer Management UI
- [ ] Transfer requests list
- [ ] Create transfer form
- [ ] Approval/rejection workflow
- [ ] Transfer history timeline
- [ ] Email notifications

### Phase 4: Churches Management UI
- [ ] Churches list (superadmin)
- [ ] Add/edit church forms
- [ ] Church detail with members
- [ ] Map integration
- [ ] Bulk import

### Phase 5: Reports & Analytics
- [ ] Custom report builder
- [ ] PDF/Excel export
- [ ] Visual analytics
- [ ] Attendance tracking

### Phase 6: Mobile App (Expo)
- [ ] Church finder with maps
- [ ] Event listings
- [ ] Live streaming
- [ ] Member profiles
- [ ] Push notifications

## 🔄 Development Workflow

### Adding a New Feature

**1. Database (if needed):**
```bash
# Create migration
touch packages/database/migrations/00X_feature_name.sql

# Update types
# Edit packages/database/src/types.ts
```

**2. Data Layer:**
```typescript
// Add validation schema
// lib/validations/feature.ts

// Add query functions
// lib/queries/feature.ts

// Add server actions
// lib/actions/feature.ts
```

**3. UI:**
```typescript
// Use Shadcn components
// components/ui/*

// Create feature components
// components/feature/*

// Add route
// app/(protected)/feature/page.tsx
```

### Code Quality
```bash
# Type check
cd apps/web && npm run type-check

# Lint
npm run lint
```

## 📝 Key Technical Decisions

1. **Server Components + Server Actions**
   - No traditional API routes for CRUD
   - Direct Supabase access with RLS
   - Better performance and type safety

2. **Route Groups**
   - `(auth)` for public routes
   - `(protected)` for authenticated routes
   - Clean URLs without prefixes

3. **Shadcn UI**
   - Accessible by default (Radix UI)
   - Easy to customize
   - Copy/paste philosophy

4. **Zod Validation**
   - Shared schemas for client/server
   - Type inference
   - Detailed error messages

5. **Audit Logging**
   - All mutations logged automatically
   - User tracking
   - Old/new values stored

## 🐛 Troubleshooting

### Port Already in Use
```bash
lsof -ti:3000 | xargs kill -9
```

### Clear Next.js Cache
```bash
cd apps/web && rm -rf .next
```

### Database Connection Issues
- Check `.env.local` variables
- Verify Supabase project status
- Confirm RLS policies are applied

## 📚 Additional Documentation

- [Setup Guide](SETUP.md) - Detailed setup instructions
- [Database Schema](packages/database/schema.md) - Complete schema docs
- [Custom Fonts Guide](apps/web/FONTS.md) - Typography usage guide

## 📄 License

Private - All rights reserved

---

**Built for church community management**
