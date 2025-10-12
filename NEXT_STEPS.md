# Next Steps - Phase 2: Member Management UI

## 📋 Current Status

**✅ Phase 1 Complete:**
- Monorepo structure with Turborepo
- Database schema (9 tables with RLS)
- Authentication (login/signup with Shadcn UI)
- Dashboard UI (stats, charts, activities)
- Complete data layer (queries + actions)
- Route groups architecture (clean URLs)
- Custom typography (Gilroy + Agenor Neue)
- Shadcn UI integration

**📊 Current Routes:**
- `/` - Dashboard home
- `/login` - Auth
- `/signup` - Auth
- `/members` - **TODO: Build this**
- `/churches` - **TODO: Build this**
- `/transfers` - **TODO: Build this**
- `/reports` - **TODO: Build this**
- `/settings` - **TODO: Build this**

## 🎯 Next Phase: Member Management UI

### Goal
Build a complete member management interface with table, search, filters, forms, and detail views.

### Tasks Breakdown

#### 1. Members List Page (`/members`)
**File:** `apps/web/app/(protected)/members/page.tsx`

**Features to implement:**
- [ ] Data table with Shadcn Table component
- [ ] Pagination (50 items per page)
- [ ] Search by name
- [ ] Filter by:
  - Church (dropdown)
  - Spiritual condition (active/inactive)
  - Status (active, transferred_out, etc.)
  - Physical condition (fit/sickly)
- [ ] Sort by columns (name, age, baptism date)
- [ ] Row actions (view, edit, delete)
- [ ] Bulk actions (export, bulk delete)
- [ ] "Add Member" button

**Data to fetch:**
```typescript
// Use existing query
import { getMembers } from '@/lib/queries/members'

// In page component
const { data, count } = await getMembers({
  query: searchQuery,
  church_id: selectedChurch,
  spiritual_condition: filter,
  limit: 50,
  offset: page * 50
})
```

**UI Components needed:**
- Shadcn Table
- Shadcn Input (search)
- Shadcn Select (filters)
- Shadcn Button
- Shadcn Badge (for status)

#### 2. Add Member Form (`/members/new`)
**File:** `apps/web/app/(protected)/members/new/page.tsx`

**Form fields:**
- Church (select - required)
- Full name (text - required)
- Birthday (date - required)
- Age (auto-calculated)
- Date of baptism (date - optional)
- Baptized by (text - optional)
- Physical condition (select: fit/sickly)
- Illness description (textarea - if sickly)
- Spiritual condition (select: active/inactive)
- Status (select: active/transferred_out/etc.)
- SP number (text - optional)

**Validation:**
```typescript
// Already exists!
import { createMemberSchema } from '@/lib/validations/member'
```

**Form submission:**
```typescript
// Already exists!
import { createMember } from '@/lib/actions/members'
```

**UI Components:**
- Shadcn Form (with React Hook Form)
- Shadcn Input
- Shadcn Select
- Shadcn Textarea
- Shadcn Calendar/DatePicker
- Shadcn Button

#### 3. Edit Member Form (`/members/[id]/edit`)
**File:** `apps/web/app/(protected)/members/[id]/edit/page.tsx`

**Similar to Add form but:**
- Pre-populate with existing data
- Use `getMemberById(id)` query
- Use `updateMember()` action
- Show delete button (with confirmation dialog)

#### 4. Member Detail View (`/members/[id]`)
**File:** `apps/web/app/(protected)/members/[id]/page.tsx`

**Display:**
- Member info card
- Church details
- Transfer history table (use `getMemberTransferHistory()`)
- Edit button
- Delete button
- Back button

**Additional features:**
- Show status badge
- Display age and baptism anniversary
- Show illness description if sickly
- Timeline of transfers

### 📦 Shadcn Components to Install

```bash
# Run these commands in apps/web/
npx shadcn@latest add table
npx shadcn@latest add select
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add calendar
npx shadcn@latest add popover
npx shadcn@latest add textarea
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add alert-dialog
```

### 🔄 Existing Resources (Already Built!)

