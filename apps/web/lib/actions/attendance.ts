'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  recordAttendanceSchema,
  recordBulkAttendanceSchema,
  updateAttendanceSchema,
  type RecordAttendanceInput,
  type RecordBulkAttendanceInput,
  type UpdateAttendanceInput,
} from '@/lib/validations/attendance'

/**
 * Record single attendance for a member or visitor
 */
export async function recordAttendance(input: RecordAttendanceInput) {
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
    const validatedData = recordAttendanceSchema.parse(input)

    // Check if attendance already exists
    let existingQuery = supabase
      .from('attendance')
      .select('id')
      .eq('church_id', validatedData.church_id)
      .eq('attendance_date', validatedData.attendance_date)
      .eq('service_type', validatedData.service_type)
      .is('event_id', null)

    if (validatedData.member_id) {
      existingQuery = existingQuery.eq('member_id', validatedData.member_id)
    } else if (validatedData.visitor_id) {
      existingQuery = existingQuery.eq('visitor_id', validatedData.visitor_id)
    }

    const { data: existing } = await existingQuery.maybeSingle()

    if (existing) {
      return { error: 'Attendance already recorded for this person on this date and service' }
    }

    // Insert attendance record
    const { data, error } = await supabase
      .from('attendance')
      .insert([
        {
          ...validatedData,
          event_id: null, // Weekly service, not event
          recorded_by: user.id,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error recording attendance:', error)
      return { error: `Failed to record attendance: ${error.message}` }
    }

    revalidatePath('/attendance')
    return { data }
  } catch (error) {
    console.error('Error in recordAttendance:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Record bulk attendance for multiple members/visitors
 */
export async function recordBulkAttendance(input: RecordBulkAttendanceInput) {
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
    const validatedData = recordBulkAttendanceSchema.parse(input)

    // Check for existing attendance records
    const allIds = [
      ...validatedData.member_ids.map(id => ({ member_id: id, visitor_id: null })),
      ...validatedData.visitor_ids.map(id => ({ member_id: null, visitor_id: id })),
    ]

    // Get existing attendance to avoid duplicates
    const { data: existing } = await supabase
      .from('attendance')
      .select('member_id, visitor_id')
      .eq('church_id', validatedData.church_id)
      .eq('attendance_date', validatedData.attendance_date)
      .eq('service_type', validatedData.service_type)
      .is('event_id', null)

    const existingSet = new Set(
      existing?.map(e => e.member_id || e.visitor_id) || []
    )

    // Filter out existing records
    const newRecords = allIds.filter(record => {
      const id = record.member_id || record.visitor_id
      return !existingSet.has(id)
    })

    if (newRecords.length === 0) {
      return { error: 'All selected attendees already have attendance records for this date and service' }
    }

    // Prepare bulk insert
    const attendanceRecords = newRecords.map(record => ({
      church_id: validatedData.church_id,
      member_id: record.member_id,
      visitor_id: record.visitor_id,
      attendance_date: validatedData.attendance_date,
      service_type: validatedData.service_type,
      attended: true,
      notes: validatedData.notes,
      event_id: null,
      recorded_by: user.id,
    }))

    // Insert all records
    const { data, error } = await supabase
      .from('attendance')
      .insert(attendanceRecords)
      .select()

    if (error) {
      console.error('Error recording bulk attendance:', error)
      return { error: `Failed to record attendance: ${error.message}` }
    }

    revalidatePath('/attendance')
    return {
      data,
      message: `Successfully recorded attendance for ${data?.length || 0} attendee(s)`,
    }
  } catch (error) {
    console.error('Error in recordBulkAttendance:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Update an existing attendance record
 */
export async function updateAttendance(input: UpdateAttendanceInput) {
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
    const validatedData = updateAttendanceSchema.parse(input)

    const { id, ...updates } = validatedData

    // Update attendance record
    const { data, error } = await supabase
      .from('attendance')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating attendance:', error)
      return { error: `Failed to update attendance: ${error.message}` }
    }

    revalidatePath('/attendance')
    return { data }
  } catch (error) {
    console.error('Error in updateAttendance:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Delete an attendance record
 */
export async function deleteAttendance(attendanceId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Delete attendance record
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', attendanceId)

    if (error) {
      console.error('Error deleting attendance:', error)
      return { error: `Failed to delete attendance: ${error.message}` }
    }

    revalidatePath('/attendance')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteAttendance:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'An unexpected error occurred' }
  }
}
