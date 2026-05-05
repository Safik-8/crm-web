import { useState, useMemo, useRef, useEffect } from 'react';
import { useBranchReports } from '../hooks/useBranchReports';
import { toast } from 'sonner';
import { useLoader } from '../../../shared/context/LoaderContext';
import {
  PhoneIncoming,
  UserCheck,
  MessageSquare,
  CalendarCheck,
  Building,
  CheckCircle,
  Banknote,
  Repeat,
  Clock,
  Users,
  Signature,
  LayoutDashboard,
  Award,
  RefreshCw,
  Calendar,
  Filter,
  X,
  Trophy,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';

// ─── Field definitions ────────────────────────────────────────────────────────
const fields = [
  { key: 'callsReceived',      label: 'Calls Received',     icon: PhoneIncoming, color: 'blue'    },
  { key: 'qualifiedLeads',     label: 'Qualified Leads',    icon: UserCheck,     color: 'indigo'  },
  { key: 'counsellingDone',    label: 'Counselling Done',   icon: MessageSquare, color: 'purple'  },
  { key: 'counsellingBooked',  label: 'Counselling Booked', icon: CalendarCheck, color: 'pink'    },
  { key: 'officeVisits',       label: 'Office Visits',      icon: Building,      color: 'orange'  },
  { key: 'closures',           label: 'Closures',           icon: CheckCircle,   color: 'emerald' },
  { key: 'revenue',            label: 'Revenue',            icon: Banknote,      color: 'amber',  isCurrency: true },
  { key: 'followupsDone',      label: 'Follow-ups Done',    icon: Repeat,        color: 'sky'     },
  { key: 'pendingFollowups',   label: 'Pending Follow-ups', icon: Clock,         color: 'rose'    },
  { key: 'seminarTasks',       label: 'Seminar Tasks',      icon: Users,         color: 'violet'  },
  { key: 'joiningFormalities', label: 'Joining Formalities',icon: Signature,     color: 'cyan'    },
];

// ─── Per-metric colour tokens ─────────────────────────────────────────────────
const colorConfig = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    bar: 'bg-blue-500',    border: 'border-blue-100'    },
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  bar: 'bg-indigo-500',  border: 'border-indigo-100'  },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-600',  bar: 'bg-purple-500',  border: 'border-purple-100'  },
  pink:    { bg: 'bg-pink-50',    text: 'text-pink-600',    bar: 'bg-pink-500',    border: 'border-pink-100'    },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  bar: 'bg-orange-500',  border: 'border-orange-100'  },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500', border: 'border-emerald-100' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   bar: 'bg-amber-500',   border: 'border-amber-100'   },
  sky:     { bg: 'bg-sky-50',     text: 'text-sky-600',     bar: 'bg-sky-500',     border: 'border-sky-100'     },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    bar: 'bg-rose-500',    border: 'border-rose-100'    },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  bar: 'bg-violet-500',  border: 'border-violet-100'  },
  cyan:    { bg: 'bg-cyan-50',    text: 'text-cyan-600',    bar: 'bg-cyan-500',    border: 'border-cyan-100'    },
};

/** Generate 2-letter initials from a full name */
const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Returns today's date in YYYY-MM-DD format */
const getTodayDate = () => new Date().toISOString().split('T')[0];

