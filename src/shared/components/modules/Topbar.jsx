import { useRef, useState, useCallback } from 'react';
import { Search, Bell, Menu, User, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import NotificationPanel from '../../../features/notifications/components/NotificationPanel.jsx';

const Topbar = ({ toggleSidebar, pageTitle }) => {
  const { logout, user, isLoggingOut } = useAuth();
  const navigate = useNavigate();

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const bellButtonRef = useRef(null);

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

  return (
    <>
      <header className="sticky top-0 z-40 flex h-[60px] w-full items-center justify-between border-b border-zinc-200/70 bg-white/80 px-4 sm:px-5 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]">

        {/* Left: hamburger + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors lg:hidden shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
          <h2 className="text-[15px] font-semibold text-zinc-800 tracking-tight truncate">
            {pageTitle || 'Overview'}
          </h2>
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
            <span
              className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-white"
              aria-hidden="true"
            />
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-zinc-200 hidden sm:block mx-1" />

          {/* Profile */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-[13px] font-semibold text-zinc-800 leading-tight truncate max-w-[110px] lg:max-w-[140px]">
                {user?.name || 'Guest'}
              </p>
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider leading-tight">
                {user?.primaryRole || user?.designation || 'Member'}
              </span>
            </div>

            {/* Avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white text-[13px] font-bold shadow-sm ring-2 ring-white cursor-pointer hover:bg-zinc-700 transition-colors">
              {user?.name?.charAt(0)?.toUpperCase() || <User size={15} />}
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center justify-center w-8 h-8 rounded-xl text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-400"
              title={isLoggingOut ? 'Signing out…' : 'Log out'}
              aria-label={isLoggingOut ? 'Signing out, please wait' : 'Log out'}
              aria-busy={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 size={16} className="animate-spin text-primary" aria-hidden="true" />
              ) : (
                <LogOut size={16} aria-hidden="true" />
              )}
            </button>
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
