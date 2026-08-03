/**
 * NotificationItem
 *
 * A single row inside the notification panel.
 * Handles its own hover state and calls back to the parent for
 * mark-as-read and delete — keeping the item itself stateless and pure.
 *
 * Prefix parsing convention:
 *  Backend writes: "[SCHEDULED] Follow-up scheduled..."
 *  This component strips the prefix for display and uses it to pick
 *  the correct icon + colour — zero schema migrations required.
 *
 * Scope badge logic:
 *  - SA  → shows [Company • Branch]
 *  - CA  → shows [Branch] (company is implicit for CA)
 *  - BDE / ISE / BM → no badge (they know their own context)
 *  Detection: simply checks if notification.company.name is present.
 */

import { memo } from 'react';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  CalendarPlus,
  UserPlus,
  Trash2,
} from 'lucide-react';

// ── Prefix → icon / colour / title config ────────────────────────────────────
// Maps the [PREFIX] tag embedded in message strings to display config.
const PREFIX_CONFIG = {
  '[SCHEDULED]': {
    Icon:   CalendarPlus,
    colour: 'text-indigo-500',
    bg:     'bg-indigo-50',
    title:  'Follow-up Scheduled',
  },
  '[COMPLETED]': {
    Icon:   CheckCircle2,
    colour: 'text-emerald-500',
    bg:     'bg-emerald-50',
    title:  'Follow-up Completed',
  },
  '[CANCELLED]': {
    Icon:   XCircle,
    colour: 'text-rose-500',
    bg:     'bg-rose-50',
    title:  'Follow-up Cancelled',
  },
  '[REMINDER]': {
    Icon:   Clock,
    colour: 'text-amber-500',
    bg:     'bg-amber-50',
    title:  'Follow-up Reminder',
  },
  '[OVERDUE]': {
    Icon:   AlertTriangle,
    colour: 'text-red-500',
    bg:     'bg-red-50',
    title:  'Overdue Follow-up',
  },
};

// ── Fallback config per notificationType (no prefix) ─────────────────────────
const FALLBACK_CONFIG = {
  REMINDER:         { Icon: Clock,         colour: 'text-amber-500',  bg: 'bg-amber-50',   title: 'Follow-up Reminder'  },
  OVERDUE_ALERT:    { Icon: AlertTriangle,  colour: 'text-red-500',    bg: 'bg-red-50',     title: 'Overdue Follow-up'   },
  FOLLOWUP_ALERT:   { Icon: Bell,           colour: 'text-indigo-500', bg: 'bg-indigo-50',  title: 'Follow-up Update'    },
  ASSIGNMENT_ALERT: { Icon: UserPlus,       colour: 'text-violet-500', bg: 'bg-violet-50',  title: 'Lead Assigned'       },
  default:          { Icon: Bell,           colour: 'text-slate-500',  bg: 'bg-slate-100',  title: 'Notification'        },
};

// ── Prefix & Keyword Extractor ────────────────────────────────────────────────
/**
 * Strips the [PREFIX] tag from a message string and resolves display config.
 * Falls back to keyword matching for legacy notifications without prefixes.
 * Returns { cleanMessage, config }
 */
const parseMessage = (message, notificationType) => {
  if (typeof message === 'string') {
    // 1. Check explicit prefix tag
    for (const prefix of Object.keys(PREFIX_CONFIG)) {
      if (message.startsWith(prefix)) {
        return {
          cleanMessage: message.slice(prefix.length).trim(),
          config: PREFIX_CONFIG[prefix],
        };
      }
    }

    // 2. Keyword fallback for legacy notifications created before prefix tags
    const lower = message.toLowerCase();
    if (lower.includes('cancelled')) {
      return { cleanMessage: message, config: PREFIX_CONFIG['[CANCELLED]'] };
    }
    if (lower.includes('completed') || lower.includes('marked done')) {
      return { cleanMessage: message, config: PREFIX_CONFIG['[COMPLETED]'] };
    }
    if (lower.includes('scheduled')) {
      return { cleanMessage: message, config: PREFIX_CONFIG['[SCHEDULED]'] };
    }
    if (lower.includes('reminder')) {
      return { cleanMessage: message, config: PREFIX_CONFIG['[REMINDER]'] };
    }
    if (lower.includes('overdue')) {
      return { cleanMessage: message, config: PREFIX_CONFIG['[OVERDUE]'] };
    }
  }

  // 3. Fallback to notificationType
  const config = FALLBACK_CONFIG[notificationType] ?? FALLBACK_CONFIG.default;
  return { cleanMessage: message ?? '', config };
};

// ── Relative time formatter ──────────────────────────────────────────────────
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60_000) return 'just now';
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};


// ── Component ─────────────────────────────────────────────────────────────────
const NotificationItem = memo(({ notification, onMarkAsRead, onDelete }) => {
  const id               = notification.id ?? notification._id;
  const isRead           = notification.isRead ?? notification.read ?? false;
  const rawMessage       = notification.message ?? notification.body ?? '';
  const notificationType = notification.notificationType ?? '';
  const createdAt        = notification.createdAt ?? notification.timestamp ?? null;

  // Scope context fields (populated by NOTIFICATION_INCLUDE on backend)
  const companyName = notification.company?.name ?? null;
  const branchName  = notification.branch?.name  ?? null;

  // Resolve display config and clean message
  const { cleanMessage, config } = parseMessage(rawMessage, notificationType);
  const { Icon, colour, bg, title } = config;

  // ── Scope badge text ──────────────────────────────────────────────────────
  // Show badge only when company or branch names are present in the payload.
  // SA gets [Company • Branch], CA gets [Branch] (companyId exists but no name
  // is included for CA by buildNotifScope — branch is the differentiator).
  const scopeBadge = (() => {
    if (companyName && branchName) return `${companyName} · ${branchName}`;
    if (branchName)                return branchName;
    if (companyName)               return companyName;
    return null;
  })();

  const handleClick = () => {
    if (!isRead) onMarkAsRead(id);
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // prevent mark-as-read from firing
    onDelete(id);
  };

  return (
    <div
      className={[
        'group relative w-full flex items-start gap-3 px-4 py-3.5 transition-colors duration-150',
        'hover:bg-slate-50',
        isRead ? 'opacity-70' : '',
      ].join(' ')}
    >
      {/* Clickable region (mark-as-read) */}
      <button
        type="button"
        onClick={handleClick}
        className="flex items-start gap-3 flex-1 min-w-0 text-left focus-visible:outline-none"
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

          {cleanMessage && (
            <span className="block text-xs text-slate-500 leading-relaxed line-clamp-2">
              {cleanMessage}
            </span>
          )}

          {/* Scope badge — visible only for SA/CA where company/branch context is provided */}
          {scopeBadge && (
            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400 bg-slate-100 leading-none">
              {scopeBadge}
            </span>
          )}
        </span>
      </button>

      {/* Right column: timestamp + delete */}
      <span className="shrink-0 flex flex-col items-end gap-2 pt-0.5 ml-1">
        {createdAt && (
          <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
            {formatRelativeTime(createdAt)}
          </span>
        )}
        {/* Delete button — visible on hover only */}
        <button
          type="button"
          onClick={handleDelete}
          title="Remove notification"
          aria-label="Delete notification"
          className={[
            'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
            'flex h-5 w-5 items-center justify-center rounded',
            'text-slate-300 hover:text-rose-500 hover:bg-rose-50 focus-visible:outline-none',
          ].join(' ')}
        >
          <Trash2 size={11} aria-hidden="true" />
        </button>
      </span>
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';

export default NotificationItem;
