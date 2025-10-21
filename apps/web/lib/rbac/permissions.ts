/**
 * RBAC Permission System
 *
 * This file defines the centralized role-based access control (RBAC) configuration.
 * It replaces scattered role checks across the codebase with a single source of truth.
 *
 * @see Phase 11: RBAC System Overhaul
 */

/**
 * User roles in the system (6 roles total)
 */
export type UserRole =
  | 'superadmin'
  | 'field_secretary'
  | 'pastor'
  | 'church_secretary'
  | 'coordinator'
  | 'bibleworker'

/**
 * Data access scope for each role
 */
export type DataScope =
  | 'national'      // All churches nationwide
  | 'field'         // All churches in a field (Luzon/Visayan/Mindanao)
  | 'district'      // All churches in a district
  | 'church'        // Single or multiple churches
  | 'events_only'   // Events module only (no church data)

/**
 * Application modules that can be accessed
 */
export type ModuleName =
  | 'dashboard'
  | 'members'
  | 'visitors'
  | 'churches'
  | 'events'
  | 'attendance'
  | 'transfers'
  | 'calendar'
  | 'reports'
  | 'missionary-reports'
  | 'settings'

/**
 * Special permissions for specific modules
 * Used when a role has different write access for specific modules
 */
export type SpecialPermission = 'read' | 'write'

/**
 * Role configuration interface
 */
export interface RoleConfig {
  /** Modules this role can access ('*' means all modules) */
  modules: ModuleName[] | ['*']

  /** Whether this role can write/edit data (general permission) */
  canWrite: boolean

  /** Data scope - determines which churches/members/events they see */
  dataScope: DataScope

  /** Display name for UI */
  displayName: string

  /** Special permissions for specific modules (overrides canWrite) */
  specialPermissions?: Partial<Record<ModuleName, SpecialPermission>>
}

/**
 * Centralized role permissions configuration
 * This is the single source of truth for all role-based access control
 */
export const ROLE_PERMISSIONS: Record<UserRole, RoleConfig> = {
  /**
   * SUPERADMIN
   * - Full access to everything
   * - National scope (sees all data)
   * - Can access all modules including settings
   */
  superadmin: {
    modules: ['*'],
    canWrite: true,
    dataScope: 'national',
    displayName: 'Superadmin',
  },

  /**
   * FIELD SECRETARY
   * - Field-level access (Luzon, Visayan, or Mindanao)
   * - Can manage all churches/districts in their field
   * - Full write access to their field
   * - Cannot access settings
   */
  field_secretary: {
    modules: [
      'dashboard',
      'members',
      'visitors',
      'churches',
      'events',
      'attendance',
      'transfers',
      'calendar',
      'reports',
      'missionary-reports',
    ],
    canWrite: true,
    dataScope: 'field',
    displayName: 'Field Secretary',
  },

  /**
   * PASTOR
   * - District-level access
   * - Can manage all churches in their district
   * - Full write access to their district
   * - Cannot access settings
   */
  pastor: {
    modules: [
      'dashboard',
      'members',
      'visitors',
      'churches',
      'events',
      'attendance',
      'transfers',
      'calendar',
      'reports',
      'missionary-reports',
    ],
    canWrite: true,
    dataScope: 'district',
    displayName: 'Pastor',
  },

  /**
   * CHURCH SECRETARY (formerly "admin")
   * - Single church access
   * - Can manage their church only
   * - Full write access to their church
   * - Cannot access churches list (only their own)
   */
  church_secretary: {
    modules: [
      'dashboard',
      'members',
      'visitors',
      'events',
      'attendance',
      'transfers',
      'calendar',
      'reports',
      'missionary-reports',
    ],
    canWrite: true,
    dataScope: 'church',
    displayName: 'Church Secretary',
  },

  /**
   * COORDINATOR
   * - Events specialist role
   * - Can manage events and calendar across all churches
   * - Cannot access member/visitor data
   * - Cannot access churches module
   */
  coordinator: {
    modules: [
      'dashboard',
      'events',
      'calendar',
    ],
    canWrite: true,
    dataScope: 'events_only',
    displayName: 'Coordinator',
  },

  /**
   * BIBLEWORKER
   * - Assigned churches access (multiple churches possible)
   * - Read-only for members (can view assigned members)
   * - Can create/update visitors and activities
   * - Can submit missionary reports
   * - Cannot delete or transfer members
   */
  bibleworker: {
    modules: [
      'dashboard',
      'members',
      'visitors',
      'events',
      'attendance',
      'calendar',
      'reports',
      'missionary-reports',
    ],
    canWrite: false, // General write is false
    dataScope: 'church',
    displayName: 'Bibleworker',
    specialPermissions: {
      // Bibleworkers CAN write to these specific modules
      visitors: 'write',
      'missionary-reports': 'write',
      attendance: 'write',
    },
  },
}

/**
 * Role hierarchy for comparison purposes
 * Higher index = more powerful role
 */
export const ROLE_HIERARCHY: UserRole[] = [
  'bibleworker',      // 0 - Most restricted
  'church_secretary', // 1
  'coordinator',      // 2
  'pastor',           // 3
  'field_secretary',  // 4
  'superadmin',       // 5 - Most powerful
]

/**
 * Helper to check if a role is hierarchically higher than another
 */
export function isRoleHigherThan(role1: UserRole, role2: UserRole): boolean {
  return ROLE_HIERARCHY.indexOf(role1) > ROLE_HIERARCHY.indexOf(role2)
}

/**
 * Helper to get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  return ROLE_PERMISSIONS[role].displayName
}
