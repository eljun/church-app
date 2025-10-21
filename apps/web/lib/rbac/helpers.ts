/**
 * RBAC Helper Functions
 *
 * These helper functions provide the core logic for role-based access control.
 * They should be used in queries, actions, middleware, and components to enforce permissions.
 *
 * @see Phase 11: RBAC System Overhaul
 */

import { createClient } from '@/lib/supabase/server'
import type { UserRole, ModuleName, DataScope } from './permissions'
import { ROLE_PERMISSIONS } from './permissions'

/**
 * Get the list of church IDs a user can access based on their role
 *
 * @param userId - The user's ID
 * @param role - The user's role
 * @returns Array of church IDs, or null if user has national access (no filter needed)
 *
 * @example
 * ```ts
 * const churchIds = await getScopeChurches(userId, 'pastor')
 * let query = supabase.from('members').select('*')
 * if (churchIds !== null) {
 *   query = query.in('church_id', churchIds)
 * }
 * ```
 */
export async function getScopeChurches(
  userId: string,
  role: UserRole
): Promise<string[] | null> {
  const supabase = await createClient()

  // Get user's assignments
  const { data: user } = await supabase
    .from('users')
    .select('field_id, district_id, church_id, assigned_church_ids')
    .eq('id', userId)
    .single()

  if (!user) return []

  const scope = ROLE_PERMISSIONS[role].dataScope

  switch (scope) {
    case 'national':
      // Superadmin - no filter needed
      return null

    case 'field':
      // Field Secretary - get all churches in their field
      if (!user.field_id) return []
      const { data: fieldChurches } = await supabase
        .from('churches')
        .select('id')
        .eq('field', user.field_id)
      return fieldChurches?.map((c) => c.id) || []

    case 'district':
      // Pastor - get all churches in their district
      if (!user.district_id) return []
      const { data: districtChurches } = await supabase
        .from('churches')
        .select('id')
        .eq('district', user.district_id)
      return districtChurches?.map((c) => c.id) || []

    case 'church':
      // Church Secretary or Bibleworker - return assigned churches
      if (user.assigned_church_ids?.length) {
        // Bibleworker with multiple churches
        return user.assigned_church_ids
      } else if (user.church_id) {
        // Church Secretary with single church
        return [user.church_id]
      }
      return []

    case 'events_only':
      // Coordinator - no church access (will be handled separately for events)
      return []

    default:
      return []
  }
}

/**
 * Check if a user can access a specific module
 *
 * @param role - The user's role
 * @param module - The module name to check
 * @returns true if user can access the module
 *
 * @example
 * ```ts
 * if (!canAccessModule(userRole, 'members')) {
 *   redirect('/events')
 * }
 * ```
 */
export function canAccessModule(role: UserRole, module: ModuleName): boolean {
  const config = ROLE_PERMISSIONS[role]
  const modules = config.modules as (ModuleName | '*')[]
  return modules.includes('*') || modules.includes(module)
}

/**
 * Check if a user can write/edit data in a specific module
 *
 * @param role - The user's role
 * @param module - Optional module name to check (for special permissions)
 * @returns true if user can write/edit
 *
 * @example
 * ```ts
 * if (!canWrite(userRole, 'members')) {
 *   return { error: 'Insufficient permissions' }
 * }
 * ```
 */
export function canWrite(role: UserRole, module?: ModuleName): boolean {
  const config = ROLE_PERMISSIONS[role]

  // Check for special permissions first (e.g., bibleworker can write to visitors)
  if (module && config.specialPermissions?.[module]) {
    return config.specialPermissions[module] === 'write'
  }

  // Fall back to general write permission
  return config.canWrite
}

/**
 * Get the data scope for a role
 *
 * @param role - The user's role
 * @returns The data scope
 */
export function getDataScope(role: UserRole): DataScope {
  return ROLE_PERMISSIONS[role].dataScope
}

/**
 * Extract module name from a URL path
 *
 * @param pathname - The URL pathname (e.g., '/members', '/reports/attendance')
 * @returns The module name or null if not a protected module
 *
 * @example
 * ```ts
 * const module = getModuleFromPath('/members') // returns 'members'
 * const module = getModuleFromPath('/reports/attendance') // returns 'reports'
 * ```
 */
export function getModuleFromPath(pathname: string): ModuleName | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return 'dashboard'

  const firstSegment = segments[0]

  const moduleMap: Record<string, ModuleName> = {
    dashboard: 'dashboard',
    members: 'members',
    visitors: 'visitors',
    churches: 'churches',
    events: 'events',
    attendance: 'attendance',
    transfers: 'transfers',
    calendar: 'calendar',
    reports: 'reports',
    'missionary-reports': 'missionary-reports',
    settings: 'settings',
  }

  return moduleMap[firstSegment] || null
}

/**
 * Check if a role has elevated privileges (superadmin or field_secretary)
 *
 * @param role - The user's role
 * @returns true if user has elevated privileges
 */
export function hasElevatedPrivileges(role: UserRole): boolean {
  return role === 'superadmin' || role === 'field_secretary'
}

/**
 * Check if a role is a church admin (can manage church data)
 *
 * @param role - The user's role
 * @returns true if user is a church admin
 */
export function isChurchAdmin(role: UserRole): boolean {
  return ['superadmin', 'field_secretary', 'pastor', 'church_secretary'].includes(role)
}

/**
 * Get the default redirect path for a role
 * Used when a user tries to access a module they don't have permission for
 *
 * @param role - The user's role
 * @returns The default path to redirect to
 */
export function getDefaultPath(role: UserRole): string {
  const config = ROLE_PERMISSIONS[role]
  const modules = config.modules as (ModuleName | '*')[]

  // If coordinator (events only), redirect to events
  if (role === 'coordinator') {
    return '/events'
  }

  // If user has access to dashboard, use that
  if (modules.includes('*') || modules.includes('dashboard')) {
    return '/'
  }

  // Otherwise use the first available module
  if (Array.isArray(modules) && modules.length > 0 && modules[0] !== '*') {
    return `/${modules[0]}`
  }

  return '/events' // Fallback
}

/**
 * Check if a user can access a specific church
 *
 * @param userId - The user's ID
 * @param role - The user's role
 * @param churchId - The church ID to check
 * @returns true if user can access the church
 */
export async function canAccessChurch(
  userId: string,
  role: UserRole,
  churchId: string
): Promise<boolean> {
  const allowedChurches = await getScopeChurches(userId, role)

  // null means national access (can access all)
  if (allowedChurches === null) return true

  // Check if church is in allowed list
  return allowedChurches.includes(churchId)
}

/**
 * Get all roles that can access a specific module
 *
 * @param module - The module name
 * @returns Array of roles that can access the module
 */
export function getRolesForModule(module: ModuleName): UserRole[] {
  const roles: UserRole[] = []

  for (const [role, config] of Object.entries(ROLE_PERMISSIONS)) {
    const modules = config.modules as (ModuleName | '*')[]
    if (modules.includes('*') || modules.includes(module)) {
      roles.push(role as UserRole)
    }
  }

  return roles
}
