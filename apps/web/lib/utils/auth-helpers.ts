/**
 * Authentication Helper Functions
 * Optimized with React cache to reduce duplicate database queries
 */

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Get authenticated user with their profile data
 * Cached per-request to avoid duplicate queries
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get user details from our users table with church info
  const { data: userData } = await supabase
    .from('users')
    .select('*, churches(name)')
    .eq('id', user.id)
    .single()

  return userData
})

/**
 * Get authenticated user's role only
 * Cached per-request, lighter query than getAuthUser
 */
export const getAuthUserRole = cache(async () => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('id, role, church_id, assigned_church_ids, field, district, field_id, district_id')
    .eq('id', user.id)
    .single()

  return userData
})
