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
  Tags,
  Layers,
  TrendingUp,
  DollarSign,
  Sliders,
} from 'lucide-react';
import {
  PERMISSIONS
} from '../constants/permissions';

export const navGroups = [
  {
    group: 'Overview',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: PERMISSIONS.VIEW_DASHBOARD },
    ]
  },
  {
    group: 'CRM',
    items: [
      { name: 'Pipelines', path: '/pipelines', icon: Kanban, permission: PERMISSIONS.VIEW_PIPELINES },
      { name: 'Leads', path: '/leads', icon: ClipboardList, permission: PERMISSIONS.VIEW_LEADS },
      { name: 'Opportunities', path: '/opportunities', icon: Target, permission: PERMISSIONS.VIEW_LEADS },
      { name: 'Customers', path: '/customers', icon: Users, permission: PERMISSIONS.VIEW_CUSTOMERS },
      { name: 'Deals', path: '/deals', icon: Briefcase, permission: PERMISSIONS.VIEW_DEALS },
      { name: 'Prospects', path: '/prospects', icon: UserPlus, permission: PERMISSIONS.VIEW_PROSPECTS },
    ]
  },
  {
    group: 'Operations',
    items: [
      { name: 'Activities', path: '/activities', icon: Activity, permission: PERMISSIONS.VIEW_ACTIVITIES },
      { name: 'Tasks', path: '/tasks', icon: CheckSquare, permission: PERMISSIONS.VIEW_TASKS },
      { name: 'Sessions', path: '/sessions', icon: PlayCircle, permission: PERMISSIONS.VIEW_SESSIONS },
      { name: 'Targets', path: '/targets', icon: Target, permission: PERMISSIONS.VIEW_TARGETS },
      { name: 'Courses', path: '/courses', icon: BookOpen, permission: PERMISSIONS.VIEW_COURSES },
    ]
  },
  {
    group: 'Analytics',
    items: [
      { name: 'My Performance', path: '/my-performance', icon: Target, permission: PERMISSIONS.VIEW_KPI_OWN },
      { name: 'KPI Analytics', path: '/kpi-analytics', icon: TrendingUp, permission: PERMISSIONS.VIEW_KPI_ALL },
      { name: 'KPI Setup', path: '/kpi-management', icon: Target, permission: PERMISSIONS.CREATE_KPI },
      { name: 'Daily Report', path: '/reports/daily', icon: ClipboardCheck, permission: PERMISSIONS.VIEW_DAILY_REPORT },
      { name: 'Sales Performance', path: '/reports/sales-performance', icon: TrendingUp, permission: PERMISSIONS.VIEW_REPORTS },
      { name: 'Revenue Reports', path: '/reports/revenue', icon: DollarSign, permission: PERMISSIONS.VIEW_REPORTS },
      { name: 'Reports', path: '/reports', icon: BarChart3, permission: PERMISSIONS.VIEW_REPORTS },
    ]
  },
  {
    group: 'System & Admin',
    items: [
      { name: 'Organization', path: '/settings/organization', icon: Building2, permission: PERMISSIONS.VIEW_COMPANY_SETUP },
      { name: 'System Settings', path: '/settings/system', icon: Sliders, permission: PERMISSIONS.VIEW_SYSTEM_SETTINGS },
      { name: 'Branch', path: '/settings/branch', icon: GitBranch, permission: PERMISSIONS.VIEW_BRANCHES },
      { name: 'User Management', path: '/users', icon: Users2, permission: PERMISSIONS.VIEW_USERS },
      { name: 'Assignment Settings', path: '/assignment-settings', icon: GitBranch, permission: PERMISSIONS.VIEW_LEAD_ASSIGNMENT },
      { name: 'Transfer Approvals', path: '/approvals', icon: ClipboardCheck, permission: PERMISSIONS.APPROVE_TRANSFERS },
      { name: 'Teams', path: '/teams', icon: Users, permission: PERMISSIONS.VIEW_TEAMS, roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'BRANCH_MANAGER'] },
      { name: 'My Team', path: '/my-team', icon: Users2, permission: PERMISSIONS.VIEW_TEAMS },
      { name: 'Lead Sources', path: '/settings/lead-sources', icon: Compass, permission: PERMISSIONS.VIEW_LEAD_SOURCES },
      { name: 'Lead Statuses', path: '/settings/lead-statuses', icon: Tags, permission: PERMISSIONS.VIEW_LEAD_STATUSES },
      { name: 'Qualification Rules', path: '/settings/qualification', icon: Target, permission: 'view:qualification' },
      { name: 'Roles & Permissions', path: '/roles', icon: Shield, permission: PERMISSIONS.VIEW_ROLES },
      { name: 'Audit Logs', path: '/audit-logs', icon: ClipboardList, permission: PERMISSIONS.VIEW_AUDIT, roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'] },
    ]
  }
];

export const navItems = navGroups.flatMap(group => group.items);

export const getFilteredNavItems = (user, hasPermission, hasActiveTeam = true) => {
  if (!user) return [];

  let items = [...navItems];

  const userRole = (user?.primaryRole || user?.role || user?.userRoles?.[0]?.role?.name || '').toUpperCase();

  return items.filter(item => {
    // Check Role constraint if specified (case-insensitive check)
    if (item.roles && !item.roles.some(r => r.toUpperCase() === userRole)) {
      return false;
    }
    // Hide 'My Team' if user has no active team
    if (item.path === '/my-team' && !hasActiveTeam) {
      return false;
    }
    // Check Permission constraint
    return !item.permission || hasPermission(item.permission);
  });
};

export const getFilteredNavGroups = (user, hasPermission, hasActiveTeam = true) => {
  if (!user) return [];

  const userRole = (user?.primaryRole || user?.role || user?.userRoles?.[0]?.role?.name || '').toUpperCase();

  return navGroups.map(group => {
    const filteredItems = group.items.filter(item => {
      if (item.roles && !item.roles.some(r => r.toUpperCase() === userRole)) return false;
      if (item.path === '/my-team' && !hasActiveTeam) return false;
      return !item.permission || hasPermission(item.permission);
    });
    return { ...group, items: filteredItems };
  }).filter(group => group.items.length > 0);
};
