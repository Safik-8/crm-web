import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Briefcase, 
  CheckSquare, 
  Settings,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', path: '/leads', icon: UserPlus },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Deals', path: '/deals', icon: Briefcase },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        !isOpen && "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <span className="text-xl font-black tracking-wider text-primary font-heading italic uppercase">STACKDOT CRM</span>
          <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navItems.map((item) => {
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

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-500 uppercase font-semibold">Project Phase</p>
            <p className="text-sm font-bold text-primary mt-1">Foundation Setup</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
