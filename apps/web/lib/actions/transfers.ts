/**
 * Transfer Request Server Actions
 * Mutations for transfer request data
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createTransferRequestSchema, approveTransferSchema, rejectTransferSchema } from '@/lib/validations/transfer'
import type { CreateTransferRequestInput, ApproveTransferInput, RejectTransferInput } from '@/lib/validations/transfer'

/**
 * Create a transfer request
 */
export async function createTransferRequest(input: CreateTransferRequestInput) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, church_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return { error: 'User not found' }
    }

    // Validate input
    const validated = createTransferRequestSchema.parse(input)

    // Check permissions - can only transfer from your church
    if (userData.role === 'admin' && validated.from_church_id !== userData.church_id) {
      return { error: 'Forbidden: Can only transfer members from your church' }
    }

    // Check if member exists and belongs to from_church
    const { data: member } = await supabase
      .from('members')
      .select('*')
      .eq('id', validated.member_id)
      .single()

    if (!member) {
      return { error: 'Member not found' }
    }

    if (member.church_id !== validated.from_church_id) {
      return { error: 'Member does not belong to the source church' }
    }

    // Check for existing pending transfer
    const { data: existingTransfer } = await supabase
      .from('transfer_requests')
      .select('*')
      .eq('member_id', validated.member_id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingTransfer) {
      return { error: 'There is already a pending transfer request for this member' }
    }

    // Create transfer request
    const { data: transferRequest, error } = await supabase
      .from('transfer_requests')
      .insert(validated)
      .select()
      .single()

    if (error) {
      return { error: `Failed to create transfer: ${error.message}` }
    }

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'created_transfer_request',
      table_name: 'transfer_requests',
      record_id: transferRequest.id,
      new_values: validated,
    })

    revalidatePath('/dashboard/transfers')
    revalidatePath('/dashboard/members')

    return { data: transferRequest }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to create transfer request' }
  }
}

/**
 * Approve a transfer request
 */
export async function approveTransferRequest(input: ApproveTransferInput) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, church_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return { error: 'User not found' }
    }

    // Validate input
    const validated = approveTransferSchema.parse(input)

    // Get transfer request
    const { data: transferRequest } = await supabase
      .from('transfer_requests')
      .select('*')
      .eq('id', validated.transfer_request_id)
      .single()

    if (!transferRequest) {
      return { error: 'Transfer request not found' }
    }

    // Check permissions - can only approve transfers TO your church
    if (userData.role === 'admin' && transferRequest.to_church_id !== userData.church_id) {
      return { error: 'Forbidden: Can only approve transfers to your church' }
    }

    if (transferRequest.status !== 'pending') {
      return { error: 'Transfer request is not pending' }
    }

    // IMPORTANT: Update member's church FIRST (while transfer is still 'pending')
    // The RLS policy checks that the transfer status is 'pending'
    const { data: updateData, error: memberError } = await supabase
      .from('members')
      .update({ church_id: transferRequest.to_church_id })
      .eq('id', transferRequest.member_id)
      .select()

    if (memberError) {
      return { error: `Failed to update member church: ${memberError.message}` }
    }

    // Check if the update actually happened
    if (!updateData || updateData.length === 0) {
      return { error: 'Failed to update member church - RLS policy may be blocking the update. Please ensure the migration 005 has been applied.' }
    }

    // Now update transfer request to 'approved' (after member is already transferred)
    const { error: updateError } = await supabase
      .from('transfer_requests')
      .update({
        status: 'approved',
        approved_by: user.id,
        approval_date: new Date().toISOString(),
      })
      .eq('id', validated.transfer_request_id)

    if (updateError) {
      return { error: updateError.message }
    }

    // Get church names for history
    const [{ data: fromChurch }, { data: toChurch }] = await Promise.all([
      supabase.from('churches').select('name').eq('id', transferRequest.from_church_id).single(),
      supabase.from('churches').select('name').eq('id', transferRequest.to_church_id).single(),
    ])

    // Create transfer history record
    await supabase.from('transfer_history').insert({
      member_id: transferRequest.member_id,
      from_church: fromChurch?.name || 'Unknown',
      to_church: toChurch?.name || 'Unknown',
      from_church_id: transferRequest.from_church_id,
      to_church_id: transferRequest.to_church_id,
      transfer_date: new Date().toISOString().split('T')[0],
      transfer_type: 'transfer_in',
    })

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'approved_transfer_request',
      table_name: 'transfer_requests',
      record_id: validated.transfer_request_id,
      new_values: { status: 'approved' },
    })

    revalidatePath('/dashboard/transfers')
    revalidatePath('/dashboard/members')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to approve transfer request' }
  }
}

/**
 * Reject a transfer request
 */
export async function rejectTransferRequest(input: RejectTransferInput) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, church_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return { error: 'User not found' }
    }

    // Validate input
    const validated = rejectTransferSchema.parse(input)

    // Get transfer request
    const { data: transferRequest } = await supabase
      .from('transfer_requests')
      .select('*')
      .eq('id', validated.transfer_request_id)
      .single()

    if (!transferRequest) {
      return { error: 'Transfer request not found' }
    }

    // Check permissions - can only reject transfers TO your church
    if (userData.role === 'admin' && transferRequest.to_church_id !== userData.church_id) {
      return { error: 'Forbidden: Can only reject transfers to your church' }
    }

    if (transferRequest.status !== 'pending') {
      return { error: 'Transfer request is not pending' }
    }

    // Update transfer request
    const { error } = await supabase
      .from('transfer_requests')
      .update({
        status: 'rejected',
        rejection_reason: validated.rejection_reason,
      })
      .eq('id', validated.transfer_request_id)

    if (error) {
      return { error: error.message }
    }

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'rejected_transfer_request',
      table_name: 'transfer_requests',
      record_id: validated.transfer_request_id,
      new_values: { status: 'rejected', rejection_reason: validated.rejection_reason },
    })

    revalidatePath('/dashboard/transfers')

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to reject transfer request' }
  }
}
