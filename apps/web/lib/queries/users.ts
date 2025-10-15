/**
 * User Queries
 * Functions to fetch user data for user management
 */

import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/validations/user'

export interface UserWithChurch {
  id: string
  email: string
  role: UserRole
  church_id: string | null
  district_id: string | null
  field_id: string | null
  assigned_member_ids: string[]
  created_at: string
  updated_at: string
  churches?: {
    id: string
    name: string
    district: string
    field: string
  } | null
}

/**
 * Get all users with pagination and filtering (superadmin only)
 */
export async function getUsers(params?: {
  limit?: number
  offset?: number
  role?: UserRole
  church_id?: string
  query?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check if user is superadmin
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentUser || currentUser.role !== 'superadmin') {
    throw new Error('Unauthorized: Superadmin access required')
  }

  // Build query
  let query = supabase
    .from('users')
    .select(`
      *,
      churches:church_id (
        id,
        name,
        district,
        field
      )
    `, { count: 'exact' })

  // Apply filters
  if (params?.role) {
    query = query.eq('role', params.role)
  }

  if (params?.church_id) {
    query = query.eq('church_id', params.church_id)
  }

  if (params?.query) {
    query = query.ilike('email', `%${params.query}%`)
  }

  // Pagination
  const limit = params?.limit || 50
  const offset = params?.offset || 0

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: (data || []) as UserWithChurch[],
    count: count || 0,
    limit,
    offset,
  }
}

/**
 * Get a single user by ID (superadmin only)
 */
export async function getUserById(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check if user is superadmin
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentUser || currentUser.role !== 'superadmin') {
    throw new Error('Unauthorized: Superadmin access required')
  }

  const { data: targetUser, error } = await supabase
    .from('users')
    .select(`
      *,
      churches:church_id (
        id,
        name,
        district,
        field
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  if (!targetUser) throw new Error('User not found')

  return targetUser as UserWithChurch
}

/**
 * Get members that can be assigned to bibleworkers
 */
export async function getAssignableMembers(churchId?: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  let query = supabase
    .from('members')
    .select('id, full_name, church_id, churches:church_id(name)')
    .eq('status', 'active')
    .order('full_name', { ascending: true })

  if (churchId) {
    query = query.eq('church_id', churchId)
  }

  const { data, error } = await query

  if (error) throw error

  return data || []
}

/**
 * Get user statistics (superadmin only)
 */
export async function getUserStats() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check if user is superadmin
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentUser || currentUser.role !== 'superadmin') {
    throw new Error('Unauthorized: Superadmin access required')
  }

  // Get counts by role
  const { data, error } = await supabase
    .from('users')
    .select('role')

  if (error) throw error

  const stats = {
    total: data?.length || 0,
    superadmin: data?.filter(u => u.role === 'superadmin').length || 0,
    coordinator: data?.filter(u => u.role === 'coordinator').length || 0,
    pastor: data?.filter(u => u.role === 'pastor').length || 0,
    bibleworker: data?.filter(u => u.role === 'bibleworker').length || 0,
    admin: data?.filter(u => u.role === 'admin').length || 0,
    member: data?.filter(u => u.role === 'member').length || 0,
  }

  return stats
}
