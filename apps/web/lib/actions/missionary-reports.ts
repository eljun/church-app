'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createMissionaryReportSchema,
  updateMissionaryReportSchema,
  duplicateReportSchema,
  type CreateMissionaryReportInput,
  type UpdateMissionaryReportInput,
  type DuplicateReportInput,
} from '@/lib/validations/missionary-report'
import { getMissionaryReportByDate, getLastMissionaryReport } from '@/lib/queries/missionary-reports'

/**
 * Create a new missionary report
 */
export async function createMissionaryReport(input: CreateMissionaryReportInput) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Validate input
    const validatedData = createMissionaryReportSchema.parse(input)

    // Check if report already exists for this church, date, and type
    const existingReport = await getMissionaryReportByDate(
      validatedData.church_id,
      validatedData.report_date,
      validatedData.report_type
    )

    if (existingReport) {
      return {
        error: `A ${validatedData.report_type} report already exists for this church on ${validatedData.report_date}`,
      }
    }

    // Insert missionary report
    const { data, error } = await supabase
      .from('missionary_reports')
      .insert([
        {
          ...validatedData,
          reported_by: user.id,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating missionary report:', error)
      return { error: `Failed to create missionary report: ${error.message}` }
    }

    revalidatePath('/missionary-reports')
    return { data }
  } catch (error) {
    console.error('Error in createMissionaryReport:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Update an existing missionary report
 */
export async function updateMissionaryReport(input: UpdateMissionaryReportInput) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Validate input
    const validatedData = updateMissionaryReportSchema.parse(input)
    const { id, ...updateData } = validatedData

    // Update missionary report
    const { data, error } = await supabase
      .from('missionary_reports')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating missionary report:', error)
      return { error: `Failed to update missionary report: ${error.message}` }
    }

    revalidatePath('/missionary-reports')
    revalidatePath(`/missionary-reports/${id}`)
    return { data }
  } catch (error) {
    console.error('Error in updateMissionaryReport:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a missionary report
 */
export async function deleteMissionaryReport(reportId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Get user role to check permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, church_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return { error: 'Failed to verify user permissions' }
    }

    // Get the report to check ownership
    const { data: report, error: reportError } = await supabase
      .from('missionary_reports')
      .select('church_id, reported_by')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return { error: 'Report not found' }
    }

    // Check permissions:
    // - Superadmin: can delete any report
    // - Admin: can delete reports from their church
    // - Pastor: can delete reports from their district/field/assigned churches (checked by RLS)
    // - Bibleworker: can delete only their own reports
    const canDelete =
      userData.role === 'superadmin' ||
      (userData.role === 'admin' && userData.church_id === report.church_id) ||
      userData.role === 'pastor' ||
      (userData.role === 'bibleworker' && report.reported_by === user.id)

    if (!canDelete) {
      return { error: 'You do not have permission to delete this report' }
    }

    // Delete the report
    const { error: deleteError } = await supabase
      .from('missionary_reports')
      .delete()
      .eq('id', reportId)

    if (deleteError) {
      console.error('Error deleting missionary report:', deleteError)
      return { error: `Failed to delete missionary report: ${deleteError.message}` }
    }

    revalidatePath('/missionary-reports')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteMissionaryReport:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Duplicate a missionary report (copy previous report as template)
 */
export async function duplicateMissionaryReport(input: DuplicateReportInput) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Validate input
    const validatedData = duplicateReportSchema.parse(input)

    // Get the source report
    const { data: sourceReport, error: sourceError } = await supabase
      .from('missionary_reports')
      .select('*')
      .eq('id', validatedData.source_report_id)
      .single()

    if (sourceError || !sourceReport) {
      return { error: 'Source report not found' }
    }

    // Check if report already exists for the new date
    const existingReport = await getMissionaryReportByDate(
      sourceReport.church_id,
      validatedData.new_report_date,
      validatedData.new_report_type
    )

    if (existingReport) {
      return {
        error: `A ${validatedData.new_report_type} report already exists for this church on ${validatedData.new_report_date}`,
      }
    }

    // Create new report with data from source report
    const { data, error } = await supabase
      .from('missionary_reports')
      .insert([
        {
          church_id: sourceReport.church_id,
          report_date: validatedData.new_report_date,
          report_type: validatedData.new_report_type,
          bible_studies_given: sourceReport.bible_studies_given,
          home_visits: sourceReport.home_visits,
          seminars_conducted: sourceReport.seminars_conducted,
          conferences_conducted: sourceReport.conferences_conducted,
          public_lectures: sourceReport.public_lectures,
          pamphlets_distributed: sourceReport.pamphlets_distributed,
          books_distributed: sourceReport.books_distributed,
          magazines_distributed: sourceReport.magazines_distributed,
          youth_anchor: sourceReport.youth_anchor,
          // Don't copy notes, highlights, challenges - user should add new ones
          notes: null,
          highlights: null,
          challenges: null,
          reported_by: user.id,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error duplicating missionary report:', error)
      return { error: `Failed to duplicate missionary report: ${error.message}` }
    }

    revalidatePath('/missionary-reports')
    return { data }
  } catch (error) {
    console.error('Error in duplicateMissionaryReport:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get last report for copying (server action wrapper)
 */
export async function getLastReportForCopy(churchId: string, reportType: 'weekly' | 'biennial' | 'triennial') {
  try {
    const data = await getLastMissionaryReport(churchId, reportType)
    return { data }
  } catch (error) {
    console.error('Error getting last report:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to get last report' }
  }
}
