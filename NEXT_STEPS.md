# Next Steps - Phase 4: Transfer Management

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

**✅ Phase 3 Complete:**
- Church Management UI (full CRUD)
- Churches list with search, filters, pagination
- Filter by Field, District, Active status
- Add/edit church forms with validation
- Church detail page with statistics
- **Image Upload System:**
  - Drag-and-drop multi-image upload
  - Supabase Storage integration
  - Primary image designation
  - Image gallery with lightbox modal
  - Image reordering and management
- Member count per church
- Link to filtered member list
- Pagination preserves all filters
- Responsive image gallery layouts

**📊 Current Routes:**
- `/` - Dashboard home ✅
- `/login` - Auth ✅
- `/signup` - Auth ✅
- `/members` - Member Management ✅
- `/members/new` - Add Member ✅
- `/members/[id]` - Member Detail ✅
- `/members/[id]/edit` - Edit Member ✅
- `/churches` - Church Management ✅
- `/churches/new` - Add Church ✅
- `/churches/[id]` - Church Detail ✅
- `/churches/[id]/edit` - Edit Church ✅
- `/transfers` - Transfer Management ✅
- `/transfers/new` - Create Transfer Request ✅
- `/transfers/[id]` - Transfer Detail View ✅
- `/transfers/bulk` - Bulk Transfer Tool ✅
- `/reports` - **TODO: Build this** (Phase 5)
- `/settings` - **TODO: Build this** (Phase 8)

## 🎯 Next Phase: Transfer Management

### Goal
Build a complete transfer management system to handle member transfers between churches, including request creation, approval workflow, and history tracking.

### Features Overview

**Transfer System Components:**
1. Transfer Request Form
2. Pending Transfers List (with approval actions)
3. Transfer History View
4. Bulk Transfer Tool
5. Transfer Notifications

### Tasks Breakdown

#### 1. Transfer Request Form (`/transfers/new`)
**File:** `apps/web/app/(protected)/transfers/new/page.tsx`

