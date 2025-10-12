# Next Steps - Phase 3: Church Management UI

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

**✅ Phase 2 Complete:**
- Member Management UI (full CRUD)
- Members list with search, filters, pagination
- Add/edit member forms with validation
- Searchable church dropdown
- Enhanced date picker (year/month dropdowns)
- Member detail page with transfer history
- Role-based permissions
- Toast notifications
- Auto-calculated age
- Status and condition badges

**📊 Current Routes:**
- `/` - Dashboard home ✅
- `/login` - Auth ✅
- `/signup` - Auth ✅
- `/members` - Member Management ✅
- `/members/new` - Add Member ✅
- `/members/[id]` - Member Detail ✅
- `/members/[id]/edit` - Edit Member ✅
- `/churches` - **TODO: Build this**
- `/transfers` - **TODO: Build this**
- `/reports` - **TODO: Build this**
- `/settings` - **TODO: Build this**

## 🎯 Next Phase: Church Management UI

### Goal
Build a complete church management interface with map view, table, forms, and statistics.

### Tasks Breakdown

#### 1. Churches List Page (`/churches`)
**File:** `apps/web/app/(protected)/churches/page.tsx`

**Features to implement:**
- [ ] Data table with Shadcn Table component
- [ ] Pagination (50 items per page)
- [ ] Search by church name
- [ ] Filter by:
  - Field (dropdown)
  - District (dropdown)
  - Active status (active/inactive)
- [ ] Sort by columns (name, field, district)
- [ ] Row actions (view, edit, deactivate)
- [ ] Map view toggle (show churches on map)
- [ ] "Add Church" button
- [ ] Statistics cards (total, active, by field/district)

**Data to fetch:**
```typescript
// Use existing query
import { getChurches, getFields, getDistricts } from '@/lib/queries/churches'

// In page component
const { data, count } = await getChurches({
  query: searchQuery,
  field: selectedField,
  district: selectedDistrict,
  is_active: activeFilter,
  limit: 50,
  offset: page * 50
})
```

**UI Components needed:**
- Shadcn Table ✅
- Shadcn Input (search) ✅
- Shadcn Select (filters) ✅
- Shadcn Button ✅
- Shadcn Badge (for status) ✅
- Shadcn Card (for map view)
- Shadcn Tabs (for table/map toggle)

#### 2. Add Church Form (`/churches/new`)
**File:** `apps/web/app/(protected)/churches/new/page.tsx`

**Form fields:**
- Name (text - required)
- Field (text - required)
- District (text - required)
- City (text - optional)
- Province (text - optional)
- Address (text - optional)
- Latitude (number - optional)
- Longitude (number - optional)
- Image URL (text - optional)
- Active status (checkbox - default: true)
- Established date (date - optional)

**Validation:**
```typescript
// Already exists!
import { createChurchSchema } from '@/lib/validations/church'
```

**Form submission:**
```typescript
// Already exists!
import { createChurch } from '@/lib/actions/churches'
```

**UI Components:**
- Shadcn Form ✅
- Shadcn Input ✅
- Shadcn Select ✅
- Shadcn Calendar/DatePicker ✅
- Shadcn Button ✅
- Shadcn Checkbox (new)
- Map picker for coordinates (optional enhancement)

#### 3. Edit Church Form (`/churches/[id]/edit`)
**File:** `apps/web/app/(protected)/churches/[id]/edit/page.tsx`

**Similar to Add form but:**
- Pre-populate with existing data
- Use `getChurchById(id)` query
- Use `updateChurch()` action
- Show deactivate button (toggle active status)
- Only superadmin can delete

#### 4. Church Detail View (`/churches/[id]`)
**File:** `apps/web/app/(protected)/churches/[id]/page.tsx`

**Display:**
- Church info card
- Location map (if coordinates available)
- Member count and statistics
- List of members (with link to filtered member list)
- Transfer history for this church
- Edit button
- Deactivate/Activate button
- Back button

**Additional features:**
- Show active/inactive badge
- Display established anniversary
- Show church image if available
- Member statistics breakdown

### 📦 Shadcn Components to Install

```bash
# Run these commands in apps/web/
npx shadcn@latest add tabs
npx shadcn@latest add checkbox
npx shadcn@latest add card  # If not already installed
```

### 🔄 Existing Resources (Already Built!)

**Queries (READ operations):**
- ✅ `getChurches()` - List with filters/pagination
- ✅ `getChurchById()` - Single church detail
- ✅ `getFields()` - Unique field names
- ✅ `getDistricts()` - Unique district names
- ✅ `getChurchesByDistrict()` - Churches in district
- ✅ `getChurchesByField()` - Churches in field

