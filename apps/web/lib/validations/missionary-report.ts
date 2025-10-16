import { z } from 'zod'

// Report type enum
export const reportTypeSchema = z.enum(['weekly', 'biennial', 'triennial'])

// Create missionary report
export const createMissionaryReportSchema = z.object({
  church_id: z.string().uuid('Invalid church ID'),
  report_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  report_type: reportTypeSchema.default('weekly'),

  // Missionary metrics
  bible_studies_given: z.number().int().min(0, 'Must be 0 or greater').default(0),
  home_visits: z.number().int().min(0, 'Must be 0 or greater').default(0),
  seminars_conducted: z.number().int().min(0, 'Must be 0 or greater').default(0),
  conferences_conducted: z.number().int().min(0, 'Must be 0 or greater').default(0),
  public_lectures: z.number().int().min(0, 'Must be 0 or greater').default(0),
  pamphlets_distributed: z.number().int().min(0, 'Must be 0 or greater').default(0),
  books_distributed: z.number().int().min(0, 'Must be 0 or greater').default(0),
  magazines_distributed: z.number().int().min(0, 'Must be 0 or greater').default(0),
  youth_anchor: z.number().int().min(0, 'Must be 0 or greater').default(0),

  // Optional fields
  notes: z.string().optional().nullable(),
  highlights: z.string().optional().nullable(),
  challenges: z.string().optional().nullable(),
}).refine(
  (data) => {
    // At least one metric must be greater than 0
    const totalActivities =
      data.bible_studies_given +
      data.home_visits +
      data.seminars_conducted +
      data.conferences_conducted +
      data.public_lectures +
      data.pamphlets_distributed +
      data.books_distributed +
      data.magazines_distributed +
      data.youth_anchor

    return totalActivities > 0
  },
  {
    message: 'At least one activity metric must be greater than 0',
    path: ['bible_studies_given'], // Show error on first field
  }
)

// Update missionary report
export const updateMissionaryReportSchema = z.object({
  id: z.string().uuid('Invalid report ID'),
  church_id: z.string().uuid('Invalid church ID').optional(),
  report_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  report_type: reportTypeSchema.optional(),

  // Missionary metrics (all optional for updates)
  bible_studies_given: z.number().int().min(0, 'Must be 0 or greater').optional(),
  home_visits: z.number().int().min(0, 'Must be 0 or greater').optional(),
  seminars_conducted: z.number().int().min(0, 'Must be 0 or greater').optional(),
  conferences_conducted: z.number().int().min(0, 'Must be 0 or greater').optional(),
  public_lectures: z.number().int().min(0, 'Must be 0 or greater').optional(),
  pamphlets_distributed: z.number().int().min(0, 'Must be 0 or greater').optional(),
  books_distributed: z.number().int().min(0, 'Must be 0 or greater').optional(),
  magazines_distributed: z.number().int().min(0, 'Must be 0 or greater').optional(),
  youth_anchor: z.number().int().min(0, 'Must be 0 or greater').optional(),

  // Optional fields
  notes: z.string().optional().nullable(),
  highlights: z.string().optional().nullable(),
  challenges: z.string().optional().nullable(),
})

// Filter missionary reports
export const filterMissionaryReportsSchema = z.object({
  church_id: z.string().uuid('Invalid church ID').optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  report_type: reportTypeSchema.optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
})

// Duplicate report (copy from existing)
export const duplicateReportSchema = z.object({
  source_report_id: z.string().uuid('Invalid source report ID'),
  new_report_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  new_report_type: reportTypeSchema.default('weekly'),
})

// Type exports
export type CreateMissionaryReportInput = z.infer<typeof createMissionaryReportSchema>
export type UpdateMissionaryReportInput = z.infer<typeof updateMissionaryReportSchema>
export type FilterMissionaryReportsInput = z.infer<typeof filterMissionaryReportsSchema>
export type DuplicateReportInput = z.infer<typeof duplicateReportSchema>
