/**
 * NotificationPanel
 *
 * Floating notification center anchored to the Bell icon in the Topbar.
 * Renders via ReactDOM.createPortal into document.body.
 *
 * Z-index layering:
 *   Backdrop   → 9990
 *   Panel      → 9991
 *   GlobalLoader → 9998
 *   Sonner toasts → 9999
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Inbox, Clock, CheckCheck, ChevronDown, Trash2, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationItem from './NotificationItem';
import NotificationSkeleton from './NotificationSkeleton';

// ── Notification Helpers ──────────────────────────────────────────────────────
const mapNotification = (n) => ({
  id:               n.id,
  notificationType: n.notificationType,
  message:          n.message,
  isRead:           n.status === 'READ',
  createdAt:        n.createdAt,
  // Scope context — populated when NOTIFICATION_INCLUDE fetches company/branch
  company:          n.company ?? null,
  branch:           n.branch  ?? null,
});

// ── Panel component ───────────────────────────────────────────────────────────

const NotificationPanel = ({ isOpen, onClose, triggerRef }) => {
  const panelRef      = useRef(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const [isMobile, setIsMobile]     = useState(false);
  const [animState, setAnimState]   = useState('closed');
  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = useState(false);
  const closeTimerRef = useRef(null);

  const {
    notifications, isLoading, isLoadingMore, hasError, hasMore, unreadCount,
    loadNotifications, cancelFetch, markAsRead, markAllAsRead, deleteItem, deleteAllItems, loadMore, refresh,
  } = useNotifications();
  const [activeFilter, setActiveFilter] = useState('all');

  const displayItems = activeFilter === 'unread'
    ? notifications.filter((n) => n.status === 'UNREAD' && !n.isRead)
    : notifications;


  // ── Detect mobile ──────────────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // ── Position calculation (desktop only) ───────────────────────────────────
  const recalcPosition = useCallback(() => {
    if (isMobile || !triggerRef?.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top:   rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  }, [isMobile, triggerRef]);

  // ── Open / close lifecycle ─────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      clearTimeout(closeTimerRef.current);
      recalcPosition();
      setAnimState('entering');
      requestAnimationFrame(() => setAnimState('open'));
      loadNotifications({ force: true });
    } else {
      if (animState === 'closed') return;
      setAnimState('closing');
      closeTimerRef.current = setTimeout(() => setAnimState('closed'), 220);
      cancelFetch();
    }

    return () => clearTimeout(closeTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Recalculate position on resize / scroll
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', recalcPosition, { passive: true });
    window.addEventListener('scroll', recalcPosition, { passive: true, capture: true });
    return () => {
      window.removeEventListener('resize', recalcPosition);
      window.removeEventListener('scroll', recalcPosition, { capture: true });
    };
  }, [isOpen, recalcPosition]);

  // ── ESC key ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // ── Focus management ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && panelRef.current) {
      // Move focus into the panel so keyboard users can navigate immediately
      panelRef.current.focus();
    }
  }, [isOpen]);

  // Don't render anything when fully closed (saves DOM nodes)
  if (animState === 'closed') return null;

  // ── Panel style ────────────────────────────────────────────────────────────
  const panelStyle = isMobile
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9991,
        maxHeight: '80dvh',
      }
    : {
        position: 'fixed',
        top:   pos.top,
        right: pos.right,
        width: 380,
        maxHeight: 'min(460px, calc(100dvh - 80px))',
        zIndex: 9991,
      };

  // ── Animation class ────────────────────────────────────────────────────────
  const animClass = isMobile
    ? animState === 'open' ? 'notif-panel-mobile--open' : 'notif-panel-mobile--close'
    : animState === 'open' ? 'notif-panel--open'        : 'notif-panel--close';

  // ── Render ─────────────────────────────────────────────────────────────────
  return createPortal(
    <>
      {/* Transparent backdrop — click to close */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 9990 }}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        tabIndex={-1}
        style={panelStyle}
        className={[
          'flex flex-col bg-white outline-none',
          isMobile
            ? 'rounded-t-2xl border-t border-slate-200 shadow-[0_-8px_40px_rgba(0,0,0,0.12)]'
            : 'rounded-2xl border border-slate-200 shadow-[0_8px_40px_rgba(0,0,0,0.12)]',
          animClass,
        ].join(' ')}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-primary" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-800 font-heading">
              Notifications
            </h2>
          </div>

          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => setShowConfirmDeleteAll((prev) => !prev)}
                title="Clear all notifications"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                aria-label="Clear all notifications"
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="Close notifications"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── Filter tabs & Mark Read action ──────────────────────── */}
        <div className="flex items-center justify-between px-3 pt-2 pb-1.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-1">
            {['all', 'unread'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={[
                  'px-3 py-1 text-[11px] font-semibold rounded-lg transition-colors capitalize',
                  activeFilter === f ? 'bg-primary/8 text-primary' : 'text-slate-400 hover:text-slate-600',
                ].join(' ')}
              >
                {f}
                {f === 'unread' && unreadCount > 0 && (
                  <span className="ml-1 rounded-full bg-red-500 text-white text-[9px] px-1.5 py-px font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/5 rounded-md transition-colors"
            >
              <CheckCheck size={13} aria-hidden="true" />
              Mark all read
            </button>
          )}
        </div>

        {/* ── Inline Clear All Confirmation Banner ─────────────────── */}
        {showConfirmDeleteAll && (
          <div className="bg-rose-50 border-b border-rose-100 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle size={15} className="text-rose-500 shrink-0" aria-hidden="true" />
              <p className="text-xs font-semibold text-rose-900 truncate">
                Clear all notifications from inbox?
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowConfirmDeleteAll(false)}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-800 hover:bg-rose-100/70 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAllItems();
                  setShowConfirmDeleteAll(false);
                }}
                className="px-3 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-sm transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        )}

        {/* ── Body ──────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 max-h-[310px] overflow-y-auto divide-y divide-slate-50">
          {isLoading && <NotificationSkeleton count={3} />}

          {!isLoading && hasError && (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <p className="text-sm text-slate-500">Failed to load notifications</p>
              <button type="button" onClick={refresh}
                className="text-xs font-semibold text-primary hover:underline">
                Retry
              </button>
            </div>
          )}

          {!isLoading && !hasError && displayItems.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/8">
                <Inbox size={26} className="text-primary/50" aria-hidden="true" />
              </span>
              <div className="space-y-1.5 max-w-[220px]">
                <p className="text-sm font-semibold text-slate-700">
                  {activeFilter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {activeFilter === 'unread'
                    ? 'No unread notifications.'
                    : 'Follow-up reminders and alerts will appear here.'}
                </p>
              </div>
            </div>
          )}

          {!isLoading && !hasError && displayItems.length > 0 &&
            displayItems.map((n) => (
              <NotificationItem
                key={n.id}
                notification={mapNotification(n)}
                onMarkAsRead={markAsRead}
                onDelete={deleteItem}
              />
            ))
          }

          {/* ── Load Older button ──────────────────────────────────── */}
          {!isLoading && !hasError && hasMore && activeFilter !== 'unread' && (
            <div className="py-3 flex justify-center border-t border-slate-50">
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors',
                  isLoadingMore
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-400 hover:text-primary hover:bg-primary/5',
                ].join(' ')}
              >
                {isLoadingMore ? (
                  <>
                    <Clock size={11} className="animate-spin" aria-hidden="true" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown size={11} aria-hidden="true" />
                    Load older notifications
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-slate-100 px-4 py-2 flex items-center justify-between">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            {notifications.length > 0
              ? `${notifications.length} notification${notifications.length === 1 ? '' : 's'}`
              : 'No notifications'}
          </p>
          {isMobile && (
            <div className="h-1 w-10 rounded-full bg-slate-200 mx-auto" aria-hidden="true" />
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default NotificationPanel;