**Actions (WRITE operations):**
- ✅ `createChurch()` - Create new church
- ✅ `updateChurch()` - Update existing church
- ✅ `deleteChurch()` - Delete church (superadmin only)

**Validation:**
- ✅ `createChurchSchema` - Zod schema for create
- ✅ `updateChurchSchema` - Zod schema for update
- ✅ `searchChurchesSchema` - Zod schema for search/filters

**All located in:**
- `apps/web/lib/queries/churches.ts`
- `apps/web/lib/actions/churches.ts`
- `apps/web/lib/validations/church.ts`

### 📝 Implementation Steps

**Step 1: Install new Shadcn components**
```bash
cd apps/web
npx shadcn@latest add tabs checkbox card
```

**Step 2: Create churches list page**
```bash
# Create the page
touch app/(protected)/churches/page.tsx

# Start with basic table
# Add search
# Add filters
# Add pagination
# Add row actions
# Optional: Add map view
```

**Step 3: Create add church form**
```bash
touch app/(protected)/churches/new/page.tsx

# Build form with React Hook Form
# Connect to createChurch action
# Add validation
# Add success/error handling
```

**Step 4: Create edit church form**
```bash
mkdir -p app/(protected)/churches/[id]
touch app/(protected)/churches/[id]/edit/page.tsx

# Fetch church data
# Pre-populate form
# Connect to updateChurch action
```

**Step 5: Create church detail view**
```bash
touch app/(protected)/churches/[id]/page.tsx

# Display church info
# Show member statistics
# Add action buttons
# Optional: Show map
```

### 🎨 UI/UX Guidelines

**Typography:**
- Use `font-display` (Agenor Neue) for page titles and numbers
- Use `font-sans` (Gilroy) for body text and forms
- Example:
  ```tsx
  <h1 className="font-display text-3xl font-bold">Churches</h1>
  <p className="text-gray-600">Manage churches in the organization</p>
  ```

**Tables:**
- Similar styling to members table
- Striped rows for better readability
- Hover effects on rows
- Sticky header on scroll
- Mobile responsive (card view on small screens)

**Forms:**
- Use Shadcn Form components
- Show validation errors inline
- Disable submit during loading
- Show success toast after save
- Optional: Add map picker for coordinates

**Statistics Cards:**
- Show total churches
- Active vs inactive count
- Breakdown by field
- Breakdown by district

### ⚠️ Important Notes

1. **Permissions:**
   - Admins can only see churches in their organization
   - Superadmins can see/edit all churches
   - Only superadmin can delete churches
   - Already enforced in queries/actions

2. **Validation:**
   - All validation schemas are ready
   - Use React Hook Form + Zod
   - Example:
     ```tsx
     const form = useForm({
       resolver: zodResolver(createChurchSchema),
     })
     ```

3. **Active Status:**
   - Churches can be activated/deactivated
   - Inactive churches don't show in member dropdowns
   - Use toggle instead of delete

4. **Coordinates:**
   - Optional but useful for map view
   - Can add map picker in future
   - For now, allow manual entry

### 🚀 Start Command

```bash
cd apps/web
npm run dev
```

Visit: http://localhost:3000

## 📌 Next Session Checklist

- [ ] Review this document
- [ ] Install required Shadcn components (tabs, checkbox, card)
- [ ] Start with churches list page
- [ ] Build step by step (list → add → edit → detail)
- [ ] Test with existing data
- [ ] Ensure responsive design
- [ ] Follow typography guidelines (Gilroy + Agenor Neue)
- [ ] Reuse patterns from member management

## 🔗 Quick Links

- [Churches Queries](apps/web/lib/queries/churches.ts)
- [Churches Actions](apps/web/lib/actions/churches.ts)
- [Churches Validation](apps/web/lib/validations/church.ts)
- [Members Example (for reference)](apps/web/app/(protected)/members/page.tsx)
- [Font Guide](apps/web/FONTS.md)
- [Shadcn UI Docs](https://ui.shadcn.com)

## 🎯 Future Phases

**Phase 4: Transfer Management**
- Transfer request form
- Transfer history view
- Approval workflow
- Bulk transfers

**Phase 5: Reports & Analytics**
- Member growth reports
- Church statistics
- Transfer reports
- Export to PDF/Excel

**Phase 6: Settings & Configuration**
- User profile
- Organization settings
- Role management
- Audit log viewer

---

**Current State:** Phase 2 complete ✅
**Next Task:** Build Church Management UI (Phase 3)
**Priority:** Churches list page with table and filters