// ─── Lazy-reveal hook (IntersectionObserver, no extra deps) ──────────────────
const useInView = (options = {}) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.05, ...options });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ stat, formatValue, index }) => {
  const Icon = stat.icon;
  const cfg  = colorConfig[stat.color];

  return (
    <div
      className="group relative bg-white rounded-3xl border border-slate-100 shadow-soft hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1.5 transition-all duration-300 animate-slide-in-bottom overflow-hidden flex flex-col"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      {/* Orange left accent bar */}
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors duration-300" />

      <div className="pl-5 pr-5 pt-5 pb-4 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className={`h-11 w-11 rounded-2xl ${cfg.bg} ${cfg.text} flex items-center justify-center border ${cfg.border} transition-transform duration-300 group-hover:scale-110 shrink-0`}>
            <Icon size={20} />
          </div>
          <div className="h-7 w-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all duration-300">
            <ArrowUpRight size={13} />
          </div>
        </div>

        {/* Label */}
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 group-hover:text-primary transition-colors duration-200">
          {stat.label}
        </p>

        {/* Big number */}
        <h2 className={`text-4xl font-black font-heading tracking-tight leading-none mb-4 transition-colors duration-200 ${stat.total > 0 ? 'text-slate-900' : 'text-slate-200'}`}>
          {formatValue(stat.total, stat.isCurrency)}
        </h2>

        {/* Divider */}
        <div className="flex items-center justify-between text-[9px] font-black text-slate-300 uppercase tracking-widest border-t border-slate-50 pt-3 mb-2">
          <span>Executive</span>
          <span>Contribution</span>
        </div>

        {/* Breakdown */}
        <div
          className="overflow-y-auto custom-scrollbar-thin flex-1"
          style={{ minHeight: '96px', maxHeight: '108px' }}
        >
          {stat.breakdown.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-1.5 py-3">
              <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center">
                <Users size={14} className="text-slate-200" />
              </div>
              <p className="text-[9px] font-bold text-slate-300">No data for this period</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {stat.breakdown.map((ise, idx) => (
                <div
                  key={ise.name}
                  className="flex items-center justify-between group/row px-1.5 py-1 rounded-xl hover:bg-orange-50/60 transition-colors duration-150 cursor-default"
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-[9px] font-black transition-transform duration-200 group-hover/row:scale-110 ${
                      idx === 0 ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-200'
                      : idx === 1 ? 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                      : idx === 2 ? 'bg-orange-50 text-orange-400 ring-1 ring-orange-100'
                      : 'bg-white text-slate-400 border border-slate-100'
                    }`}>
                      {idx === 0
                        ? <Award size={13} className="animate-bounce" style={{ animationDuration: '3s' }} />
                        : ise.avatar}
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover/row:text-slate-900 transition-colors truncate max-w-[80px]">
                      {ise.name}
                    </span>
                  </div>
                  <div className="flex flex-col items-end shrink-0 gap-0.5">
                    <span className={`text-[13px] font-black transition-colors duration-200 group-hover/row:text-primary ${idx === 0 ? 'text-slate-900' : 'text-slate-500'}`}>
                      {formatValue(ise.value, stat.isCurrency)}
                    </span>
                    <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                        style={{ width: `${stat.total > 0 ? Math.max(6, (ise.value / stat.total) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {stat.breakdown.length > 3 && (
          <p className="text-[9px] text-slate-300 font-semibold text-right mt-1.5">
            +{stat.breakdown.length - 3} more · scroll
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Skeleton card (shown while data is fetching) ────────────────────────────
const StatCardSkeleton = () => (
  <div className="relative bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden flex flex-col animate-pulse">
    <div className="absolute top-0 left-0 w-1 h-full bg-slate-100" />
    <div className="pl-5 pr-5 pt-5 pb-4 flex flex-col flex-1 gap-4">
      <div className="flex items-start justify-between">
        <div className="h-11 w-11 rounded-2xl bg-slate-100" />
        <div className="h-7 w-7 rounded-full bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-2.5 w-24 rounded-full bg-slate-100" />
        <div className="h-9 w-20 rounded-xl bg-slate-100" />
      </div>
      <div className="space-y-2 pt-3 border-t border-slate-50">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between px-1.5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-slate-100" />
              <div className="h-2.5 w-16 rounded-full bg-slate-100" />
            </div>
            <div className="h-3 w-10 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
const LazyStatCard = ({ stat, formatValue, index, eager = false }) => {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} className="min-h-[280px]">
      {(eager || visible) ? (
        <StatCard stat={stat} formatValue={formatValue} index={index} />
      ) : (
        <div className="h-full w-full rounded-3xl bg-slate-50 border border-slate-100 animate-pulse" />
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const BranchDashboardPage = () => {
  const today = getTodayDate();
  const { forceHideLoader } = useLoader();
  const didHideInitialRouteLoaderRef = useRef(false);

  const [tempStartDate, setTempStartDate] = useState(today);
  const [tempEndDate,   setTempEndDate]   = useState(today);
  const [filters, setFilters] = useState({ startDate: today, endDate: today });

  const { reportData, reportsCount, loading, error, refetch } = useBranchReports({
    startDate: filters.startDate || undefined,
    endDate:   filters.endDate   || undefined,
  });

  useEffect(() => {
    if (!didHideInitialRouteLoaderRef.current && !loading) {
      forceHideLoader();
      didHideInitialRouteLoaderRef.current = true;
    }
  }, [loading, forceHideLoader]);

  const handleApplyFilter = () => {
    if (tempStartDate && tempEndDate && tempStartDate > tempEndDate) {
      toast.error('Invalid date range: start date cannot be after end date.');
      return;
    }
    setFilters({ startDate: tempStartDate, endDate: tempEndDate });
  };

  const handleResetFilter = () => {
    const t = getTodayDate();
    setTempStartDate(t);
    setTempEndDate(t);
    setFilters({ startDate: t, endDate: t });
  };

  const stats = useMemo(() => {
    if (!reportData || reportData.length === 0)
      return fields.map(f => ({ ...f, total: 0, breakdown: [] }));

    return fields.map(field => {
      const card = reportData.find(c => c.metric === field.key);
      if (!card) return { ...field, total: 0, breakdown: [] };
      const breakdown = (card.topPerformers || [])
        .map(p => ({ name: p.user.name, avatar: getInitials(p.user.name), value: p.user.total || 0 }))
        .sort((a, b) => b.value - a.value);
      return { ...field, total: card.total || 0, breakdown };
    });
  }, [reportData]);

  const iseUsers = useMemo(() => {
    if (!reportData || reportData.length === 0) return [];
    const userMap = new Map();
    reportData.forEach(card => {
      (card.topPerformers || []).forEach(({ user }) => {
        if (user && !userMap.has(user.id))
          userMap.set(user.id, { id: user.id, name: user.name, avatar: getInitials(user.name) });
      });
    });
    return Array.from(userMap.values());
  }, [reportData]);

  const topPerformerName = useMemo(() => {
    if (!reportData || reportData.length === 0) return null;
    const revenueCard = reportData.find(c => c.metric === 'revenue');
    if (revenueCard?.topPerformers?.length > 0) return revenueCard.topPerformers[0].user.name;
    for (const card of reportData)
      if (card.topPerformers?.length > 0) return card.topPerformers[0].user.name;
    return null;
  }, [reportData]);

  const formatValue = (value, isCurrency) => {
    if (isCurrency)
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
    return value.toLocaleString();
  };

  // ── Loading ──
  // The global Lottie loader already covers the route transition.
  // While data fetches, skeleton cards fill the grid — no double loader.

  // ── Error ──
  if (error && (!reportData || reportData.length === 0)) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 bg-white rounded-3xl p-8 sm:p-10 shadow-soft border border-slate-100">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
            <RefreshCw size={22} />
          </div>
          <p className="text-sm font-semibold text-rose-500 text-center max-w-xs">{error}</p>
          <button
            onClick={refetch}
            className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6" style={{ marginTop: '-35px' }}>

      {/* ══════════════════════════════════════════════════════
           PAGE HEADER
           Mobile  : stacked — title → date filter → meta row
           Tablet  : 2-row — [title | trophy] / [avatars | date filter]
           Desktop : 1-row — [title] [date filter | divider | avatars | trophy]
         ══════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Brand accent bar */}
        <div className="h-[3px] w-full bg-gradient-to-r from-primary via-orange-400 to-amber-300" />

        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-6">

          {/* ── LEFT: Identity ─────────────────────────────────── */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Icon */}
            <div className="h-11 w-11 sm:h-12 sm:w-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30 shrink-0">
              <LayoutDashboard size={20} />
            </div>

            {/* Text */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight leading-none">
                  Branch Performance
                </h1>
                {/* Live badge */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-slate-400 text-xs font-medium mt-1 leading-none">
                Real-time analytics for Sales Executives
                <span className="mx-2 text-slate-200">·</span>
                <span className="text-primary font-semibold">{reportsCount} Active ISEs</span>
              </p>
            </div>
          </div>

          {/* ── RIGHT: Controls ────────────────────────────────── */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4 shrink-0">

            {/* ── Date range filter ──────────────────────────────
                Mobile  : two date fields stacked (full-width each),
                          Apply + Reset on a third row side-by-side.
                Desktop : single horizontal strip (unchanged).
              ─────────────────────────────────────────────────── */}

            {/* MOBILE date filter (hidden on sm+) */}
            <div className="sm:hidden bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
              {/* From field */}
              <label className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 cursor-pointer active:bg-slate-100 transition-colors">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar size={15} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">From</p>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full text-sm font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer"
                  />
                </div>
              </label>

              {/* To field */}
              <label className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 cursor-pointer active:bg-slate-100 transition-colors">
                <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Calendar size={15} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">To</p>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full text-sm font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer"
                  />
                </div>
              </label>

              {/* Action row */}
              <div className="flex items-center gap-2 px-4 py-3">
                <button
                  onClick={handleApplyFilter}
                  disabled={loading}
                  className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-bold flex items-center justify-center gap-2
                             hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50
                             shadow-md shadow-primary/20"
                >
                  <Filter size={14} />
                  Apply Filter
                </button>
                <button
                  onClick={handleResetFilter}
                  disabled={loading}
                  title="Reset to today"
                  className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-400 flex items-center justify-center
                             hover:text-primary hover:border-primary/40 active:scale-95 transition-all disabled:opacity-50 shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* DESKTOP date filter (hidden on mobile) */}
            <div className="hidden sm:flex items-stretch bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
              {/* From */}
              <label className="flex items-center gap-2 px-3 py-2.5 border-r border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors group min-w-0">
                <Calendar size={14} className="text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">From</p>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="block text-[12px] font-semibold text-slate-700 bg-transparent border-none outline-none cursor-pointer mt-0.5 w-[118px]"
                  />
                </div>
              </label>

              {/* To */}
              <label className="flex items-center gap-2 px-3 py-2.5 border-r border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors group min-w-0">
                <Calendar size={14} className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">To</p>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="block text-[12px] font-semibold text-slate-700 bg-transparent border-none outline-none cursor-pointer mt-0.5 w-[118px]"
                  />
                </div>
              </label>

              {/* Actions */}
              <div className="flex items-center gap-1.5 px-2.5">
                <button
                  onClick={handleApplyFilter}
                  disabled={loading}
                  className="h-8 px-3.5 rounded-lg bg-primary text-white text-[11px] font-bold flex items-center gap-1.5 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 shadow-sm shadow-primary/20 whitespace-nowrap"
                >
                  <Filter size={12} />
                  Apply
                </button>
                <button
                  onClick={handleResetFilter}
                  disabled={loading}
                  title="Reset to today"
                  className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:text-primary hover:border-primary/40 active:scale-95 transition-all disabled:opacity-50"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Divider — desktop only */}
            <div className="hidden lg:block h-10 w-px bg-slate-200 shrink-0" />

            {/* ISE avatars + Top Performer */}
            <div className="flex items-center justify-between sm:justify-start gap-3">
              {/* Avatar stack */}
              {iseUsers.length > 0 && (
                <div className="flex -space-x-2">
                  {iseUsers.slice(0, 5).map((ise, i) => (
                    <div
                      key={ise.id}
                      title={ise.name}
                      className="h-8 w-8 rounded-full ring-2 ring-white bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black hover:scale-110 hover:z-10 transition-transform cursor-default relative select-none"
                      style={{ zIndex: 5 - i }}
                    >
                      {ise.avatar}
                    </div>
                  ))}
                  {iseUsers.length > 5 && (
                    <div className="h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 text-slate-500 flex items-center justify-center text-[9px] font-black select-none">
                      +{iseUsers.length - 5}
                    </div>
                  )}
                </div>
              )}

              {/* Top Performer chip */}
              <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200/70 rounded-xl px-3 py-2 shrink-0">
                <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Trophy size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none">Top Performer</p>
                  <p className="text-[13px] font-black text-slate-800 font-heading leading-tight mt-0.5 truncate max-w-[120px]">
                    {topPerformerName || '—'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Quick summary strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-soft px-3 sm:px-4 py-3 sm:py-3.5 flex items-center gap-2 sm:gap-3 animate-pulse">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-2 w-16 rounded-full bg-slate-100" />
                  <div className="h-4 w-12 rounded-lg bg-slate-100" />
                </div>
              </div>
            ))
          : [
          { key: 'callsReceived',  label: 'Total Calls',     icon: PhoneIncoming, accent: 'bg-blue-50 text-blue-600 border-blue-100'       },
          { key: 'qualifiedLeads', label: 'Qualified Leads', icon: UserCheck,     accent: 'bg-indigo-50 text-indigo-600 border-indigo-100'  },
          { key: 'closures',       label: 'Closures',        icon: CheckCircle,   accent: 'bg-emerald-50 text-emerald-600 border-emerald-100'},
          { key: 'revenue',        label: 'Revenue',         icon: Banknote,      accent: 'bg-amber-50 text-amber-600 border-amber-100', isCurrency: true },
          ].map(({ key, label, icon: Icon, accent, isCurrency }) => {
            const val = stats.find(s => s.key === key)?.total ?? 0;
            return (
              <div key={key} className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-soft px-3 sm:px-4 py-3 sm:py-3.5 flex items-center gap-2 sm:gap-3">
                <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl flex items-center justify-center border shrink-0 ${accent}`}>
                  <Icon size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  {/* Full label — wraps instead of truncating */}
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
                  <p className="text-sm sm:text-base font-black text-slate-900 font-heading leading-tight mt-0.5">
                    {isCurrency
                      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
                      : val.toLocaleString()}
                  </p>
                </div>
                <TrendingUp size={13} className="text-primary/40 shrink-0 hidden xs:block" />
              </div>
            );
          })}
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {loading
          ? Array.from({ length: 11 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((stat, index) => (
              <LazyStatCard
                key={stat.key}
                stat={stat}
                formatValue={formatValue}
                index={index}
                eager={index < 4}
              />
            ))
        }
      </div>
    </div>
  );
};

export default BranchDashboardPage;
