/**
 * Pastor Helper Utilities
 * Functions to determine which churches a pastor has access to
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Get all church IDs that a pastor has access to
 * Based on: assigned_church_ids ONLY
 * Note: district_id and field_id are optional metadata for context, NOT for granting access
 */
export async function getPastorChurchIds(userId: string): Promise<string[]> {
  const supabase = await createClient()

  // Get user's pastor assignments
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, assigned_church_ids')
    .eq('id', userId)
    .single()

  if (userError || !userData || userData.role !== 'pastor') {
    return []
  }

  // Pastors only have access to their explicitly assigned churches
  // Multiple pastors can be assigned to the same district with different church assignments
  return userData.assigned_church_ids || []
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
