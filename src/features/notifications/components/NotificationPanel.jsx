/**
 * NotificationPanel
 *
 * Floating notification center anchored to the Bell icon in the Topbar.
 * Renders via ReactDOM.createPortal into document.body.
 *
 * Backend integration is pending — currently shows a placeholder empty state.
 * When the API is ready, wire in useNotifications hook and NotificationItem/
 * NotificationSkeleton components (already scaffolded in this feature folder).
 *
 * Z-index layering:
 *   Backdrop   → 9990
 *   Panel      → 9991
 *   GlobalLoader → 9998
 *   Sonner toasts → 9999
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Inbox, Clock } from 'lucide-react';

// ── Panel component ───────────────────────────────────────────────────────────

const NotificationPanel = ({ isOpen, onClose, triggerRef }) => {
  const panelRef      = useRef(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const [isMobile, setIsMobile]     = useState(false);
  const [animState, setAnimState]   = useState('closed');
  const closeTimerRef = useRef(null);

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
    } else {
      if (animState === 'closed') return;
      setAnimState('closing');
      closeTimerRef.current = setTimeout(() => setAnimState('closed'), 220);
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
        maxHeight: 'calc(100dvh - 80px)',
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

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close notifications"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        {/* ── Body — placeholder (backend pending) ────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
          {/* Icon */}
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/8">
            <Inbox size={26} className="text-primary/50" aria-hidden="true" />
          </span>

          {/* Copy */}
          <div className="space-y-1.5 max-w-[220px]">
            <p className="text-sm font-semibold text-slate-700">
              Notifications coming soon
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              This feature is currently being built. Check back once the backend is ready.
            </p>
          </div>

          {/* "Coming soon" badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary">
            <Clock size={11} aria-hidden="true" />
            In development
          </span>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-slate-100 px-4 py-2.5 flex items-center justify-between">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            No notifications
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
