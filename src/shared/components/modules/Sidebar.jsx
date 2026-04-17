import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Briefcase,
  CheckSquare,
  Settings,
  X,
  Activity,
  PlayCircle,
  BarChart3,
  ClipboardCheck,
  Users2,
  Building2,
  PieChart,
  Target,
  Bell,
  ClipboardList,
  GitBranch,
  Kanban,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../../app/providers/AuthProvider';
import { PERMISSIONS } from '../../../lib/constants/permissions';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: PERMISSIONS.VIEW_DASHBOARD },
  //{ name: 'Company Dashboard', path: '/dashboard/company', icon: PieChart, permission: PERMISSIONS.VIEW_COMPANY_DASHBOARD },

  // Settings
  { name: 'Company Setup', path: '/settings/company', icon: Building2, permission: PERMISSIONS.VIEW_COMPANY_SETUP },
  //{ name: 'Settings', path: '/settings', icon: Settings, permission: PERMISSIONS.VIEW_SETTINGS },

  // Pipeline
  // { name: 'Leads', path: '/leads', icon: UserPlus, permission: PERMISSIONS.VIEW_LEADS },
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
  //{ name: 'Team Reports', path: '/reports/team', icon: BarChart3, permission: PERMISSIONS.VIEW_TEAM_REPORTS },
  { name: 'Reports', path: '/reports', icon: BarChart3, permission: PERMISSIONS.VIEW_REPORTS },

  // System Tools
  //{ name: 'Notifications', path: '/notifications', icon: Bell, permission: PERMISSIONS.VIEW_NOTIFICATIONS },
  { name: 'Audit Logs', path: '/audit', icon: ClipboardList, permission: PERMISSIONS.VIEW_AUDIT },
  { name: 'Transfer Approvals', path: '/approvals', icon: ClipboardCheck, permission: PERMISSIONS.APPROVE_TRANSFERS },
  { name: 'User Management', path: '/users', icon: Users2, permission: PERMISSIONS.VIEW_USERS },


];

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { hasPermission, user } = useAuth();

  // Build nav items dynamically — inject Branches link using the user's own companyId
  const allNavItems = React.useMemo(() => {
    const items = [...navItems];

    // Derive companyId from user profile (handle both nested and flat shapes)
    const companyId = user?.company?.id || user?.companyId;
    if (companyId) {
      const companySetupIndex = items.findIndex(i => i.path === '/settings/company');
      const branchItem = {
        name: 'Branches',
        path: `/companies/${companyId}/branches`,
        icon: GitBranch,
        permission: PERMISSIONS.VIEW_BRANCHES  // Uses BRANCH.canView — accessible to all branch roles
      };
      items.splice(companySetupIndex + 1, 0, branchItem);
    }

    return items;
  }, [user?.company?.id, user?.companyId]);

  const filteredNavItems = allNavItems.filter(item =>
    !item.permission || hasPermission(item.permission)
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col h-full overflow-hidden",
        !isOpen && "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Header (STATIC) */}
      <div className="flex h-20 items-center justify-between px-6 border-b border-white/5 shrink-0 relative overflow-hidden bg-black/95 backdrop-blur-xl">
        {/* Subtle ambient glow behind logo */}
        <div className="absolute top-1/2 left-0 w-32 h-16 bg-primary/20 blur-[30px] rounded-full pointer-events-none"></div>
        
        <div className="flex-1 flex items-center h-full z-10">
          <img 
            src="/logos/logo-official.png" 
            alt="StackCode" 
            className=" w-auto object-contain invert hue-rotate-180 transition-all duration-500 hover:scale-[1.02] mix-blend-screen" 
            style={{ paddingTop: '10px' }}
          />
        </div>
        <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white z-10 transition-colors p-1.5 hover:bg-white/10 rounded-lg ml-2">
          <X size={24} />
        </button>
      </div>

      {/* Navigation (SCROLLABLE) */}
      <nav className="flex-1 overflow-y-auto h-0 space-y-1 p-4 scrollbar-hide" style={{ backgroundColor:'black' }}>
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group",
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )
              }
            >
              <Icon size={20} className="shrink-0 transition-transform group-hover:scale-110" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer (STATIC) */}
      <div className="p-4 border-t border-slate-800 shrink-0" style={{ backgroundColor:'black' }}>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-500 uppercase font-semibold">User Access</p>
          <p className="text-sm font-bold text-primary mt-1">Role-Based Secured</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;