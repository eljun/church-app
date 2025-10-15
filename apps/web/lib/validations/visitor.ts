import { z } from 'zod'

// Visitor type schema
export const visitorTypeSchema = z.enum(['adult', 'youth', 'child'])

// Referral source schema
export const referralSourceSchema = z.enum([
  'member_invitation',
  'online',
  'walk_in',
  'social_media',
  'other',
])

// Follow-up status schema
export const followUpStatusSchema = z.enum([
  'pending',
  'contacted',
  'interested',
  'not_interested',
  'converted',
])

// Create visitor schema
export const createVisitorSchema = z.object({
  // Basic Information
  full_name: z.string().min(1, 'Full name is required'),
  birthday: z.string().nullable().optional(),
  age: z.number().int().min(0).max(150).nullable().optional(),
  gender: z.enum(['male', 'female', 'other']).nullable().optional(),

  // Contact Information
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address').nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  country: z.string().default('Philippines'),

  // Baptism Status
  is_baptized: z.boolean().default(false),
  date_of_baptism: z.string().nullable().optional(),
  baptized_at_church: z.string().nullable().optional(),
  baptized_at_country: z.string().nullable().optional(),

  // Church Association
  associated_church_id: z.string().uuid('Invalid church ID').nullable().optional(),
  association_reason: z.string().nullable().optional(),

  // Emergency Contact
  emergency_contact_name: z.string().nullable().optional(),
  emergency_contact_phone: z.string().nullable().optional(),
  relationship: z.string().nullable().optional(),

  // Visitor Type & Child Tracking
  visitor_type: visitorTypeSchema.default('adult'),
  is_accompanied_child: z.boolean().default(false),
  accompanied_by_member_id: z.string().uuid().nullable().optional(),
  accompanied_by_visitor_id: z.string().uuid().nullable().optional(),

  // Additional Info
  notes: z.string().nullable().optional(),
  referral_source: referralSourceSchema.nullable().optional(),
  first_visit_date: z.string().nullable().optional(),

  // Follow-up
  follow_up_status: followUpStatusSchema.default('pending'),
  follow_up_notes: z.string().nullable().optional(),
  assigned_to_user_id: z.string().uuid().nullable().optional(),
})
.refine(
  (data) => {
    // If baptized, must have baptism date
    if (data.is_baptized && !data.date_of_baptism) {
      return false
    }
    return true
  },
  {
    message: 'Baptism date is required when marked as baptized',
    path: ['date_of_baptism'],
  }
)
.refine(
  (data) => {
    // If accompanied child, must have either member or visitor parent
    if (
      data.is_accompanied_child &&
      !data.accompanied_by_member_id &&
      !data.accompanied_by_visitor_id
    ) {
      return false
    }
    return true
  },
  {
    message: 'Child must be accompanied by either a member or visitor',
    path: ['is_accompanied_child'],
  }
)
.refine(
  (data) => {
    // Cannot be accompanied by both member and visitor
    if (data.accompanied_by_member_id && data.accompanied_by_visitor_id) {
      return false
    }
    return true
  },
  {
    message: 'Child cannot be accompanied by both member and visitor',
    path: ['accompanied_by_member_id'],
  }
)
.refine(
  (data) => {
    // If child type, should be accompanied
    if (data.visitor_type === 'child' && !data.is_accompanied_child) {
      // Allow unaccompanied children (they might be with adults not in system)
      return true // Just a warning, not a hard error
    }
    return true
  }
)

// Update visitor schema (allows partial updates)
export const updateVisitorSchema = z.object({
  id: z.string().uuid('Invalid visitor ID'),
  // Basic Information
  full_name: z.string().min(1, 'Full name is required').optional(),
  birthday: z.string().nullable().optional(),
  age: z.number().int().min(0).max(150).nullable().optional(),
  gender: z.enum(['male', 'female', 'other']).nullable().optional(),

  // Contact Information
  phone: z.string().min(1, 'Phone number is required').optional(),
  email: z.string().email('Invalid email address').nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  country: z.string().optional(),

  // Baptism Status
  is_baptized: z.boolean().optional(),
  date_of_baptism: z.string().nullable().optional(),
  baptized_at_church: z.string().nullable().optional(),
  baptized_at_country: z.string().nullable().optional(),

  // Church Association
  associated_church_id: z.string().uuid('Invalid church ID').nullable().optional(),
  association_reason: z.string().nullable().optional(),

  // Emergency Contact
  emergency_contact_name: z.string().nullable().optional(),
  emergency_contact_phone: z.string().nullable().optional(),
  relationship: z.string().nullable().optional(),

  // Visitor Type & Child Tracking
  visitor_type: visitorTypeSchema.optional(),
  is_accompanied_child: z.boolean().optional(),
  accompanied_by_member_id: z.string().uuid().nullable().optional(),
  accompanied_by_visitor_id: z.string().uuid().nullable().optional(),

  // Additional Info
  notes: z.string().nullable().optional(),
  referral_source: referralSourceSchema.nullable().optional(),
  first_visit_date: z.string().nullable().optional(),

  // Follow-up
  follow_up_status: followUpStatusSchema.optional(),
  follow_up_notes: z.string().nullable().optional(),
  assigned_to_user_id: z.string().uuid().nullable().optional(),
})

// Register visitor for event schema
export const registerVisitorForEventSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  visitor_id: z.string().uuid('Invalid visitor ID'),
  notes: z.string().nullable().optional(),
})

// Create visitor and register for event (combined action)
export const createAndRegisterVisitorSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  visitor: createVisitorSchema,
  notes: z.string().nullable().optional(),
})

// Update follow-up status schema
export const updateFollowUpStatusSchema = z.object({
  visitor_id: z.string().uuid('Invalid visitor ID'),
  follow_up_status: followUpStatusSchema,
  follow_up_notes: z.string().nullable().optional(),
  assigned_to_user_id: z.string().uuid('Invalid user ID').nullable().optional(),
})

// Search/filter visitors schema
export const filterVisitorsSchema = z.object({
  church_id: z.string().uuid().optional(),
  visitor_type: visitorTypeSchema.optional(),
  is_baptized: z.boolean().optional(),
  follow_up_status: followUpStatusSchema.optional(),
  referral_source: referralSourceSchema.optional(),
  search: z.string().optional(), // Search by name
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
})

// Type exports
export type CreateVisitorInput = z.infer<typeof createVisitorSchema>
export type UpdateVisitorInput = z.infer<typeof updateVisitorSchema>
export type RegisterVisitorForEventInput = z.infer<typeof registerVisitorForEventSchema>
export type CreateAndRegisterVisitorInput = z.infer<typeof createAndRegisterVisitorSchema>
export type UpdateFollowUpStatusInput = z.infer<typeof updateFollowUpStatusSchema>
export type FilterVisitorsInput = z.infer<typeof filterVisitorsSchema>
