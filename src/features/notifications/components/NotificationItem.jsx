/**
 * NotificationItem
 *
 * A single row inside the notification panel.
 * Handles its own hover state and calls back to the parent for
 * mark-as-read — keeping the item itself stateless and pure.
 *
 * Design tokens used:
 *  - primary (#F86F03) for unread indicator dot and icon tint
 *  - slate palette for text hierarchy
 *  - rounded-xl, shadow-sm — matches card conventions across the CRM
 */

import { memo } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  UserPlus,
  FileText,
  Activity,
} from 'lucide-react';

// ── Icon resolver ─────────────────────────────────────────────────────────────
// Maps notification `type` strings to a Lucide icon + colour class.
const TYPE_CONFIG = {
  success:    { Icon: CheckCircle2,  colour: 'text-emerald-500', bg: 'bg-emerald-50' },
  warning:    { Icon: AlertTriangle, colour: 'text-amber-500',   bg: 'bg-amber-50'   },
  error:      { Icon: AlertTriangle, colour: 'text-red-500',     bg: 'bg-red-50'     },
  info:       { Icon: Info,          colour: 'text-sky-500',     bg: 'bg-sky-50'     },
  user:       { Icon: UserPlus,      colour: 'text-violet-500',  bg: 'bg-violet-50'  },
  report:     { Icon: FileText,      colour: 'text-primary',     bg: 'bg-primary/8'  },
  activity:   { Icon: Activity,      colour: 'text-primary',     bg: 'bg-primary/8'  },
  default:    { Icon: Bell,          colour: 'text-slate-500',   bg: 'bg-slate-100'  },
};

// ── Relative time formatter ───────────────────────────────────────────────────
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// ── Component ─────────────────────────────────────────────────────────────────
const NotificationItem = memo(({ notification, onMarkAsRead }) => {
  const id        = notification.id ?? notification._id;
  const isRead    = notification.isRead ?? notification.read ?? false;
  const title     = notification.title   ?? notification.subject ?? 'Notification';
  const message   = notification.message ?? notification.body    ?? '';
  const type      = notification.type    ?? 'default';
  const createdAt = notification.createdAt ?? notification.timestamp ?? null;

  const { Icon, colour, bg } = TYPE_CONFIG[type] ?? TYPE_CONFIG.default;

  const handleClick = () => {
    if (!isRead) onMarkAsRead(id);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        'w-full text-left flex items-start gap-3 px-4 py-3.5 transition-colors duration-150',
        'hover:bg-slate-50 focus-visible:outline-none focus-visible:bg-slate-50',
        isRead ? 'opacity-70' : '',
      ].join(' ')}
      aria-label={`${isRead ? '' : 'Unread: '}${title}`}
    >
      {/* Type icon */}
      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg}`}>
        <Icon size={15} className={colour} aria-hidden="true" />
      </span>

      {/* Content */}
      <span className="flex-1 min-w-0 space-y-0.5">
        <span className="flex items-center gap-1.5">
          <span className={`block text-sm leading-snug truncate ${isRead ? 'font-medium text-slate-600' : 'font-semibold text-slate-800'}`}>
            {title}
          </span>
          {/* Unread dot */}
          {!isRead && (
            <span
              className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              aria-hidden="true"
            />
          )}
        </span>
        {message && (
          <span className="block text-xs text-slate-500 leading-relaxed line-clamp-2">
            {message}
          </span>
        )}
      </span>

      {/* Timestamp */}
      {createdAt && (
        <span className="shrink-0 text-[10px] font-medium text-slate-400 mt-0.5 whitespace-nowrap">
          {formatRelativeTime(createdAt)}
        </span>
      )}
    </button>
  );
});

NotificationItem.displayName = 'NotificationItem';

export default NotificationItem;
