import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  CalendarPlus,
  UserPlus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import ModuleBadge from './ModuleBadge';

const PREFIX_CONFIG = {
  '[SCHEDULED]': { Icon: CalendarPlus, colour: 'text-indigo-500', bg: 'bg-indigo-50', title: 'Follow-up Scheduled' },
  '[COMPLETED]': { Icon: CheckCircle2, colour: 'text-emerald-500', bg: 'bg-emerald-50', title: 'Follow-up Completed' },
  '[CANCELLED]': { Icon: XCircle, colour: 'text-rose-500', bg: 'bg-rose-50', title: 'Follow-up Cancelled' },
  '[REMINDER]':  { Icon: Clock, colour: 'text-amber-500', bg: 'bg-amber-50', title: 'Follow-up Reminder' },
  '[OVERDUE]':   { Icon: AlertTriangle, colour: 'text-red-500', bg: 'bg-red-50', title: 'Overdue Follow-up' },
};

const FALLBACK_CONFIG = {
  REMINDER:                 { Icon: Clock,         colour: 'text-amber-500',  bg: 'bg-amber-50',   title: 'Follow-up Reminder'  },
  OVERDUE_ALERT:            { Icon: AlertTriangle,  colour: 'text-red-500',    bg: 'bg-red-50',     title: 'Overdue Follow-up'   },
  FOLLOWUP_ALERT:           { Icon: Bell,           colour: 'text-indigo-500', bg: 'bg-indigo-50',  title: 'Follow-up Update'    },
  ASSIGNMENT_ALERT:         { Icon: UserPlus,       colour: 'text-violet-500', bg: 'bg-violet-50',  title: 'Lead Assigned'       },
  LEAD_ASSIGNED:            { Icon: UserPlus,       colour: 'text-violet-500', bg: 'bg-violet-50',  title: 'New Lead Assigned'   },
  LEAD_REASSIGNED:          { Icon: UserPlus,       colour: 'text-indigo-500', bg: 'bg-indigo-50',  title: 'Lead Reassigned'     },
  LEAD_STATUS_CHANGED:      { Icon: Bell,           colour: 'text-blue-500',   bg: 'bg-blue-50',    title: 'Lead Status Updated' },
  OPPORTUNITY_STAGE_CHANGED:{ Icon: CheckCircle2,   colour: 'text-emerald-500', bg: 'bg-emerald-50', title: 'Opportunity Updated' },
  OPPORTUNITY_WON:          { Icon: CheckCircle2,   colour: 'text-emerald-600', bg: 'bg-emerald-100',title: 'Opportunity Won 🎉' },
  default:                  { Icon: Bell,           colour: 'text-slate-500',  bg: 'bg-slate-100',  title: 'Notification'        },
};

const parseMessage = (message, notificationType, customTitle) => {
  if (customTitle) {
    const config = FALLBACK_CONFIG[notificationType] ?? FALLBACK_CONFIG.default;
    return { cleanMessage: message ?? '', config: { ...config, title: customTitle } };
  }

  if (typeof message === 'string') {
    for (const prefix of Object.keys(PREFIX_CONFIG)) {
      if (message.startsWith(prefix)) {
        return {
          cleanMessage: message.slice(prefix.length).trim(),
          config: PREFIX_CONFIG[prefix],
        };
      }
    }
  }

  const config = FALLBACK_CONFIG[notificationType] ?? FALLBACK_CONFIG.default;
  return { cleanMessage: message ?? '', config };
};

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

const NotificationItem = memo(({ notification, onMarkAsRead, onDelete, onClosePanel }) => {
  const navigate = useNavigate();
  const id               = notification.id ?? notification._id;
  const isRead           = notification.isRead ?? notification.status === 'READ';
  const rawMessage       = notification.message ?? '';
  const notificationType = notification.notificationType ?? '';
  const customTitle      = notification.title ?? null;
  const priority         = notification.priority ?? 'MEDIUM';
  const moduleName       = notification.moduleName ?? 'SYSTEM';
  const actionUrl        = notification.actionUrl ?? null;
  const createdAt        = notification.createdAt ?? null;

  const { cleanMessage, config } = parseMessage(rawMessage, notificationType, customTitle);
  const { Icon, colour, bg, title } = config;

  const handleClick = () => {
    if (!isRead && onMarkAsRead) onMarkAsRead(id);
    if (actionUrl) {
      if (onClosePanel) onClosePanel();
      navigate(actionUrl);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(id);
  };

  return (
    <div
      className={[
        'group relative w-full flex items-start gap-3 px-4 py-3.5 transition-colors duration-150',
        'hover:bg-slate-50 cursor-pointer',
        isRead ? 'opacity-75' : 'bg-primary/2',
      ].join(' ')}
      onClick={handleClick}
    >
      {/* Type icon */}
      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg}`}>
        <Icon size={15} className={colour} aria-hidden="true" />
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`block text-sm leading-snug truncate ${isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
              {title}
            </span>
            {!isRead && (
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <PriorityBadge priority={priority} />
          </div>
        </div>

        {cleanMessage && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {cleanMessage}
          </p>
        )}

        <div className="flex items-center gap-2 pt-0.5">
          <ModuleBadge moduleName={moduleName} />
          {actionUrl && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:underline">
              View record <ExternalLink size={9} />
            </span>
          )}
        </div>
      </div>

      {/* Right column: timestamp + delete */}
      <div className="shrink-0 flex flex-col items-end gap-2 pt-0.5 ml-1">
        {createdAt && (
          <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
            {formatRelativeTime(createdAt)}
          </span>
        )}
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
      </div>
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';

export default NotificationItem;
