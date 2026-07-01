import {
  LayoutDashboard,
  Users,
  UserPlus,
  Briefcase,
  CheckSquare,
  Activity,
  PlayCircle,
  BarChart3,
  ClipboardCheck,
  Users2,
  Building2,
  Target,
  ClipboardList,
  GitBranch,
  Kanban,
} from 'lucide-react';
import {
  PERMISSIONS } from '../constants/permissions';

export const navItems = [
  { name: 'Dashboard', path: '/dashboard/branch', icon: LayoutDashboard, permission: PERMISSIONS.VIEW_BRANCH_DASHBOARD },
  
  // Settings
  { name: 'Company Setup', path: '/settings/company', icon: Building2, permission: PERMISSIONS.VIEW_COMPANY_SETUP },

  // Customers & Deals
  { name: 'Customers', path: '/customers', icon: Users, permission: PERMISSIONS.VIEW_CUSTOMERS },
  { name: 'Deals', path: '/deals', icon: Briefcase, permission: PERMISSIONS.VIEW_DEALS },
  { name: 'Prospects', path: '/prospects', icon: UserPlus, permission: PERMISSIONS.VIEW_PROSPECTS },

  // Phase 1 — Pipelines
  { name: 'Pipelines', path: '/pipelines', icon: Kanban, permission: PERMISSIONS.VIEW_PIPELINES },

  // Operations
  { name: 'Activities', path: '/activities', icon: Activity, permission: PERMISSIONS.VIEW_ACTIVITIES },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare, permission: PERMISSIONS.VIEW_TASKS },
  { name: 'Sessions', path: '/sessions', icon: PlayCircle, permission: PERMISSIONS.VIEW_SESSIONS },
  { name: 'Targets', path: '/targets', icon: Target, permission: PERMISSIONS.VIEW_TARGETS },

  // Reports
  { name: 'Daily Report', path: '/reports/daily', icon: ClipboardCheck, permission: PERMISSIONS.VIEW_DAILY_REPORT },
  { name: 'Reports', path: '/reports', icon: BarChart3, permission: PERMISSIONS.VIEW_REPORTS },

  // System Tools
  { name: 'Audit Logs', path: '/audit', icon: ClipboardList, permission: PERMISSIONS.VIEW_AUDIT },
  { name: 'Transfer Approvals', path: '/approvals', icon: ClipboardCheck, permission: PERMISSIONS.APPROVE_TRANSFERS },
  { name: 'User Management', path: '/users', icon: Users2, permission: PERMISSIONS.VIEW_USERS },
];

export const getFilteredNavItems = (user, hasPermission) => {
  if (!user) return [];

  let items = [...navItems];

  // Derive companyId from user profile
  const companyId = user?.company?.id || user?.companyId;
  if (companyId) {
    const companySetupIndex = items.findIndex(i => i.path === '/settings/company');
    const branchItem = {
      name: 'Branches',
      path: `/companies/${companyId}/branches`,
      icon: GitBranch,
      permission: PERMISSIONS.VIEW_BRANCHES
    };
    if (companySetupIndex !== -1) {
      items.splice(companySetupIndex + 1, 0, branchItem);
    } else {
      items.splice(1, 0, branchItem); // Insert right after Dashboard if Company Setup is hidden
    }
  }

  // Restrict 'Company Setup' exclusively to SUPER_ADMIN users
  if (user.primaryRole !== 'SUPER_ADMIN') {
    items = items.filter(item => item.path !== '/settings/company');
  }

  return items.filter(item => {
    // Check Permission constraint
    return !item.permission || hasPermission(item.permission);
  });
};
