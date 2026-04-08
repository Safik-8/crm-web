import { PERMISSIONS } from '../constants/permissions';
import { ROLES } from '../constants/roles';

export const ROLE_PERMISSIONS = {
  [ROLES.ISE]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PROSPECTS,
    PERMISSIONS.VIEW_ACTIVITIES,
    PERMISSIONS.VIEW_SESSIONS,
    PERMISSIONS.VIEW_TASKS,
  ],
  [ROLES.MANAGER]: [
    // Includes ISE
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PROSPECTS,
    PERMISSIONS.VIEW_ACTIVITIES,
    PERMISSIONS.VIEW_SESSIONS,
    PERMISSIONS.VIEW_TASKS,
    // Plus Manager specifics
    PERMISSIONS.VIEW_TEAM_REPORTS,
    PERMISSIONS.APPROVE_TRANSFERS,
  ],
  [ROLES.BRANCH_ADMIN]: [
    // Includes Manager
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PROSPECTS,
    PERMISSIONS.VIEW_ACTIVITIES,
    PERMISSIONS.VIEW_SESSIONS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_TEAM_REPORTS,
    PERMISSIONS.APPROVE_TRANSFERS,
    // Plus Branch Admin specifics
    PERMISSIONS.VIEW_BRANCH_SETTINGS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_USERS,
  ],
  [ROLES.CEO]: [
    PERMISSIONS.VIEW_COMPANY_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.READ_ONLY_REPORTS,
  ],
  [ROLES.SUPER_ADMIN]: [
    // All permissions
    ...Object.values(PERMISSIONS),
  ],
};

/**
 * Helper to get unique permissions for a list of roles
 */
export const getPermissionsByRoles = (roles = []) => {
  const permissions = new Set();
  roles.forEach((role) => {
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    rolePerms.forEach((perm) => permissions.add(perm));
  });
  return Array.from(permissions);
};
