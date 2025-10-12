# Church App Database Schema

## Core Tables

### 1. users
Authentication and user management
```sql
- id: uuid (PK, references auth.users)
- email: text (unique)
- role: enum ('superadmin', 'admin', 'member')
- church_id: uuid (FK -> churches.id, nullable for superadmin)
- created_at: timestamptz
- updated_at: timestamptz
```

### 2. churches
Church locations and details
```sql
- id: uuid (PK)
- name: text
- field: text
- district: text
- city: text (nullable)
- province: text (nullable)
- address: text (nullable)
- latitude: decimal (nullable)
- longitude: decimal (nullable)
- image_url: text (nullable)
- is_active: boolean (default true)
- established_date: date (nullable)
- created_at: timestamptz
- updated_at: timestamptz
```

### 3. members
Member information
```sql
- id: uuid (PK)
- church_id: uuid (FK -> churches.id)
- sp: text (nullable, from CSV - unclear meaning, keep for now)
- full_name: text
- birthday: date
- age: integer (computed or stored)
- date_of_baptism: date (nullable)
- baptized_by: text (nullable)
- physical_condition: enum ('fit', 'sickly')
- illness_description: text (nullable)
- spiritual_condition: enum ('active', 'inactive')
- status: enum ('active', 'transferred_out', 'resigned', 'disfellowshipped', 'deceased')
- resignation_date: date (nullable)
- disfellowship_date: date (nullable)
- date_of_death: date (nullable)
- cause_of_death: text (nullable)
- created_at: timestamptz
- updated_at: timestamptz
```

### 4. transfer_requests
Member transfer between churches
```sql
- id: uuid (PK)
- member_id: uuid (FK -> members.id)
- from_church_id: uuid (FK -> churches.id)
- to_church_id: uuid (FK -> churches.id)
- request_date: timestamptz
- status: enum ('pending', 'approved', 'rejected')
- approved_by: uuid (FK -> users.id, nullable)
- approval_date: timestamptz (nullable)
- rejection_reason: text (nullable)
- notes: text (nullable)
- created_at: timestamptz
- updated_at: timestamptz
```

### 5. transfer_history
Historical record of all transfers
```sql
- id: uuid (PK)
- member_id: uuid (FK -> members.id)
- from_church: text (can be external church name)
- to_church: text (can be external church name)
- from_church_id: uuid (FK -> churches.id, nullable)
- to_church_id: uuid (FK -> churches.id, nullable)
- transfer_date: date
- transfer_type: enum ('transfer_in', 'transfer_out')
- notes: text (nullable)
- created_at: timestamptz
```

### 6. events
Church events and activities
```sql
- id: uuid (PK)
- church_id: uuid (FK -> churches.id, nullable for global events)
- title: text
- description: text (nullable)
- event_type: enum ('service', 'baptism', 'conference', 'social', 'other')
- start_date: timestamptz
- end_date: timestamptz (nullable)
- location: text (nullable)
- image_url: text (nullable)
- is_public: boolean (default true, visible to members)
- created_by: uuid (FK -> users.id)
- created_at: timestamptz
- updated_at: timestamptz
```

### 7. announcements
Communication to members
```sql
- id: uuid (PK)
- title: text
- content: text
- target_audience: enum ('all', 'church_specific', 'district_specific', 'field_specific')
- church_id: uuid (FK -> churches.id, nullable)
- district: text (nullable)
- field: text (nullable)
- is_active: boolean (default true)
- published_at: timestamptz (nullable)
- expires_at: timestamptz (nullable)
- created_by: uuid (FK -> users.id)
- created_at: timestamptz
- updated_at: timestamptz
```

### 8. attendance
Track service attendance
```sql
- id: uuid (PK)
- member_id: uuid (FK -> members.id)
- church_id: uuid (FK -> churches.id)
- event_id: uuid (FK -> events.id, nullable)
- attendance_date: date
- service_type: enum ('sabbath_morning', 'sabbath_afternoon', 'prayer_meeting', 'other')
- notes: text (nullable)
- created_at: timestamptz
```

### 9. audit_logs
Track sensitive operations
```sql
- id: uuid (PK)
- user_id: uuid (FK -> users.id)
- action: text (e.g., 'created_member', 'approved_transfer', 'deleted_member')
- table_name: text
- record_id: uuid
- old_values: jsonb (nullable)
- new_values: jsonb (nullable)
- ip_address: inet (nullable)
- user_agent: text (nullable)
- created_at: timestamptz
```

## Enums

```sql
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'member');
CREATE TYPE physical_condition AS ENUM ('fit', 'sickly');
CREATE TYPE spiritual_condition AS ENUM ('active', 'inactive');
CREATE TYPE member_status AS ENUM ('active', 'transferred_out', 'resigned', 'disfellowshipped', 'deceased');
CREATE TYPE transfer_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE transfer_type AS ENUM ('transfer_in', 'transfer_out');
CREATE TYPE event_type AS ENUM ('service', 'baptism', 'conference', 'social', 'other');
CREATE TYPE service_type AS ENUM ('sabbath_morning', 'sabbath_afternoon', 'prayer_meeting', 'other');
CREATE TYPE announcement_target AS ENUM ('all', 'church_specific', 'district_specific', 'field_specific');
```

## Indexes

```sql
-- Members
CREATE INDEX idx_members_church_id ON members(church_id);
CREATE INDEX idx_members_spiritual_condition ON members(spiritual_condition);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_baptism_date ON members(date_of_baptism);

-- Transfer requests
CREATE INDEX idx_transfer_requests_status ON transfer_requests(status);
CREATE INDEX idx_transfer_requests_to_church ON transfer_requests(to_church_id);
CREATE INDEX idx_transfer_requests_from_church ON transfer_requests(from_church_id);

-- Churches
CREATE INDEX idx_churches_district ON churches(district);
CREATE INDEX idx_churches_field ON churches(field);
CREATE INDEX idx_churches_is_active ON churches(is_active);

-- Attendance
CREATE INDEX idx_attendance_member_id ON attendance(member_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_church_id ON attendance(church_id);

-- Audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

## Row Level Security (RLS) Policies

### Superadmin
- Full access to all tables

### Admin
- Read/Write access to members in their church
- Read access to all churches
- Can create transfer requests for their members
- Can approve incoming transfer requests to their church
- Read/Write events for their church
- Create announcements for their church

### Member (Mobile app users)
- Read-only access to public churches
- Read-only access to public events
- Read-only access to public announcements
- No access to member data (privacy)

## Notes
- All timestamps use `timestamptz` for proper timezone handling
- Soft deletes not implemented initially - can add `deleted_at` column later if needed
- The `sp` field from CSV is kept for migration purposes (needs clarification on meaning)
- Age can be computed from birthday, but stored for performance
- Transfer history maintains both text fields (for external churches) and FK (for internal churches)
