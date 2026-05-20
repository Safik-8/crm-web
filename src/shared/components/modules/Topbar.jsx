import { useRef, useState, useCallback } from 'react';
import { Search, Bell, Menu, User, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import NotificationPanel from '../../../features/notifications/components/NotificationPanel.jsx';

const Topbar = ({ toggleSidebar, pageTitle }) => {
  const { logout, user, isLoggingOut } = useAuth();
  const navigate = useNavigate();

  // ── Notification panel state ───────────────────────────────────────────────
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  // Ref passed to the panel so it can anchor its position to this button
  const bellButtonRef = useRef(null);

  const openPanel  = useCallback(() => setIsPanelOpen(true),  []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);

  const togglePanel = useCallback(() => {
    setIsPanelOpen((prev) => !prev);
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (isLoggingOut) return;
    toast.loading('Signing you out…', { id: 'logout' });
    await logout();
    toast.success('Signed out successfully', { id: 'logout' });
    navigate('/login', { replace: true });
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 sm:h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-3 sm:px-6 backdrop-blur-md">
        {/* Left section: Toggle & Title */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden shrink-0"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-base sm:text-lg font-semibold text-slate-800 capitalize tracking-tight truncate">
            {pageTitle || 'Overview'}
          </h2>
        </div>

        {/* Right section: Search, Notifications, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 shrink-0">
          {/* Search placeholder — hidden on mobile */}
          <div className="hidden md:block">
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Search..."
                className="h-10 w-48 lg:w-64 xl:w-80 rounded-full bg-slate-100 pl-10 pr-4 text-sm outline-none transition-all focus:bg-white focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Notification bell — opens floating panel, never navigates */}
          <button
            ref={bellButtonRef}
            type="button"
            onClick={togglePanel}
            aria-label="Open notifications"
            aria-expanded={isPanelOpen}
            aria-haspopup="dialog"
            className={[
              'relative rounded-full p-2 transition-colors',
              isPanelOpen
                ? 'bg-primary/10 text-primary'
                : 'text-slate-500 hover:bg-slate-100',
            ].join(' ')}
          >
            <Bell size={20} aria-hidden="true" />
            {/* Unread indicator dot — always visible until panel is opened */}
            <span
              className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-white"
              aria-hidden="true"
            />
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />

          {/* Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-800 font-heading leading-tight italic truncate max-w-[120px] lg:max-w-none">
                {user?.name || 'Guest User'}
              </p>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-full mt-0.5 border border-primary/10 truncate">
                {user?.primaryRole || user?.designation || 'Unknown Role'}
              </p>
            </div>
            <div className="group relative">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-slate-900 shadow-lg shadow-slate-200 text-white transition-all hover:scale-105 cursor-pointer ring-2 ring-white">
                <User size={18} className="sm:w-5 sm:h-5" />
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-xl p-2 sm:p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all group shrink-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
              title={isLoggingOut ? 'Signing out…' : 'Log out'}
              aria-label={isLoggingOut ? 'Signing out, please wait' : 'Log out'}
              aria-busy={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2
                  size={18}
                  className="sm:w-5 sm:h-5 animate-spin text-primary"
                  aria-hidden="true"
                />
              ) : (
                <LogOut
                  size={18}
                  className="sm:w-5 sm:h-5 group-active:scale-95 transition-transform"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Floating notification panel — rendered via portal into document.body */}
      <NotificationPanel
        isOpen={isPanelOpen}
        onClose={closePanel}
        triggerRef={bellButtonRef}
      />
    </>
  );
};

export default Topbar;
