// Database types for Church App

export type UserRole = 'superadmin' | 'coordinator' | 'admin' | 'member';
export type PhysicalCondition = 'fit' | 'sickly';
export type SpiritualCondition = 'active' | 'inactive';
export type MemberStatus = 'active' | 'transferred_out' | 'resigned' | 'disfellowshipped' | 'deceased';
export type TransferStatus = 'pending' | 'approved' | 'rejected';
export type TransferType = 'transfer_in' | 'transfer_out';
export type EventType = 'service' | 'baptism' | 'conference' | 'social' | 'other';
export type ServiceType = 'sabbath_morning' | 'sabbath_afternoon' | 'prayer_meeting' | 'other';
export type AnnouncementTarget = 'all' | 'church_specific' | 'district_specific' | 'field_specific';
export type EventRegistrationStatus = 'registered' | 'attended' | 'no_show' | 'confirmed' | 'cancelled';
export type VisitorType = 'adult' | 'youth' | 'child';
export type FollowUpStatus = 'pending' | 'contacted' | 'interested' | 'not_interested' | 'converted';
export type ReferralSource = 'member_invitation' | 'online' | 'walk_in' | 'social_media' | 'other';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  church_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Church {
  id: string;
  name: string;
  field: string;
  district: string;
  city: string | null;
  province: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  images: string[];
  is_active: boolean;
  established_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  church_id: string;
  sp: string | null;
  full_name: string;
  birthday: string;
  age: number;
  date_of_baptism: string | null;
  baptized_by: string | null;
  physical_condition: PhysicalCondition;
  illness_description: string | null;
  spiritual_condition: SpiritualCondition;
  status: MemberStatus;
  resignation_date: string | null;
  disfellowship_date: string | null;
  date_of_death: string | null;
  cause_of_death: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransferRequest {
  id: string;
  member_id: string;
  from_church_id: string;
  to_church_id: string;
  request_date: string;
  status: TransferStatus;
  approved_by: string | null;
  approval_date: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransferHistory {
  id: string;
  member_id: string;
  from_church: string;
  to_church: string;
  from_church_id: string | null;
  to_church_id: string | null;
  transfer_date: string;
  transfer_type: TransferType;
  notes: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  church_id: string | null;
  title: string;
  description: string | null;
  event_type: EventType;
  start_date: string;
  end_date: string | null;
  location: string | null;
  image_url: string | null;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_audience: AnnouncementTarget;
  church_id: string | null;
  district: string | null;
  field: string | null;
  is_active: boolean;
  published_at: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  member_id: string | null;
  visitor_id: string | null;
  church_id: string;
  event_id: string | null;
  attendance_date: string;
  service_type: ServiceType;
  attended: boolean;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface Visitor {
  id: string;
  full_name: string;
  birthday: string | null;
  age: number | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string;
  is_baptized: boolean;
  date_of_baptism: string | null;
  baptized_at_church: string | null;
  baptized_at_country: string | null;
  associated_church_id: string | null;
  association_reason: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  relationship: string | null;
  visitor_type: VisitorType;
  is_accompanied_child: boolean;
  accompanied_by_member_id: string | null;
  accompanied_by_visitor_id: string | null;
  notes: string | null;
  referral_source: ReferralSource | null;
  first_visit_date: string | null;
  follow_up_status: FollowUpStatus;
  follow_up_notes: string | null;
  assigned_to_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  member_id: string | null;
  visitor_id: string | null;
  registered_at: string;
  registered_by: string;
  status: EventRegistrationStatus;
  attendance_confirmed_at: string | null;
  attendance_confirmed_by: string | null;
  final_confirmed_at: string | null;
  final_confirmed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Database schema type (generated by Supabase CLI or manually maintained)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      churches: {
        Row: Church;
        Insert: Omit<Church, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Church, 'id' | 'created_at'>>;
      };
      members: {
        Row: Member;
        Insert: Omit<Member, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Member, 'id' | 'created_at'>>;
      };
      transfer_requests: {
        Row: TransferRequest;
        Insert: Omit<TransferRequest, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TransferRequest, 'id' | 'created_at'>>;
      };
      transfer_history: {
        Row: TransferHistory;
        Insert: Omit<TransferHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<TransferHistory, 'id' | 'created_at'>>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Event, 'id' | 'created_at'>>;
      };
      announcements: {
        Row: Announcement;
        Insert: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Announcement, 'id' | 'created_at'>>;
      };
      attendance: {
        Row: Attendance;
        Insert: Omit<Attendance, 'id' | 'created_at'>;
        Update: Partial<Omit<Attendance, 'id' | 'created_at'>>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'>;
        Update: never;
      };
      event_registrations: {
        Row: EventRegistration;
        Insert: Omit<EventRegistration, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<EventRegistration, 'id' | 'created_at'>>;
      };
      visitors: {
        Row: Visitor;
        Insert: Omit<Visitor, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Visitor, 'id' | 'created_at'>>;
      };
    };
  };
}
