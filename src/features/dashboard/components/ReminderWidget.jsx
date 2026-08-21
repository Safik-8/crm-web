import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import CountUp from 'react-countup';
import { Clock, Calendar, AlertTriangle, ChevronRight, RefreshCw } from 'lucide-react';
import { fetchReminderSummary } from '../../notifications/services/notificationService';
import FollowupsDrawer from './FollowupsDrawer';

const CARD_CONFIG = [
  {
    key:     'todayCount',
    label:   "Today's Follow-ups",
    icon:    Clock,
    color:   'blue',
    filter:  'today',
    helpText: 'Due today',
  },
  {
    key:     'upcomingCount',
    label:   'Upcoming',
    icon:    Calendar,
    color:   'sky',
    filter:  'upcoming',
    helpText: 'Scheduled ahead',
  },
  {
    key:     'overdueCount',
    label:   'Overdue',
    icon:    AlertTriangle,
    color:   'red',
    filter:  'overdue',
    helpText: 'Past due date — action needed',
    urgent:  true,  // highlights red when count > 0
  },
];

const COLOR_MAP = {
  blue: { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100',   icon: 'text-blue-500'   },
  sky:  { bg: 'bg-sky-50',    text: 'text-sky-600',    border: 'border-sky-100',    icon: 'text-sky-500'    },
  red:  { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-100',    icon: 'text-red-500'    },
};

const ReminderWidget = ({ onViewFollowups }) => {
  const [selectedFilter, setSelectedFilter] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey:  ['reminder-summary'],
    queryFn:   () => fetchReminderSummary(),
    staleTime: 5 * 60 * 1000,
    select:    (res) => res?.data ?? res,
  });

  const summary = data ?? { todayCount: 0, upcomingCount: 0, overdueCount: 0 };

  const handleCardClick = (filter) => {
    if (typeof onViewFollowups === 'function') {
      onViewFollowups(filter);
    } else {
      setSelectedFilter(filter);
    }
  };

  return (
    <>
      <section aria-label="Follow-up Reminders" className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Clock size={14} className="text-primary" aria-hidden="true" />
            Follow-up Reminders
          </h3>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Refresh reminders"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CARD_CONFIG.map(({ key, label, icon: Icon, color, filter, helpText, urgent }) => {
            const count   = summary[key] ?? 0;
            const isUrgent = urgent && count > 0;
            const c       = COLOR_MAP[color];

            return (
              <div
                key={key}
                className={[
                  'bg-white rounded-2xl border shadow-sm p-4 flex flex-col gap-2 transition-all',
                  isUrgent ? 'border-red-300 bg-red-50/40' : 'border-slate-200',
                  isLoading ? 'animate-pulse' : '',
                ].join(' ')}
              >
                <div className="flex items-start justify-between">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.bg}`}>
                    <Icon size={17} className={c.icon} aria-hidden="true" />
                  </span>
                  {isUrgent && (
                    <span className="text-[10px] font-bold text-red-600 bg-red-100 rounded-full px-2 py-0.5">
                      ACTION NEEDED
                    </span>
                  )}
                </div>

                <div>
                  <p className={`text-2xl font-extrabold ${isUrgent ? 'text-red-600' : c.text}`}>
                    {isLoading ? '—' : <CountUp end={count} duration={0.8} />}
                  </p>
                  <p className="text-xs font-semibold text-slate-600">{label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{helpText}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFilter(filter)}
                  className={`mt-auto flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                    isUrgent ? 'text-red-600 hover:text-red-700' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  View {label} <ChevronRight size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Followups Slide-over Drawer */}
      <FollowupsDrawer
        isOpen={Boolean(selectedFilter)}
        onClose={() => setSelectedFilter(null)}
        initialFilter={selectedFilter || 'today'}
      />
    </>
  );
};

export default ReminderWidget;