**Features to implement:**
- [ ] Member selection (searchable dropdown)
- [ ] From Church (auto-filled from member's current church)
- [ ] To Church (dropdown of all churches)
- [ ] Transfer date picker
- [ ] Transfer type (transfer_in / transfer_out)
- [ ] Notes/reason field
- [ ] Validation (can't transfer to same church)
- [ ] Auto-create transfer request

**Form fields:**
```typescript
{
  member_id: string (required)
  from_church_id: string (required - auto)
  to_church_id: string (required)
  transfer_date: date (required - default today)
  type: 'transfer_in' | 'transfer_out'
  notes: string (optional)
}
```

**Validation:**
```typescript
// Already exists!
import { createTransferRequestSchema } from '@/lib/validations/transfer'
```

**Actions:**
```typescript
// Already exists!
import { createTransferRequest } from '@/lib/actions/transfers'
```

#### 2. Pending Transfers List (`/transfers/pending`)
**File:** `apps/web/app/(protected)/transfers/pending/page.tsx`

**Features:**
- [ ] Table showing all pending transfer requests
- [ ] Filter by:
  - From Church
  - To Church
  - Request date range
  - Member name
- [ ] Sort by date, member name, churches
- [ ] Approve button (for superadmin/destination admin)
- [ ] Reject button with reason modal
- [ ] View member details link
- [ ] Batch approval (select multiple)
- [ ] Status badges (pending, approved, rejected)

**Approval Flow:**
```typescript
// Approve transfer
await approveTransfer(transferId, userId)
// This will:
// 1. Update transfer_requests.status = 'approved'
// 2. Add to transfer_history
// 3. Update member.church_id
// 4. Send notification
```

#### 3. Transfer History (`/transfers/history`)
**File:** `apps/web/app/(protected)/transfers/history/page.tsx`

**Features:**
- [ ] Complete transfer history table
- [ ] Filter by:
  - Date range
  - From/To Church
  - Member name
  - Status (approved/rejected)
- [ ] Export to CSV/PDF
- [ ] Timeline view option
- [ ] Statistics cards:
  - Total transfers this month
  - Pending approvals
  - Average processing time
- [ ] Link to view member's full transfer history

#### 4. Bulk Transfer Tool (`/transfers/bulk`)
**File:** `apps/web/app/(protected)/transfers/bulk/page.tsx`

**Features:**
- [ ] Select multiple members from one church
- [ ] Choose destination church
- [ ] Set transfer date for all
- [ ] Add bulk notes
- [ ] Review before submit
- [ ] Create multiple transfer requests at once
- [ ] Progress indicator during bulk creation

**Use Cases:**
- Church closure → transfer all members
- District reorganization
- Mass transfers after events

#### 5. Transfer Detail View (`/transfers/[id]`)
**File:** `apps/web/app/(protected)/transfers/[id]/page.tsx`

**Display:**
- [ ] Transfer request details
- [ ] Member information card
- [ ] From/To church info
- [ ] Timeline of status changes
- [ ] Notes and reason
- [ ] Approver information (if approved)
- [ ] Rejection reason (if rejected)
- [ ] Action buttons (approve/reject if pending)

### 📦 Additional UI Components Needed

```bash
# Run these commands in apps/web/
npx shadcn@latest add command  # For combobox search
npx shadcn@latest add dialog   # For modals
npx shadcn@latest add textarea # For notes
npx shadcn@latest add alert-dialog  # For confirmations
```

### 🔄 Existing Resources

**Database Schema:**
```typescript
// transfer_requests table
{
  id: uuid
  member_id: uuid
  from_church_id: uuid
  to_church_id: uuid
  request_date: timestamp
  status: 'pending' | 'approved' | 'rejected'
  approved_by: uuid (nullable)
  approval_date: timestamp (nullable)
  rejection_reason: text (nullable)
  notes: text (nullable)
}

// transfer_history table
{
  id: uuid
  member_id: uuid
  from_church: text
  to_church: text
  from_church_id: uuid
  to_church_id: uuid
  transfer_date: date
  notes: text
}
```

**Queries (to be created):**
- `getTransferRequests()` - List with filters
- `getTransferRequestById()` - Single request detail
- `getPendingTransfers()` - Only pending requests
- `getTransferHistory()` - Historical transfers
- `getMemberTransferHistory()` - Already exists!

**Actions (to be created):**
- `createTransferRequest()` - Create new request
- `approveTransfer()` - Approve and execute transfer
- `rejectTransfer()` - Reject with reason
- `bulkCreateTransfers()` - Create multiple requests

**Validation (to be created):**
- `createTransferRequestSchema` - Zod schema
- `approveTransferSchema` - Zod schema
- `bulkTransferSchema` - Zod schema

### 📝 Implementation Steps

**Step 1: Create transfer queries and actions**
```bash
# Create new files
touch apps/web/lib/queries/transfers.ts
touch apps/web/lib/actions/transfers.ts
touch apps/web/lib/validations/transfer.ts

# Implement CRUD operations
# Add proper error handling
# Implement RLS policies
```

**Step 2: Create transfer request form**
```bash
mkdir -p app/(protected)/transfers/new
touch app/(protected)/transfers/new/page.tsx

# Build form with member/church selection
# Add validation
# Connect to createTransferRequest action
```

**Step 3: Create pending transfers list**
```bash
mkdir -p app/(protected)/transfers/pending
touch app/(protected)/transfers/pending/page.tsx

# Build table with filters
# Add approve/reject buttons
# Implement approval workflow
```

**Step 4: Create transfer history view**
```bash
mkdir -p app/(protected)/transfers/history
touch app/(protected)/transfers/history/page.tsx

# Display historical transfers
# Add export functionality
# Show statistics
```

**Step 5: Create bulk transfer tool**
```bash
mkdir -p app/(protected)/transfers/bulk
touch app/(protected)/transfers/bulk/page.tsx

# Multi-select members
# Choose destination
# Bulk create requests
```

### 🎨 UI/UX Guidelines

**Transfer Request Form:**
- Step-by-step wizard (optional)
- Show member photo and current church
- Visual comparison of from/to churches
- Confirmation dialog before submit
- Success message with request ID

**Pending Transfers Table:**
- Color-coded status badges
- Quick actions (approve/reject icons)
- Expandable rows for details
- Batch selection checkboxes
- Filter by urgent/old requests

**Approval Modal:**
```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogTitle>Approve Transfer?</AlertDialogTitle>
    <AlertDialogDescription>
      Transfer {memberName} from {fromChurch} to {toChurch}?
      This action will update the member's church assignment.
    </AlertDialogDescription>
    <AlertDialogActions>
      <Button variant="outline">Cancel</Button>
      <Button onClick={handleApprove}>Approve Transfer</Button>
    </AlertDialogActions>
  </AlertDialogContent>
</AlertDialog>
```

**Timeline View:**
```tsx
<div className="space-y-4">
  {history.map(transfer => (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-primary" />
        <div className="w-0.5 h-full bg-border" />
      </div>
      <div>
        <p className="font-medium">{transfer.from_church} → {transfer.to_church}</p>
        <p className="text-sm text-gray-500">{formatDate(transfer.date)}</p>
      </div>
    </div>
  ))}
</div>
```

### ⚠️ Important Business Rules

1. **Approval Permissions:**
   - Destination church admin can approve transfers TO their church
   - Source church admin can approve transfers FROM their church
   - Superadmin can approve any transfer
   - Member's status must be 'active' to transfer

2. **Transfer Execution:**
   - On approval:
     1. Update member's church_id
     2. Add entry to transfer_history
     3. Update transfer_request status
     4. Send notification to member (future)
     5. Log action in audit_logs

3. **Validation Rules:**
   - Cannot transfer to same church
   - Member must exist and be active
   - Both churches must be active
   - Cannot have pending transfer for same member

4. **Status Flow:**
   ```
   Created → Pending → Approved/Rejected
   (cannot change after approval/rejection)
   ```

### 🔗 Integration Points

**With Member Management:**
- Add "Request Transfer" button to member detail page
- Show pending transfer status on member card
- Display transfer history on member detail page

**With Church Management:**
- Show pending transfers count on church detail
- Add "View Transfers" link to church page
- Display transfer statistics per church

**Dashboard Integration:**
- Add pending transfers widget
- Show recent transfer activity
- Transfer statistics cards

### 🚀 Start Command

```bash
cd apps/web
npm run dev
```

Visit: http://localhost:3000

## 📌 Next Session Checklist

- [ ] Review transfer database schema
- [ ] Create transfer queries file (`lib/queries/transfers.ts`)
- [ ] Create transfer actions file (`lib/actions/transfers.ts`)
- [ ] Create transfer validation schemas (`lib/validations/transfer.ts`)
- [ ] Build transfer request form
- [ ] Build pending transfers list
- [ ] Implement approval workflow
- [ ] Add transfer history view
- [ ] Create bulk transfer tool
- [ ] Integrate with member/church pages

## 🎯 Future Phases

**Phase 5: Reports & Analytics**
- Member growth reports (by church, district, field)
- Transfer reports (frequency, patterns)
- Baptism anniversary reports
- Birthday reports
- Statistical dashboards
- Export to PDF/Excel
- Custom report builder
- Scheduled report emails

**Phase 6: Events & Activities**
- Event management (services, conferences, socials)
- Attendance tracking
- Event registration
- Recurring events
- Event calendar view
- Event announcements

**Phase 7: Announcements & Communications**
- Create announcements
- Target by church/district/field
- Schedule announcements
- Email notifications
- Push notifications (future)
- Announcement archive

**Phase 8: Settings & Administration**
- User profile management
- Organization settings
- Role management
- Audit log viewer
- System configuration
- Backup/restore
- User permissions management

**Phase 9: Mobile Optimization**
- Progressive Web App (PWA)
- Mobile-first responsive design
- Offline support
- Push notifications
- Mobile navigation
- Touch-optimized UI

**Phase 10: Advanced Features**
- AI-powered insights
- Predictive analytics
- Automated reporting
- Integration APIs
- Webhook support
- Custom fields
- Multi-language support

**✅ Phase 4 Complete:**
- Transfer Management UI (full functionality)
- Main transfers page with tabs (Pending/History)
- Transfer statistics cards
- Transfer request form (single member)
- Bulk transfer tool (multiple members)
- Pending transfers table with approve/reject
- Transfer history view with separate columns
- Transfer detail page with full information
- Role-based permissions enforced
- Complete approval/rejection workflow

**📊 Transfer Routes:**
- `/transfers` - Main page with tabs ✅
- `/transfers/new` - Create transfer request ✅
- `/transfers/[id]` - Transfer detail view ✅
- `/transfers/bulk` - Bulk transfer tool ✅

---

**Current State:** Phase 4 COMPLETE ✅
**Next Phase:** Phase 5 - Reports & Analytics
**Status:** Ready for production deployment
**All Issues Resolved:** Transfer system fully functional

## 📚 Recent Achievements

### Phase 4 Highlights:
✅ **Transfer Management System** - Complete transfer workflow implementation
✅ **RLS Policy Fix** - Added superadmin insert policy for transfer_requests
✅ **Pending Transfers** - Approve/reject functionality with validation
✅ **Transfer History** - Separate source/destination church columns with links
✅ **Single Transfers** - Individual transfer request form with member/church selection
✅ **Bulk Transfers** - Multi-member transfer tool with progress indicator
✅ **Transfer Detail View** - Complete request information with timeline
✅ **Consistent UI** - Matching table layouts across pending and history views
✅ **Error Handling** - Comprehensive validation and user feedback
✅ **Production Ready** - All features tested and working

### Technical Fixes:
- Fixed RLS policy: Added `Superadmin can create any transfer request` policy
- Fixed approve transfer: Removed `approved_by` from input validation schema
- Fixed table layouts: Separated combined church columns into distinct clickable columns
- Enhanced error logging: Added detailed error messages for debugging
- Code cleanup: Removed debug console.log statements after fixing issues

### Phase 3 Highlights:
✅ **Church Management UI** - Complete CRUD operations
✅ **Image Upload System** - Multi-image upload with Supabase Storage
✅ **Image Gallery** - Beautiful mosaic layouts with lightbox modal
✅ **Primary Image** - First image auto-designated as primary
✅ **Pagination Fix** - Preserves all filters across pages
✅ **Next.js Image Optimization** - All images optimized with Next.js Image component
✅ **Lint & Build Ready** - Zero errors, production-ready code

### Technical Improvements:
- Supabase Storage integration for church images
- Drag-and-drop upload with `react-dropzone`
- Responsive image gallery (1, 2, 3+ image layouts)
- Lightbox modal with navigation and thumbnails
- Image reordering (set primary image)
- Database migration for images array
- Automatic image_url sync trigger
- Next.js image domain configuration

