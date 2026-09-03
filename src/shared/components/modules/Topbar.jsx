import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Search, Bell, Menu, User, LogOut, Loader2, ChevronRight, Home, X, 
  CornerDownLeft, ClipboardList, Kanban, SlidersHorizontal, Briefcase, 
  Layers, Handshake, Users, CheckSquare, Target, BarChart3, FileText, 
  ShieldAlert, ArrowRightLeft, BookOpen, Key, Building2, Tag, Compass
} from 'lucide-react';
import { Menu as MuiMenu, MenuItem } from '@mui/material';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from '../../utils/toast';
import NotificationPanel from '../../../features/notifications/components/NotificationPanel.jsx';
import { useNotificationBadge } from '../../../features/notifications/hooks/useNotificationBadge.js';

const ROUTE_LABELS = {
  'dashboard': 'Dashboard',
  'branch': 'Branch Performance',
  'organization': 'Organization',
  'lead-sources': 'Lead Sources',
  'lead-statuses': 'Lead Statuses',
  'customers': 'Customers',
  'deals': 'Deals',
  'prospects': 'Prospects',
  'pipelines': 'Pipelines',
  'leads': 'Leads',
  'activities': 'Activities',
  'tasks': 'Tasks',
  'sessions': 'Sessions',
  'targets': 'Targets',
  'reports': 'Reports',
  'daily': 'Daily Report',
  'audit': 'Audit Logs',
  'approvals': 'Transfer Approvals',
  'users': 'User Management',
  'teams': 'Teams',
  'courses': 'Courses',
  'roles': 'Roles & Permissions',
  'profile': 'My Profile',
  'settings': 'Settings',
  'companies': 'Companies',
  'branches': 'Branches',
  'kpi-management': 'KPI Target Management',
  'my-performance': 'My Performance',
  'kpi-analytics': 'KPI Analytics',
};

