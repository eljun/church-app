/**
 * Church Queries
 * Functions to fetch church data
 */

import { createClient } from '@/lib/supabase/server'
import type { SearchChurchesInput } from '@/lib/validations/church'
import { getScopeChurches } from '@/lib/rbac'

/**
 * Get all churches with pagination and filtering
 */
export async function getChurches(params?: SearchChurchesInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get user's role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Get allowed church IDs based on role
  const allowedChurchIds = await getScopeChurches(user.id, userData.role)

  // Build query
  let query = supabase
    .from('churches')
    .select('*', { count: 'exact' })

  // Apply scope filter (CRITICAL)
  // For churches, we filter by the church IDs themselves
  if (allowedChurchIds !== null) {
    if (allowedChurchIds.length === 0) {
      // User has no churches assigned - return empty
      return { data: [], count: 0, limit: params?.limit || 50, offset: params?.offset || 0 }
    }
    query = query.in('id', allowedChurchIds)
  }

  // Apply filters
  if (params?.query) {
    query = query.ilike('name', `%${params.query}%`)
  }

  if (params?.field) {
    query = query.eq('field', params.field)
  }

  if (params?.district) {
    query = query.eq('district', params.district)
  }

  if (params?.is_active !== undefined) {
    query = query.eq('is_active', params.is_active)
  }

  // Pagination
  const limit = params?.limit || 50
  const offset = params?.offset || 0

  query = query
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: data || [],
    count: count || 0,
    limit,
    offset,
  }
}

/**
 * Get a single church by ID
 */
export async function getChurchById(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: church, error } = await supabase
    .from('churches')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  if (!church) throw new Error('Church not found')

  return church
}

/**
 * Get unique countries (for filters)
 */
export async function getCountries() {
  const supabase = await createClient()

  // Get current user and their allowed churches
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Get allowed church IDs based on role
  const allowedChurchIds = await getScopeChurches(user.id, userData.role)

  let query = supabase
    .from('churches')
    .select('country')
    .order('country', { ascending: true })

  // Apply scope filter (CRITICAL)
  if (allowedChurchIds !== null) {
    query = query.in('id', allowedChurchIds)
  }

  const { data, error } = await query

  if (error) throw error

  // Get unique countries, filter out null/undefined
  const uniqueCountries = [...new Set(data?.map(c => c.country).filter(Boolean))]

  return uniqueCountries
}

/**
 * Get unique fields (for filters)
 */
export async function getFields() {
  const supabase = await createClient()

  // Get current user and their allowed churches
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Get allowed church IDs based on role
  const allowedChurchIds = await getScopeChurches(user.id, userData.role)

  let query = supabase
    .from('churches')
    .select('field')
    .order('field', { ascending: true })

  // Apply scope filter (CRITICAL)
  if (allowedChurchIds !== null) {
    query = query.in('id', allowedChurchIds)
  }

  const { data, error } = await query

  if (error) throw error

  // Get unique fields
  const uniqueFields = [...new Set(data?.map(c => c.field))]

  return uniqueFields
}

/**
 * Get unique districts (for filters)
 */
export async function getDistricts() {
  const supabase = await createClient()

  // Get current user and their allowed churches
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Get allowed church IDs based on role
  const allowedChurchIds = await getScopeChurches(user.id, userData.role)

  let query = supabase
    .from('churches')
    .select('district')
    .order('district', { ascending: true })

  // Apply scope filter (CRITICAL)
  if (allowedChurchIds !== null) {
    query = query.in('id', allowedChurchIds)
  }

  const { data, error } = await query

  if (error) throw error

  // Get unique districts
  const uniqueDistricts = [...new Set(data?.map(c => c.district))]

  return uniqueDistricts
}

/**
 * Get churches by district
 */
export async function getChurchesByDistrict(district: string) {
  const supabase = await createClient()

  // Get current user and their allowed churches
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Get allowed church IDs based on role
  const allowedChurchIds = await getScopeChurches(user.id, userData.role)

  let query = supabase
    .from('churches')
    .select('*')
    .eq('district', district)
    .eq('is_active', true)
    .order('name', { ascending: true })

  // Apply scope filter (CRITICAL)
  if (allowedChurchIds !== null) {
    query = query.in('id', allowedChurchIds)
  }

  const { data, error } = await query

  if (error) throw error

  return data || []
}

/**
 * Get churches by field
 */
export async function getChurchesByField(field: string) {
  const supabase = await createClient()

  // Get current user and their allowed churches
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Get allowed church IDs based on role
  const allowedChurchIds = await getScopeChurches(user.id, userData.role)

  let query = supabase
    .from('churches')
    .select('*')
    .eq('field', field)
    .eq('is_active', true)
    .order('name', { ascending: true })

  // Apply scope filter (CRITICAL)
  if (allowedChurchIds !== null) {
    query = query.in('id', allowedChurchIds)
  }

  const { data, error } = await query

  if (error) throw error

  return data || []
}

/**
 * Get all churches for transfer destination selection
 * This bypasses normal scope restrictions to allow church secretaries
 * to see all churches when selecting a transfer destination
 */
export async function getChurchesForTransfer() {
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get user's role to determine scope
  const { data: userData } = await supabase
    .from('users')
    .select('role, field_id, district_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Build query
  let query = supabase
    .from('churches')
    .select('id, name, field, district, city, province')
    .eq('is_active', true)
    .order('name', { ascending: true })

  // For church secretaries and bibleworkers, show churches within their district
  // For pastors, show churches within their district
  // For field secretaries and above, show all churches
  if (userData.role === 'church_secretary' || userData.role === 'bibleworker') {
    // Show churches in the same district (if district is assigned)
    if (userData.district_id) {
      query = query.eq('district', userData.district_id)
    }
    // Otherwise show all churches (fallback)
  } else if (userData.role === 'pastor') {
    // Show churches in the same district
    if (userData.district_id) {
      query = query.eq('district', userData.district_id)
    }
  } else if (userData.role === 'field_secretary') {
    // Show churches in the same field
    if (userData.field_id) {
      query = query.eq('field', userData.field_id)
    }
  }
  // superadmin and coordinator see all churches (no filter)

  const { data, error } = await query

  if (error) throw error

  return data || []
}
