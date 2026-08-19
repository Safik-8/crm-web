import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import logoOfficial from '../../../assets/logos/logo-official.png';
import { LogOut, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../../app/providers/AuthProvider';
import { getFilteredNavGroups } from '../../../lib/constants/navItems';
import { useActiveTeamQuery } from '../../../features/teams/hooks/useTeams';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ModernSidebar = ({ isOpen, toggleSidebar }) => {
  const { hasPermission, user, logout } = useAuth();
  const { data: activeTeam } = useActiveTeamQuery();
  const location = useLocation();

  const filteredNavGroups = useMemo(
    () => getFilteredNavGroups(user, hasPermission, !!activeTeam?.id),
    [user, hasPermission, activeTeam?.id]
  );

  // Determine active group based on current location
  const [activeGroupName, setActiveGroupName] = useState('');

  const listRef = React.useRef(null);
  const [listIndicatorStyle, setListIndicatorStyle] = React.useState({ top: 0, height: 0, opacity: 0 });

  useEffect(() => {
    let foundGroup = null;
    for (const group of filteredNavGroups) {
      if (group.items.some(item => location.pathname.startsWith(item.path))) {
        foundGroup = group.group;
        break;
      }
    }
    if (foundGroup) {
      setActiveGroupName(foundGroup);
    } else if (filteredNavGroups.length > 0 && !activeGroupName) {
      setActiveGroupName(filteredNavGroups[0].group);
    }
  }, [location.pathname, filteredNavGroups]);

  const activeGroup = filteredNavGroups.find(g => g.group === activeGroupName) || filteredNavGroups[0];

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (listRef.current) {
        const activeEl = listRef.current.querySelector('.active-list-item');
        if (activeEl) {
          const listRect = listRef.current.getBoundingClientRect();
          const activeRect = activeEl.getBoundingClientRect();
          const scrollTop = listRef.current.scrollTop;

          setListIndicatorStyle({
            top: activeRect.top - listRect.top + scrollTop,
            height: activeRect.height,
            opacity: 1
          });
        } else {
          setListIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
        }
      }
    }, 50);
    return () => clearTimeout(timeout);
  }, [location.pathname, activeGroup]);

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
          'fixed inset-y-0 left-0 z-50 flex h-full bg-primary/5 shadow-[1px_0_20px_rgba(0,0,0,0.06)] lg:shadow-none transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
          !isOpen && '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* LEFT RAIL (Groups) */}
        <div className="w-[70px] h-full flex flex-col items-center py-4 shrink-0 z-0 relative">
          {/* Logo */}
          <div className="mb-6 flex justify-center items-center">
            <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-md">
              CRM
            </div>
          </div>

          {/* Groups List */}
          <div className="flex-1 w-full flex flex-col gap-1.5 overflow-y-auto scrollbar-hide py-2">
            {filteredNavGroups.map((group) => {
              const isActive = activeGroupName === group.group;
              const GroupIcon = group.items[0]?.icon;

              return (
                <div key={group.group} className="relative w-full flex justify-end">
                  {/* Seamless active background pill */}
                  {isActive && (
                    <div className="absolute right-0 top-0 bottom-0 w-[92%] bg-white rounded-l-2xl z-0" />
                  )}

                  <button
                    onClick={() => setActiveGroupName(group.group)}
                    className={cn(
                      "relative z-10 w-[92%] py-3.5 flex flex-col items-center gap-1.5 rounded-l-2xl transition-colors",
                      isActive
                        ? "text-primary font-extrabold"
                        : "text-slate-500 hover:text-primary hover:bg-white/40 font-semibold"
                    )}
                  >
                    {GroupIcon && (
                      <GroupIcon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-primary" : ""} />
                    )}
                    <span className="text-[10px] leading-tight text-center px-1">
                      {group.group}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Bottom user / exit */}
          <div className="mt-auto pt-4 flex flex-col items-center gap-4">
            <button
              onClick={logout}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-white hover:text-red-500 transition-colors shadow-sm"
              title="Logout"
            >
              <LogOut size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* RIGHT PANEL (Items) */}
        <div className="w-[200px] bg-white h-full flex flex-col z-10 shrink-0 border-r border-zinc-200/80 rounded-l-2xl">
          {/* Logo */}
          <div className="px-2 pt-4 pb-6 flex items-center">
            <img
              src={logoOfficial}
              alt="StackCode Logo"
              className="h-11 w-auto object-contain transition-all duration-300 hover:opacity-80"
            />
          </div>

          {/* Items List */}
          <div ref={listRef} className="flex-1 relative overflow-y-auto px-3 pb-4 space-y-1">
            {/* Floating indicator */}
            <div
              className="absolute left-3 right-3 bg-primary/10 shadow-sm rounded-md transition-all duration-300 ease-in-out pointer-events-none z-0"
              style={{
                top: listIndicatorStyle.top,
                height: listIndicatorStyle.height,
                opacity: listIndicatorStyle.opacity
              }}
            />

            {activeGroup?.items.map((item) => {
              const ItemIcon = item.icon;
              const isSubActive = item.path !== '/' && (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`));
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => cn(
                    "relative z-10 flex items-center gap-3 px-4 py-2 rounded-md text-[13px] font-bold transition-colors duration-200",
                    (isActive || isSubActive)
                      ? "text-primary active-list-item"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  )}
                >
                  {({ isActive }) => {
                    const active = isActive || isSubActive;
                    return (
                      <>
                        <ItemIcon size={18} strokeWidth={active ? 2.5 : 2} />
                        <span className="truncate">{item.name}</span>
                      </>
                    );
                  }}
                </NavLink>
              );
            })}
          </div>

          {/* Banner Ad */}
          <div className="p-2 mt-auto">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded p-2 relative overflow-hidden group cursor-pointer border border-primary/20 shadow-sm hover:shadow-md transition-all">
              <div className="relative z-10">
                <h4 className="font-extrabold text-slate-800 text-[14px]">For Business</h4>
                <p className="text-[11px] font-semibold text-slate-500 mt-1 leading-tight">
                  Elevate your CRM with Pro features
                </p>
              </div>
              <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all" />
              <div className="absolute right-2 top-2 h-6 w-6 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-[10px] shadow-sm transform group-hover:scale-110 transition-transform">
                Pro
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default ModernSidebar;
