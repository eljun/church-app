/**
 * Pastor Helper Utilities
 * Functions to determine which churches a pastor has access to
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Get all church IDs that a pastor has access to
 * Based on: assigned_church_ids, district_id, and field_id
 */
export async function getPastorChurchIds(userId: string): Promise<string[]> {
  const supabase = await createClient()

  // Get user's pastor assignments
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, assigned_church_ids, district_id, field_id')
    .eq('id', userId)
    .single()

  if (userError || !userData || userData.role !== 'pastor') {
    return []
  }

  const assignedChurches = userData.assigned_church_ids || []

  // Get churches from district
  const districtChurches = userData.district_id
    ? await supabase
        .from('churches')
        .select('id')
        .eq('district', userData.district_id)
        .eq('is_active', true)
        .then(({ data }) => data || [])
    : []

  // Get churches from field
  const fieldChurches = userData.field_id
    ? await supabase
        .from('churches')
        .select('id')
        .eq('field', userData.field_id)
        .eq('is_active', true)
        .then(({ data }) => data || [])
    : []

  // Combine and remove duplicates
  const allChurchIds = [
    ...assignedChurches,
    ...districtChurches.map(c => c.id),
    ...fieldChurches.map(c => c.id)
  ]

  return [...new Set(allChurchIds)]
}

/**
 * Check if a user is a pastor and get their accessible church IDs
 * Returns null if not a pastor, or array of church IDs if pastor
 */
export async function getPastorAccessibleChurches(userId: string): Promise<string[] | null> {
  const supabase = await createClient()

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (!userData || userData.role !== 'pastor') {
    return null
  }

  return getPastorChurchIds(userId)
}

/**
 * Check if current user is a pastor
 */
export async function isPastor(): Promise<boolean> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return userData?.role === 'pastor'
}
