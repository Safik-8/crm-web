// FrontEnd/src/lib/utils/roleHierarchy.js

/**
 * Universal 4-Tier Role Hierarchy & Operational Scoping Helper
 * 
 * Supports both System Roles and Custom Roles with 100% backward compatibility:
 * - Tier 0 / Global: Super Admin (SUPER_ADMIN, Rank >= 100)
 * - Tier 1 / Company-Wide: Company Admin (COMPANY_ADMIN, Rank 80) & Custom Roles (Rank 61–79)
 * - Tier 2 / Branch-Level: Branch Manager (BRANCH_MANAGER, Rank 60) & Custom Roles (Rank 41–59)
 * - Tier 3 / Team Pod: BDE / Team Leader (BDE, Rank 40) & Custom Roles (Rank 21–39)
 * - Tier 4 / Personal: ISE / Individual (ISE, Rank 20) & Custom Roles (Rank 1–19)
 */
export function getRoleHierarchy(user) {
  if (!user) {
    return {
      rank: 0,
      isSuperAdmin: false,
      isCompanyWide: false,
      isBranchLevel: false,
      isTeamLevel: false,
      isPersonal: true,
      // Backward-compatible aliases
      isCompanyAdmin: false,
      isBranchManager: false,
      isBdeOrLeader: false,
      isBde: false,
      isIse: true,
    };
  }

  const role = user.primaryRole || '';
  const rank = Number(user.primaryRoleRank ?? 0);

  // Exact tier matching with zero system-role breakage
  const isSuperAdmin = role === 'SUPER_ADMIN' || rank >= 100;
  const isCompanyWide = isSuperAdmin || role === 'COMPANY_ADMIN' || rank >= 61;
  const isBranchLevel = !isCompanyWide && (role === 'BRANCH_MANAGER' || rank >= 41);
  const isTeamLevel = !isCompanyWide && !isBranchLevel && (role === 'BDE' || rank >= 21 || Boolean(user.isTeamLeader));
  const isPersonal = !isCompanyWide && !isBranchLevel && !isTeamLevel;

  return {
    rank,
    role,
    isSuperAdmin,
    isCompanyWide,
    isBranchLevel,
    isTeamLevel,
    isPersonal,
    // Direct backward-compatible aliases for existing component state:
    isCompanyAdmin: isCompanyWide && !isSuperAdmin,
    isBranchManager: isBranchLevel,
    isBdeOrLeader: isTeamLevel,
    isBde: isTeamLevel,
    isIse: isPersonal,
  };
}

export default getRoleHierarchy;
