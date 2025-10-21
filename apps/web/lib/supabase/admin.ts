/**
 * Supabase Admin Client
 * Use this for admin operations that require service_role key
 * ONLY use in secure server-side code (Server Actions, API Routes)
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@church-app/database'

/**
 * Create admin client with service_role key
 * This bypasses RLS and has full database access
 * Use with caution and only in trusted server-side code
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  })
}
