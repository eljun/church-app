/**
 * RBAC System Entry Point
 *
 * Centralized Role-Based Access Control (RBAC) system
 * Import from this file for all RBAC-related functionality
 *
 * @example
 * ```ts
 * import { canAccessModule, getScopeChurches, ROLE_PERMISSIONS } from '@/lib/rbac'
 * ```
 */

// Export all types
export type {
  UserRole,
  DataScope,
  ModuleName,
  SpecialPermission,
  RoleConfig,
} from './permissions'

// Export constants
export {
  ROLE_PERMISSIONS,
  ROLE_HIERARCHY,
  isRoleHigherThan,
  getRoleDisplayName,
} from './permissions'

// Export helper functions
export {
  getScopeChurches,
  canAccessModule,
  canWrite,
  getDataScope,
  getModuleFromPath,
  hasElevatedPrivileges,
  isChurchAdmin,
  getDefaultPath,
  canAccessChurch,
  getRolesForModule,
} from './helpers'
