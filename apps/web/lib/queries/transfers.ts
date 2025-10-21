/**
 * Transfer Request Queries
 * Functions to fetch transfer request data
 */

import { createClient } from '@/lib/supabase/server'
import { getScopeChurches } from '@/lib/rbac'

/**
 * Get all transfer requests with filtering
 */
export async function getTransferRequests(status?: 'pending' | 'approved' | 'rejected') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Get allowed church IDs based on role
  const allowedChurchIds = await getScopeChurches(user.id, userData.role)

  // Build query
  let query = supabase
    .from('transfer_requests')
    .select(`
      *,
      members(*),
      from_church:churches!transfer_requests_from_church_id_fkey(*),
      to_church:churches!transfer_requests_to_church_id_fkey(*),
      approver:users!transfer_requests_approved_by_fkey(email, role)
    `)

  // Apply scope filter (CRITICAL)
  // For transfers, we need to see transfers where either from_church OR to_church is in allowed scope
  if (allowedChurchIds !== null) {
    query = query.or(`from_church_id.in.(${allowedChurchIds.join(',')}),to_church_id.in.(${allowedChurchIds.join(',')})`)
  }

  // Status filter
  if (status) {
    query = query.eq('status', status)
  }

  query = query.order('request_date', { ascending: false })

  const { data, error } = await query

  if (error) throw error

  return data || []
}

/**
 * Get pending transfer requests for admin's church (incoming)
 */
export async function getPendingIncomingTransfers() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData || !userData.church_id) throw new Error('User not found')

  const { data, error } = await supabase
    .from('transfer_requests')
    .select(`
      *,
      members(*),
      from_church:churches!transfer_requests_from_church_id_fkey(*),
      to_church:churches!transfer_requests_to_church_id_fkey(*)
    `)
    .eq('to_church_id', userData.church_id)
    .eq('status', 'pending')
    .order('request_date', { ascending: false })

  if (error) throw error

  return data || []
}

/**
 * Get a single transfer request by ID
 */
export async function getTransferRequestById(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  const { data: transfer, error } = await supabase
    .from('transfer_requests')
    .select(`
      *,
      members(*),
      from_church:churches!transfer_requests_from_church_id_fkey(*),
      to_church:churches!transfer_requests_to_church_id_fkey(*),
      approver:users!transfer_requests_approved_by_fkey(email, role)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  if (!transfer) throw new Error('Transfer request not found')

  // Check permissions
  if (userData.role === 'church_secretary') {
    const hasAccess =
      transfer.from_church_id === userData.church_id ||
      transfer.to_church_id === userData.church_id

    if (!hasAccess) {
      throw new Error('Forbidden: Cannot access this transfer request')
    }
  }

  return transfer
}

/**
 * Get transfer history for all churches
 */
export async function getTransferHistory(limit = 50) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Get allowed church IDs based on role
  const allowedChurchIds = await getScopeChurches(user.id, userData.role)

  // Build query
  let query = supabase
    .from('transfer_history')
    .select('*, members(*)')
    .order('transfer_date', { ascending: false })
    .limit(limit)

  // Apply scope filter (CRITICAL)
  // For transfer history, we need to see transfers where either from_church OR to_church is in allowed scope
  if (allowedChurchIds !== null) {
    query = query.or(`from_church_id.in.(${allowedChurchIds.join(',')}),to_church_id.in.(${allowedChurchIds.join(',')})`)
  }

  const { data, error } = await query

  if (error) throw error

  return data || []
}
