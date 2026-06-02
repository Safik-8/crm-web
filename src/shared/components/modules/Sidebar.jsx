import React from 'react';
import { NavLink } from 'react-router-dom';
import logoOfficial from '../../../assets/logos/logo-official.png';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../../app/providers/AuthProvider';
import { getFilteredNavItems } from '../../../lib/constants/navItems';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { hasPermission, user } = useAuth();

  const filteredNavItems = React.useMemo(
    () => getFilteredNavItems(user, hasPermission),
    [user, hasPermission]
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col h-full w-[220px] bg-white border-r border-zinc-200/80',
          'shadow-[1px_0_20px_rgba(0,0,0,0.06)] transition-transform duration-300 ease-in-out',
          'lg:relative lg:translate-x-0 lg:shadow-none',
          !isOpen && '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* ── Logo header ── */}
        <div className="flex h-[60px] items-center justify-between px-4 border-b border-zinc-100 shrink-0">
          <div className="flex items-center h-full flex-1 min-w-0">
            <img
              src={logoOfficial}
              alt="StackCode"
              className="w-auto  object-contain transition-all duration-300 hover:opacity-80"
            />
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors ml-2 shrink-0"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto h-0 px-2.5 py-3 space-y-0.5 scrollbar-hide">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                    isActive
                      ? 'bg-orange-50 text-orange-600 font-semibold'
                      : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Left accent line */}
                    <span
                      className={cn(
                        'absolute left-0 w-[3px] h-5 rounded-r-full transition-all duration-200',
                        isActive ? 'bg-orange-500 opacity-100' : 'opacity-0'
                      )}
                    />
                    <Icon
                      size={16}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      className={cn(
                        'shrink-0 transition-colors duration-150',
                        isActive ? 'text-orange-500' : 'text-zinc-400 group-hover:text-zinc-600'
                      )}
                    />
                    <span className="truncate font-bold">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── Footer ── */}
        <div className="shrink-0 px-3 py-3 border-t border-zinc-100">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-100 shrink-0">
              <span className="text-orange-600 text-[10px] font-black">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-zinc-800 truncate leading-tight">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] font-semibold text-orange-500 truncate leading-tight mt-0.5">
                {user?.primaryRole || user?.designation || 'Member'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
