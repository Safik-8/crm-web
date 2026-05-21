import React from 'react';
import { NavLink } from 'react-router-dom';
import logoOfficial from '../../../assets/logos/logo-official.png';
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

import { getFilteredNavItems } from '../../../lib/constants/navItems';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { hasPermission, user } = useAuth();
  
  const filteredNavItems = React.useMemo(() => 
    getFilteredNavItems(user, hasPermission), 
    [user, hasPermission]
  );


  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col h-full overflow-hidden",
        !isOpen && "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Header (STATIC) */}
      <div className="flex h-20 items-center justify-between p-6   border-b border-white/5 shrink-0 relative overflow-hidden bg-white backdrop-blur-xl">
        {/* Subtle ambient glow behind logo */}
        <div className="absolute top-1/2 left-0 w-32 h-16 blur-[30px] rounded-full pointer-events-none"></div>
        
        <div className="flex-1 flex items-center h-full z-10">
          <img 
            src={logoOfficial} 
            alt="StackCode" 
            className="w-auto object-contain  transition-all duration-500 hover:scale-[1.02] " 
            style={{ paddingTop: '10px' }}
          />
        </div>
        <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white z-10 transition-colors p-1.5 hover:bg-white/10 rounded-lg ml-2">
          <X size={24} />
        </button>
      </div>

      {/* Navigation (SCROLLABLE) */}
      <nav className="flex-1 overflow-y-auto h-0 bg-white space-y-1 p-4 scrollbar-hide">
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
                    ? "bg-orange-50  text-white shadow text-orange-500"
                    : "text-slate-400 hover:bg-orange-500/5  hover:text-orange-500"
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
      <div className="p-4 border-t border-slate-800 shrink-0" style={{ backgroundColor:'white' }}>
        <div className="bg-orange-50 shadow-inner rounded-lg p-3">
          <p className="text-xs text-slate-500 uppercase font-black">User Access</p>
          <p className="text-sm font-bold text-primary mt-1">Role-Based Secured</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;