import { useRef, useState, useCallback } from 'react';
import { Search, Bell, Menu, User, LogOut, Loader2, ChevronRight, Home } from 'lucide-react';
import { Menu as MuiMenu, MenuItem } from '@mui/material';
import { useAuth } from '../../../app/providers/AuthProvider.jsx';
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
};

const buildBreadcrumbs = (pathname, search, state) => {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = [];

  // Home root
  crumbs.push({
    label: 'Home',
    path: '/dashboard/branch',
    isHome: true
  });

  let currentPath = '';

  // Special Handling for Opportunities Detail Route (/opportunities/:id)
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

const Topbar = ({ toggleSidebar, pageTitle }) => {
  const { logout, user, isLoggingOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const bellButtonRef = useRef(null);
  const { unreadCount } = useNotificationBadge();

  const crumbs = buildBreadcrumbs(location.pathname, location.search, location.state);

  const openPanel  = useCallback(() => setIsPanelOpen(true),  []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);
  const togglePanel = useCallback(() => setIsPanelOpen((prev) => !prev), []);

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
      <header className="sticky top-0 z-40 flex h-[60px] w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-5 backdrop-blur-xl ">

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

          {/* Search — hidden on mobile */}
          <div className="hidden md:block">
            <div className="relative group">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search…"
                className="h-8 w-44 lg:w-56 xl:w-72 rounded-xl bg-zinc-100 pl-9 pr-4 text-[13px] text-zinc-700 placeholder:text-zinc-400 outline-none transition-all duration-200
                  focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border focus:border-orange-200/60 focus:w-52 lg:focus:w-64 xl:focus:w-80"
              />
            </div>
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