**Queries (READ operations):**
- ✅ `getMembers()` - List with filters/pagination
- ✅ `getMemberById()` - Single member detail
- ✅ `getMemberTransferHistory()` - Transfer history
- ✅ `getMemberStatsByChurch()` - Church statistics

**Actions (WRITE operations):**
- ✅ `createMember()` - Create new member
- ✅ `updateMember()` - Update existing member
- ✅ `deleteMember()` - Delete member (superadmin only)
- ✅ `bulkImportMembers()` - Bulk CSV import

**Validation:**
- ✅ `createMemberSchema` - Zod schema for create
- ✅ `updateMemberSchema` - Zod schema for update
- ✅ `searchMembersSchema` - Zod schema for search/filters

**All located in:**
- `apps/web/lib/queries/members.ts`
- `apps/web/lib/actions/members.ts`
- `apps/web/lib/validations/member.ts`

### 📝 Implementation Steps

**Step 1: Install Shadcn components**
```bash
cd apps/web
npx shadcn@latest add table select dialog dropdown-menu calendar popover textarea badge separator alert-dialog
```

**Step 2: Create members list page**
```bash
# Create the page
touch app/(protected)/members/page.tsx

# Start with basic table
# Add search
# Add filters
# Add pagination
# Add row actions
```

**Step 3: Create add member form**
```bash
touch app/(protected)/members/new/page.tsx

# Build form with React Hook Form
# Connect to createMember action
# Add validation
# Add success/error handling
```

**Step 4: Create edit member form**
```bash
mkdir -p app/(protected)/members/[id]
touch app/(protected)/members/[id]/edit/page.tsx

# Fetch member data
# Pre-populate form
# Connect to updateMember action
```

**Step 5: Create member detail view**
```bash
touch app/(protected)/members/[id]/page.tsx

# Display member info
# Show transfer history
# Add action buttons
```

### 🎨 UI/UX Guidelines

**Typography:**
- Use `font-display` (Agenor Neue) for page titles and numbers
- Use `font-sans` (Gilroy) for body text and forms
- Example:
  ```tsx
  <h1 className="font-display text-3xl font-bold">Members</h1>
  <p className="text-gray-600">Manage your church members</p>
  ```

**Tables:**
- Striped rows for better readability
- Hover effects on rows
- Sticky header on scroll
- Mobile responsive (card view on small screens)

**Forms:**
- Use Shadcn Form components
- Show validation errors inline
- Disable submit during loading
- Show success toast after save
- Auto-calculate age from birthday

**Filters:**
- Keep filters in a collapsible section
- Show active filter count
- Clear all filters button
- Preserve filters in URL params

### ⚠️ Important Notes

1. **Permissions:**
   - Admins can only see/edit members from their church
   - Superadmins can see/edit all members
   - Already enforced in queries/actions

2. **Validation:**
   - All validation schemas are ready
   - Use React Hook Form + Zod
   - Example:
     ```tsx
     const form = useForm({
       resolver: zodResolver(createMemberSchema),
     })
     ```

3. **Cache:**
   - All actions revalidate automatically
   - No need to manually refresh data
   - Cache tags already set up

4. **Error Handling:**
   - Actions return `{ data } | { error }`
   - Always check for errors
   - Show user-friendly messages

### 🚀 Start Command

```bash
cd apps/web
npm run dev
```

Visit: http://localhost:3000

## 📌 Next Session Checklist

- [ ] Review this document
- [ ] Install required Shadcn components
- [ ] Start with members list page
- [ ] Build step by step (list → add → edit → detail)
- [ ] Test with existing data (705 members)
- [ ] Ensure responsive design
- [ ] Follow typography guidelines (Gilroy + Agenor Neue)

## 🔗 Quick Links

- [Members Queries](apps/web/lib/queries/members.ts)
- [Members Actions](apps/web/lib/actions/members.ts)
- [Members Validation](apps/web/lib/validations/member.ts)
- [Font Guide](apps/web/FONTS.md)
- [Shadcn UI Docs](https://ui.shadcn.com)

---

**Current State:** Phase 1 complete, ready for Phase 2
**Next Task:** Build Member Management UI
**Priority:** Members list page with table and filters
