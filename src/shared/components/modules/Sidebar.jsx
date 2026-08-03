import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import logoOfficial from '../../../assets/logos/logo-official.png';
import { X, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../../app/providers/AuthProvider';
import { getFilteredNavGroups } from '../../../lib/constants/navItems';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { hasPermission, user } = useAuth();

  const filteredNavGroups = React.useMemo(
    () => getFilteredNavGroups(user, hasPermission),
    [user, hasPermission]
  );

  const [expandedGroups, setExpandedGroups] = React.useState({});
  
  const toggleGroup = (groupName) => {
    if (!groupName) return;
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: prev[groupName] === false ? true : false
    }));
  };

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
        <div className="flex h-[60px] items-center justify-between  border-b border-zinc-100 shrink-0">
          <div className="flex p-4 items-center justify-start h-full flex-1 min-w-0">
            <img
              src={logoOfficial}
              alt="StackCode"
              className="w-auto p-4 object-contain transition-all duration-300 hover:opacity-80"
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
        <nav className="flex-1 overflow-y-auto h-0 px-2.5 py-3 space-y-4 scrollbar-hide">
          {filteredNavGroups.map((group, groupIdx) => {
            const expanded = expandedGroups[group.group] !== false;

            return (
            <div key={groupIdx} className="flex flex-col">
              {group.group && (
                <div 
                  onClick={() => toggleGroup(group.group)}
                  className="px-3 mb-1.5 flex items-center justify-between cursor-pointer group/header"
                >
                  <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 group-hover/header:text-slate-500 transition-colors">
                    {group.group}
                  </h3>
                  <ChevronDown 
                    size={12} 
                    className={cn(
                      "text-slate-400 transition-transform duration-300", 
                      !expanded && "-rotate-90"
                    )} 
                  />
                </div>
              )}
              
              <div 
                className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const hasChildren = item.children && item.children.length > 0;
                    const isTabBranch = location.pathname === item.path && (location.search.includes('tab=branch') || location.search.includes('tab=branches'));

                return (
                  <React.Fragment key={item.path}>
                    <NavLink
                      to={item.path}
                      end={!hasChildren}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 relative',
                          (isActive && (!hasChildren || !isTabBranch))
                            ? 'bg-orange-50 text-orange-600 font-semibold'
                            : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'
                        )
                      }
                    >
                      {({ isActive }) => {
                        const active = isActive && (!hasChildren || !isTabBranch);
                        return (
                          <>
                            <span
                              className={cn(
                                'absolute left-0 w-[3px] h-5 rounded-r-full transition-all duration-200',
                                active ? 'bg-orange-500 opacity-100' : 'opacity-0'
                              )}
                            />
                            <Icon
                              size={16}
                              strokeWidth={active ? 2.2 : 1.8}
                              className={cn(
                                'shrink-0 transition-colors duration-150',
                                active ? 'text-orange-500' : 'text-zinc-400 group-hover:text-zinc-600'
                              )}
                            />
                            <span className="truncate font-bold">{item.name}</span>
                          </>
                        );
                      }}
                    </NavLink>

                    {hasChildren && item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = location.pathname === item.path && isTabBranch;

                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={cn(
                            'group flex items-center gap-2.5 ml-4 pl-3 pr-3 py-1.5 rounded-xl text-[12px] font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 relative border-l-2',
                            isChildActive
                              ? 'bg-orange-50/70 text-orange-600 font-semibold border-orange-500'
                              : 'text-zinc-500 border-zinc-200/80 hover:bg-zinc-50 hover:text-zinc-800 hover:border-zinc-300'
                          )}
                        >
                          <ChildIcon
                            size={14}
                            strokeWidth={isChildActive ? 2.2 : 1.8}
                            className={cn(
                              'shrink-0 transition-colors duration-150',
                              isChildActive ? 'text-orange-500' : 'text-zinc-400 group-hover:text-zinc-600'
                            )}
                          />
                          <span className="truncate font-bold">{child.name}</span>
                        </NavLink>
                      );
                    })}
                  </React.Fragment>
                );
              })}
                </div>
              </div>
            </div>
          )})}
        </nav>

        {/* ── Footer ── */}
        <div className="shrink-0 px-3 py-3 border-t border-zinc-100">
          <Link
            to="/profile"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 transition-colors cursor-pointer group/footer block"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-100 shrink-0 group-hover/footer:bg-orange-200 transition-colors">
                {user?.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt="User"
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                ) : (
                  <span className="text-orange-600 text-[10px] font-black">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-zinc-800 truncate leading-tight group-hover/footer:text-orange-600 transition-colors">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] font-semibold text-orange-500 truncate leading-tight mt-0.5">
                  {user?.primaryRole || user?.designation || 'Member'}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