// Global navigation search registry with permission checks
const SEARCH_NAV_ITEMS = [
  {
    id: 'dashboard-analytics',
    title: 'Dashboard Overview',
    subtitle: 'System executive metrics and sales performance overview',
    category: 'Dashboard',
    icon: Compass,
    path: '/dashboard',
    keywords: ['home', 'dashboard', 'analytics', 'overview', 'metrics', 'stats', 'kpi'],
    permission: () => true
  },
  {
    id: 'leads-registry',
    title: 'Leads Registry',
    subtitle: 'Manage sales leads, assignments & filter presets',
    category: 'Leads & Sales',
    icon: ClipboardList,
    path: '/leads',
    keywords: ['lead', 'leads', 'prospect', 'contact', 'registry', 'assign', 'excel', 'import'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      hasPermission('LEAD', 'canView') || 
      hasPermission('view:lead')
  },
  {
    id: 'leads-kanban',
    title: 'Leads Kanban Board',
    subtitle: 'Visual drag-and-drop lead pipeline board',
    category: 'Leads & Sales',
    icon: Kanban,
    path: '/leads/board',
    keywords: ['lead', 'kanban', 'board', 'pipeline', 'drag', 'stage', 'cards'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      hasPermission('LEAD', 'canView') || 
      hasPermission('view:lead')
  },
  {
    id: 'lead-sources',
    title: 'Lead Sources',
    subtitle: 'Configure lead generation channels & sources',
    category: 'Settings',
    icon: Tag,
    path: '/settings/lead-sources',
    keywords: ['source', 'lead source', 'channel', 'campaign', 'origin'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      user?.primaryRole === 'COMPANY_ADMIN' || 
      hasPermission('SYSTEM_SETTINGS', 'canView')
  },
  {
    id: 'lead-statuses',
    title: 'Lead Statuses',
    subtitle: 'Manage custom lead status lifecycle states',
    category: 'Settings',
    icon: SlidersHorizontal,
    path: '/settings/lead-statuses',
    keywords: ['status', 'lead status', 'stage', 'lifecycle', 'workflow'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      user?.primaryRole === 'COMPANY_ADMIN' || 
      hasPermission('SYSTEM_SETTINGS', 'canView')
  },
  {
    id: 'opportunities',
    title: 'Opportunities Engine',
    subtitle: 'Track active sales opportunities & deal stages',
    category: 'Opportunities',
    icon: Briefcase,
    path: '/opportunities',
    keywords: ['opportunity', 'opportunities', 'opp', 'deal', 'pipeline', 'value', 'forecast'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      hasPermission('OPPORTUNITY', 'canView') || 
      hasPermission('view:opportunity')
  },
  {
    id: 'opportunity-stages',
    title: 'Opportunity Stages',
    subtitle: 'Configure opportunity workflow stage ordering',
    category: 'Opportunities',
    icon: Layers,
    path: '/opportunities/stages',
    keywords: ['stage', 'opportunity stage', 'order', 'probability', 'win rate'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      hasPermission('OPPORTUNITY', 'canView') || 
      hasPermission('view:opportunity')
  },
  {
    id: 'deals',
    title: 'Deal Management',
    subtitle: 'Closed deals, won revenue & outcome analytics',
    category: 'Deals & Revenue',
    icon: Handshake,
    path: '/deals',
    keywords: ['deal', 'deals', 'won', 'lost', 'revenue', 'closed', 'contract'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      hasPermission('DEAL', 'canView') || 
      hasPermission('view:deal')
  },
  {
    id: 'customers',
    title: 'Customers Directory',
    subtitle: 'Customer accounts, contacts & account history',
    category: 'Customers',
    icon: Users,
    path: '/customers',
    keywords: ['customer', 'customers', 'account', 'client', 'contact', 'buyer'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      hasPermission('CUSTOMER', 'canView') || 
      hasPermission('view:customer')
  },
  {
    id: 'pipelines',
    title: 'Pipeline Management',
    subtitle: 'Custom sales pipelines & stage builders',
    category: 'Pipelines',
    icon: Layers,
    path: '/pipelines',
    keywords: ['pipeline', 'pipelines', 'stage builder', 'sales funnel'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      hasPermission('PIPELINE', 'canView') || 
      hasPermission('view:pipeline')
  },
  {
    id: 'tasks',
    title: 'Tasks & Activities',
    subtitle: 'Schedule follow-ups, calls, meetings & tasks',
    category: 'Activities',
    icon: CheckSquare,
    path: '/tasks',
    keywords: ['task', 'tasks', 'activity', 'followup', 'call', 'meeting', 'reminder'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      hasPermission('TASK', 'canView') || 
      hasPermission('view:task')
  },
  {
    id: 'targets',
    title: 'Targets & Goals',
    subtitle: 'Performance targets, metrics & goal tracking',
    category: 'Performance',
    icon: Target,
    path: '/targets',
    keywords: ['target', 'targets', 'kpi', 'goal', 'quota', 'performance', 'metric'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      hasPermission('TARGET', 'canView') || 
      hasPermission('view:target')
  },
  {
    id: 'kpi-management',
    title: 'KPI Management',
    subtitle: 'Set and assign company/branch KPI targets',
    category: 'Performance',
    icon: Target,
    path: '/kpi-management',
    keywords: ['kpi management', 'assign kpi', 'quota management', 'target setup'],
    permission: (user) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      user?.primaryRole === 'COMPANY_ADMIN' || 
      (user?.primaryRoleRank >= 80)
  },
  {
    id: 'kpi-analytics',
    title: 'KPI Analytics',
    subtitle: 'Detailed target achievement analytics & charts',
    category: 'Performance',
    icon: BarChart3,
    path: '/kpi-analytics',
    keywords: ['kpi analytics', 'target charts', 'achievement', 'quota breakdown'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      hasPermission('KPI', 'canView') || 
      hasPermission('view:kpi')
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    subtitle: 'Business intelligence reports & exports',
    category: 'Reports',
    icon: FileText,
    path: '/reports',
    keywords: ['report', 'reports', 'analytics', 'bi', 'summary', 'export', 'charts'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      hasPermission('REPORT', 'canView') || 
      hasPermission('view:report')
  },
  {
    id: 'daily-report',
    title: 'Daily Summary Report',
    subtitle: 'Daily operational summary & activity logs',
    category: 'Reports',
    icon: FileText,
    path: '/reports/daily',
    keywords: ['daily report', 'daily summary', 'activity summary'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      hasPermission('REPORT', 'canView') || 
      hasPermission('view:report')
  },
  {
    id: 'audit-logs',
    title: 'Audit Logs & Security',
    subtitle: 'Enterprise security audit trail & activity monitor',
    category: 'Administration',
    icon: ShieldAlert,
    path: '/audit-logs',
    keywords: ['audit', 'audit log', 'logs', 'security', 'trail', 'history', 'ip'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      user?.primaryRole === 'COMPANY_ADMIN' || 
      hasPermission('AUDIT', 'canView')
  },
  {
    id: 'transfer-approvals',
    title: 'Transfer Approvals',
    subtitle: 'Approve or reject lead & opportunity transfers',
    category: 'Administration',
    icon: ArrowRightLeft,
    path: '/approvals',
    keywords: ['approval', 'approvals', 'transfer', 'reassign', 'request'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      user?.primaryRole === 'COMPANY_ADMIN' || 
      hasPermission('TRANSFER', 'canView')
  },
  {
    id: 'users',
    title: 'User Management',
    subtitle: 'Manage employees, accounts, designations & access',
    category: 'User & Team',
    icon: Users,
    path: '/users',
    keywords: ['user', 'users', 'employee', 'staff', 'member', 'account', 'bde', 'ise', 'manager'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      user?.primaryRole === 'COMPANY_ADMIN' || 
      hasPermission('USER', 'canView') || 
      hasPermission('view:user')
  },
  {
    id: 'teams',
    title: 'Team Management',
    subtitle: 'Organize sales teams, team leads & members',
    category: 'User & Team',
    icon: Users,
    path: '/teams',
    keywords: ['team', 'teams', 'group', 'sales team', 'squad'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      user?.primaryRole === 'COMPANY_ADMIN' || 
      hasPermission('TEAM', 'canView') || 
      hasPermission('view:team')
  },
  {
    id: 'courses',
    title: 'Course / Product Catalog',
    subtitle: 'Manage product catalog, pricing & courses',
    category: 'Catalog',
    icon: BookOpen,
    path: '/courses',
    keywords: ['course', 'courses', 'product', 'catalog', 'pricing', 'training'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      hasPermission('COURSE', 'canView') || 
      hasPermission('view:course')
  },
  {
    id: 'roles',
    title: 'Roles & Permissions',
    subtitle: 'Custom RBAC permissions matrix & role definitions',
    category: 'Settings',
    icon: Key,
    path: '/roles',
    keywords: ['role', 'roles', 'permission', 'rbac', 'access control', 'matrix'],
    permission: (user, hasPermission) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      user?.primaryRole === 'COMPANY_ADMIN' || 
      hasPermission('ROLE', 'canView')
  },
  {
    id: 'organization-settings',
    title: 'Organization & Companies',
    subtitle: 'Manage company hierarchy, branches & tenant settings',
    category: 'Settings',
    icon: Building2,
    path: '/settings/organization',
    keywords: ['organization', 'company', 'companies', 'branch', 'branches', 'tenant', 'settings'],
    permission: (user) => 
      user?.primaryRole === 'SUPER_ADMIN' || 
      user?.primaryRole === 'COMPANY_ADMIN'
  },
  {
    id: 'profile',
    title: 'My Profile',
    subtitle: 'View and edit account profile & security settings',
    category: 'Account',
    icon: User,
    path: '/profile',
    keywords: ['profile', 'account', 'password', 'my profile', 'me', 'photo'],
    permission: () => true
  }
];

const buildBreadcrumbs = (pathname, search, state) => {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = [];

  crumbs.push({
    label: 'Home',
    path: '/dashboard',
    isHome: true
  });

  let currentPath = '';

  if (segments[0] === 'kpi') {
    crumbs.push({ label: 'KPI Analytics', path: '/kpi-analytics' });
    if (segments[1] && !isNaN(segments[1])) {
      const kpiId = segments[1];
      const nameLabel = state?.kpiType ? `${state.kpiType} Target Detail` : 'Target Detail';
      crumbs.push({ label: nameLabel, path: `/kpi/${kpiId}` });
    }
    return crumbs;
  }

  if (segments[0] === 'opportunities') {
    crumbs.push({ label: 'Opportunities', path: '/opportunities' });
    if (segments[1] === 'stages') {
      crumbs.push({ label: 'Manage Stages', path: '/opportunities/stages' });
    } else if (segments[1] && !isNaN(segments[1])) {
      const dealId = segments[1];
      const nameLabel = state?.opportunityName || state?.leadName || `Opportunity #${dealId}`;
      crumbs.push({ label: nameLabel, path: `/opportunities/${dealId}` });
    }
    return crumbs;
  }

  segments.forEach((seg, index) => {
    const isId = !isNaN(seg);
    currentPath += `/${seg}`;

    if (isId) return;

    if (seg === 'organization' && search.includes('tab=branch')) {
      crumbs.push({ label: 'Organization', path: '/settings/organization' });
      crumbs.push({ label: 'Branches', path: '/settings/organization?tab=branch' });
      return;
    }

    if (seg === 'companies') {
      crumbs.push({ label: 'Organization', path: '/settings/organization' });
      return;
    }

    if (seg === 'settings') {
      return;
    }

    if (seg === 'dashboard' && segments[index + 1] === 'branch') {
      return;
    }

    let label = ROUTE_LABELS[seg.toLowerCase()] || seg.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    if (currentPath === '/dashboard/branch') {
      crumbs[0].label = 'Dashboard';
      crumbs[0].path = '/dashboard/branch';
      crumbs.push({ label: 'Branch Performance', path: currentPath });
      return;
    }

    crumbs.push({
      label,
      path: currentPath
    });
  });

  const searchParams = new URLSearchParams(search);
  const leadName = searchParams.get('leadName');
  const reportType = searchParams.get('type');

  if (leadName) {
    crumbs.push({ label: leadName, path: pathname + search });
  }

  if (reportType) {
    const reportLabels = {
      LEAD_REPORT: 'Leads Summary & Distribution',
      OPPORTUNITY_REPORT: 'Opportunities Pipeline Analysis',
      DEAL_REPORT: 'Deals & Conversions',
      REVENUE_REPORT: 'Revenue Breakdown & Payments',
      CUSTOMER_REPORT: 'Customers Summary & Acquisition',
      TEAM_PERFORMANCE_REPORT: 'Team Conversions & KPI Metrics'
    };
    crumbs.push({ label: reportLabels[reportType] || 'Report Details', path: pathname + search });
  }

  return crumbs.filter((c, idx, arr) => idx === 0 || c.path !== arr[idx - 1].path);
};

const Topbar = ({ toggleSidebar }) => {
  const { logout, user, isLoggingOut, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const bellButtonRef = useRef(null);
  const { unreadCount } = useNotificationBadge();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef(null);

  const crumbs = buildBreadcrumbs(location.pathname, location.search, location.state);

  const closePanel = useCallback(() => setIsPanelOpen(false), []);
  const togglePanel = useCallback(() => setIsPanelOpen((prev) => !prev), []);

  // Filter allowed search items strictly by user permissions
  const accessibleSearchItems = useMemo(() => {
    return SEARCH_NAV_ITEMS.filter((item) => {
      try {
        return item.permission(user, hasPermission);
      } catch {
        return false;
      }
    });
  }, [user, hasPermission]);

  // Compute search matches
  const filteredNavResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return accessibleSearchItems.slice(0, 6);
    }
    return accessibleSearchItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSub = item.subtitle.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchPath = item.path.toLowerCase().includes(q);
      const matchKw = item.keywords.some((kw) => kw.toLowerCase().includes(q));
      return matchTitle || matchSub || matchCat || matchPath || matchKw;
    });
  }, [searchQuery, accessibleSearchItems]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectNav = (path) => {
    navigate(path);
    setSearchQuery('');
    setIsSearchOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isSearchOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredNavResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredNavResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredNavResults[selectedIndex]) {
        handleSelectNav(filteredNavResults[selectedIndex].path);
      } else if (filteredNavResults.length > 0) {
        handleSelectNav(filteredNavResults[0].path);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    toast.loading('Signing you out…', { id: 'logout' });
    await logout();
    toast.success('Signed out successfully', { id: 'logout' });
    navigate('/login', { replace: true });
  };

  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const isProfileMenuOpen = Boolean(profileAnchorEl);
  
  const handleProfileClick = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };
  
  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-[60px] w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-5 backdrop-blur-xl">

        {/* Left: hamburger + breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-4">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors lg:hidden shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb Trail */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 sm:gap-1.5 min-w-0 overflow-hidden">
            {crumbs.map((crumb, idx) => {
              const isLast = idx === crumbs.length - 1;
              return (
                <div key={crumb.path + idx} className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                  {idx > 0 && (
                    <ChevronRight size={13} className="text-slate-300 shrink-0 stroke-[2.2]" />
                  )}
                  {isLast ? (
                    <span className="text-[13px] font-bold text-slate-800 truncate tracking-tight font-heading">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      to={crumb.path}
                      className="text-[13px] font-semibold text-slate-400 hover:text-primary transition-colors truncate hidden sm:inline-flex items-center gap-1"
                    >
                      {crumb.isHome ? <Home size={14} className="shrink-0" /> : crumb.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Right: search + bell + profile */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">

          {/* Global Navigation Search Bar */}
          <div className="relative" ref={searchContainerRef}>
            <div className="relative group">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                  setSelectedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search pages & modules…"
                className="h-9 w-44 sm:w-56 lg:w-72 xl:w-80 rounded-xl bg-slate-100/80 pl-9 pr-8 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200
                  focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border focus:border-orange-300 border border-transparent font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedIndex(-1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-200 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Navigation Search Results Dropdown */}
            {isSearchOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {searchQuery.trim() ? 'Navigation Results' : 'Suggested Quick Links'}
                  </span>
                </div>

                <div className="max-h-[320px] overflow-y-auto p-1.5 divide-y divide-slate-50">
                  {filteredNavResults.length > 0 ? (
                    filteredNavResults.map((item, index) => {
                      const IconComponent = item.icon || Compass;
                      const isSelected = index === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectNav(item.path)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-orange-50/90 text-orange-900 border border-orange-200/80'
                              : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${
                            isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <IconComponent size={14} />
                          </div>
                          <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                            <p className="text-[13px] font-bold truncate text-slate-800">
                              {item.title}
                            </p>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100/60 shrink-0">
                              {item.category}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 px-4 text-center">
                      <Search size={24} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-700">No matching pages found</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                        No authorized navigation routes found for "{searchQuery}".
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold text-slate-600">↑↓</kbd> navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold text-slate-600 flex items-center gap-0.5">
                      <CornerDownLeft size={10} /> Enter
                    </kbd> open
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Notification bell */}
          <button
            ref={bellButtonRef}
            type="button"
            onClick={togglePanel}
            aria-label="Open notifications"
            aria-expanded={isPanelOpen}
            aria-haspopup="dialog"
            className={[
              'relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-150',
              isPanelOpen
                ? 'bg-orange-50 text-orange-500'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700',
            ].join(' ')}
          >
            <Bell size={17} aria-hidden="true" />
            {unreadCount > 0 ? (
              <span
                aria-label={`${unreadCount} unread notifications`}
                className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center
                  rounded-full bg-red-500 px-[3px] text-[9px] font-bold text-white ring-1 ring-white"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-zinc-200 hidden sm:block mx-1" />

          {/* Profile Dropdown */}
          <div className="flex items-center gap-2">
            <div 
              onClick={handleProfileClick}
              className="flex items-center gap-2 hover:bg-zinc-50 px-2 py-1 rounded-xl transition-colors cursor-pointer group select-none"
            >
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-[13px] font-semibold text-zinc-800 leading-tight truncate max-w-[110px] lg:max-w-[140px] group-hover:text-orange-600 transition-colors">
                  {user?.name || 'Guest'}
                </p>
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider leading-tight">
                  {user?.primaryRole || user?.designation || 'Member'}
                </span>
              </div>

              {/* Avatar */}
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white text-[13px] font-bold shadow-sm ring-2 ring-white overflow-hidden">
                {user?.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() || <User size={15} />
                )}
              </div>
            </div>

            <MuiMenu
              anchorEl={profileAnchorEl}
              open={isProfileMenuOpen}
              onClose={handleProfileClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 4px 20px rgba(0,0,0,0.08))',
                  mt: 1,
                  borderRadius: '12px',
                  minWidth: 160,
                  border: '1px solid #f1f5f9',
                  '& .MuiMenuItem-root': {
                    px: 2,
                    py: 1.5,
                    fontSize: '13px',
                    fontFamily: '"DM Sans", sans-serif',
                    fontWeight: 600,
                    color: '#475569',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#f8fafc',
                    }
                  }
                }
              }}
            >
              <MenuItem onClick={() => { handleProfileClose(); navigate('/profile'); }} sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={16} className="text-zinc-400" />
                My Profile
              </MenuItem>
              <MenuItem 
                onClick={() => { handleProfileClose(); handleLogout(); }}
                disabled={isLoggingOut}
                sx={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444 !important' }}
              >
                {isLoggingOut ? (
                  <Loader2 size={16} className="animate-spin text-primary" />
                ) : (
                  <LogOut size={16} className="text-red-400" />
                )}
                Logout
              </MenuItem>
            </MuiMenu>
          </div>
        </div>
      </header>

      <NotificationPanel
        isOpen={isPanelOpen}
        onClose={closePanel}
        triggerRef={bellButtonRef}
      />
    </>
  );
};

export default Topbar;
