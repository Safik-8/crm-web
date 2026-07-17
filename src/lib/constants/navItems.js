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
  Shield,
  BookOpen,
  Compass,
} from 'lucide-react';
import {
  PERMISSIONS } from '../constants/permissions';

export const navItems = [
  { name: 'Dashboard', path: '/dashboard/branch', icon: LayoutDashboard, permission: PERMISSIONS.VIEW_BRANCH_DASHBOARD },
  
  // Settings
  { name: 'Organization', path: '/settings/organization', icon: Building2, permission: PERMISSIONS.VIEW_SETTINGS },

  // Customers & Deals
  { name: 'Customers', path: '/customers', icon: Users, permission: PERMISSIONS.VIEW_CUSTOMERS },
  { name: 'Deals', path: '/deals', icon: Briefcase, permission: PERMISSIONS.VIEW_DEALS },
  { name: 'Prospects', path: '/prospects', icon: UserPlus, permission: PERMISSIONS.VIEW_PROSPECTS },

  // Phase 1 — Pipelines
  { name: 'Pipelines', path: '/pipelines', icon: Kanban, permission: PERMISSIONS.VIEW_PIPELINES },
  { name: 'Leads', path: '/leads', icon: ClipboardList, permission: PERMISSIONS.VIEW_LEADS },

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
  { name: 'Teams', path: '/teams', icon: Users, permission: PERMISSIONS.VIEW_TEAMS, roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'BRANCH_MANAGER'] },
  { name: 'Courses', path: '/courses', icon: BookOpen, permission: PERMISSIONS.VIEW_COURSES },
  { name: 'Lead Sources', path: '/settings/lead-sources', icon: Compass, permission: PERMISSIONS.VIEW_LEAD_SOURCES },
  { name: 'Roles & Permissions', path: '/roles', icon: Shield, permission: PERMISSIONS.VIEW_ROLES },
];

export const getFilteredNavItems = (user, hasPermission) => {
  if (!user) return [];

  let items = [...navItems];

  return items.filter(item => {
    // Check Role constraint if specified
    if (item.roles && !item.roles.includes(user.primaryRole)) {
      return false;
    }
    // Check Permission constraint
    return !item.permission || hasPermission(item.permission);
  });
};
