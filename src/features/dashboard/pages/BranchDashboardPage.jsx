import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useBranchDashboard } from '../hooks/useBranchDashboard';
import { useLoader } from '../../../shared/context/LoaderContext';
import ReminderWidget from '../components/ReminderWidget';
import { toast } from 'sonner';
import CountUp from 'react-countup';
import { CrmBarChart, CrmPieChart } from '../../../shared/components/charts';
import {
  LayoutDashboard,
  Phone,
  Users,
  Repeat,
  Flame,
  CheckCircle,
  Calendar,
  Filter,
  X,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Activity,
  PieChart as PieIcon,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  Medal,
  UserCircle,
  Building2,
  ClipboardList,
  Zap,
} from 'lucide-react';

// ─── Design tokens ────────────────────────────────────────────────────────────
// Each card key maps to an icon + colour palette. The backend drives ordering
// and labels — we only supply the visual layer here.
const CARD_VISUAL_MAP = {
  totalCallDone:       { icon: Phone,       color: 'blue'    },
  totalCounsellingDone:{ icon: Users,       color: 'purple'  },
  totalFollowUpTaken:  { icon: Repeat,      color: 'sky'     },
  totalQualifiedLeads: { icon: Flame,       color: 'orange'  },
  totalClosureDone:    { icon: CheckCircle, color: 'emerald' },
};

// Fallback for any key the backend adds in the future
const FALLBACK_VISUAL = { icon: BarChart3, color: 'slate' };

const COLOR_CONFIG = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100',    ring: 'ring-blue-200',    bar: 'bg-blue-500'    },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-100',  ring: 'ring-purple-200',  bar: 'bg-purple-500'  },
  sky:     { bg: 'bg-sky-50',     text: 'text-sky-600',     border: 'border-sky-100',     ring: 'ring-sky-200',     bar: 'bg-sky-500'     },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-100',  ring: 'ring-orange-200',  bar: 'bg-orange-500'  },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', ring: 'ring-emerald-200', bar: 'bg-emerald-500' },
  slate:   { bg: 'bg-slate-50',   text: 'text-slate-500',   border: 'border-slate-100',   ring: 'ring-slate-200',   bar: 'bg-slate-400'   },
};

// ─── Chart palette ────────────────────────────────────────────────────────────
// Hex values for Recharts (Tailwind classes don't work inside SVG attributes)
const CHART_COLORS = {
  totalCallDone:        '#3b82f6', // blue-500
  totalCounsellingDone: '#a855f7', // purple-500
  totalFollowUpTaken:   '#0ea5e9', // sky-500
  totalQualifiedLeads:  '#f97316', // orange-500
  totalClosureDone:     '#10b981', // emerald-500
  fallback:             '#94a3b8', // slate-400
};

// Pie chart uses the same palette — resolved at render time from card keys
const PIE_COLORS = Object.values(CHART_COLORS).slice(0, 5);
// Single source of truth for all date handling in this module.
// Rule: NEVER use new Date(isoString).toISOString() — it shifts the date in
// non-UTC timezones (e.g. IST UTC+5:30 turns 2026-05-22T00:00:00Z → 2026-05-21).

/**
 * normalizeDate(value) → "YYYY-MM-DD" | ""
 *
 * Accepts any of:
 *   "2026-05-22"                   plain date string  → "2026-05-22"
 *   "2026-05-22T00:00:00.000Z"     UTC midnight ISO   → "2026-05-22"  ← key fix
 *   "2026-05-22T18:30:00.000Z"     UTC ISO w/ time    → "2026-05-22"
 *   null / undefined / ""          falsy              → ""
 *
 * Strategy for UTC ISO strings (contains "T" and ends with "Z"):
 *   Parse as a real Date object, then read LOCAL year/month/day.
 *   This correctly converts "2026-05-22T00:00:00.000Z" to "2026-05-22"
 *   in IST (UTC+5:30) instead of the naive slice giving "2026-05-21".
 *
 * Strategy for plain "YYYY-MM-DD" strings:
 *   Validate with regex and return as-is — no Date construction needed.
 */
const normalizeDate = (value) => {
  if (!value) return '';
  const s = String(value).trim();

  // Already a plain date — validate and return directly
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // UTC ISO timestamp — parse and extract LOCAL calendar date
  if (s.includes('T')) {
    const d = new Date(s);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  return '';
};

/**
 * getTodayDate() → "YYYY-MM-DD"
 *
 * Returns today in LOCAL time. Never uses toISOString() which would give
 * the UTC date and shift by one day in UTC+ timezones after 18:30 IST.
 */
const getTodayDate = () => {
  const d    = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * formatDisplayDate(dateValue) → "22 May 2026" | "—"
 *
 * Accepts ISO strings or YYYY-MM-DD. Always normalizes first so the
 * displayed date matches the calendar date the backend intended.
 * Constructs the Date via (year, monthIndex, day) — local midnight,
 * never UTC — so toLocaleDateString is always correct.
 */
const formatDisplayDate = (dateValue) => {
  if (!dateValue) return '—';
  try {
    const datePart = normalizeDate(dateValue);
    if (!datePart) return '—';
    const [year, month, day] = datePart.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
};

// ─── UI helpers ───────────────────────────────────────────────────────────────

/** Two-letter initials from a full name */
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * formatTime(isoString) → "10:30 AM" | "—"
 * Uses local time — consistent with the rest of the date handling in this file.
 */
const formatTime = (isoString) => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return '—'; }
};

/** formatDateTime(isoString) → "22 May · 10:30 AM" | "—" */
const formatDateTime = (isoString) => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date} · ${time}`;
  } catch { return '—'; }
};

/** Avatar background colours — cycled by user id */
const AVATAR_COLORS = [
  { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  { bg: 'bg-purple-100', text: 'text-purple-700'  },
  { bg: 'bg-emerald-100',text: 'text-emerald-700' },
  { bg: 'bg-orange-100', text: 'text-orange-700'  },
  { bg: 'bg-sky-100',    text: 'text-sky-700'     },
  { bg: 'bg-rose-100',   text: 'text-rose-700'    },
  { bg: 'bg-amber-100',  text: 'text-amber-700'   },
  { bg: 'bg-indigo-100', text: 'text-indigo-700'  },
];
const avatarColor = (userId) => AVATAR_COLORS[(userId ?? 0) % AVATAR_COLORS.length];

// ─── Lead activity item ───────────────────────────────────────────────────────
const LeadActivityItem = ({ lead }) => (
  <div className="flex items-start gap-2.5 py-2.5 border-b border-slate-100 last:border-0">
    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
        <span className="text-[12px] font-bold text-slate-800 truncate">{lead.name || 'Unknown Lead'}</span>
        {lead.interestedFor && (
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md shrink-0">
            {lead.interestedFor}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 text-[11px] mb-1">
        <span className="text-slate-500">{lead.fromStage?.name ?? 'Direct Entry'}</span>
        <ArrowRight size={10} className="text-slate-400 shrink-0" />
        <span className="font-semibold text-slate-700">{lead.toStage?.name ?? '—'}</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {lead.assignedTo
          ? <span className="text-[10px] text-slate-500">Assigned: <span className="font-semibold text-slate-700">{lead.assignedTo.name}</span></span>
          : <span className="text-[10px] text-slate-400">Unassigned</span>
        }
        {lead.pipeline && <span className="text-[10px] text-slate-400">· {lead.pipeline.name}</span>}
        {lead.movedAt && (
          <span className="flex items-center gap-0.5 text-[10px] text-slate-400 ml-auto shrink-0">
            <Clock size={9} />{formatTime(lead.movedAt)}
          </span>
        )}
      </div>
    </div>
  </div>
);

// ─── User breakdown card ──────────────────────────────────────────────────────
const UserBreakdownCard = ({ entry, stageTotal, stageColor }) => {
  const userName  = entry.user?.name  ?? 'Unknown User';
  const userEmail = entry.user?.email ?? '';
  const userId    = entry.user?.id    ?? 0;
  const ac        = avatarColor(userId);
  const pct       = stageTotal > 0 ? Math.round((entry.count / stageTotal) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3 space-y-2.5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center gap-2.5">
        <div className={`h-8 w-8 rounded-lg ${ac.bg} ${ac.text} flex items-center justify-center text-[11px] font-black shrink-0`}>
          {getInitials(userName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-slate-800 leading-none truncate">{userName}</p>
          {userEmail && <p className="text-[10px] text-slate-500 leading-none mt-0.5 truncate">{userEmail}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[14px] font-black text-slate-900 leading-none">{entry.count}</p>
          <p className="text-[10px] font-semibold text-slate-500 leading-none mt-0.5">{pct}%</p>
        </div>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: stageColor }} />
      </div>
    </div>
  );
};

// ─── Stage card breakdown accordion ──────────────────────────────────────────
const StageCardBreakdown = ({ card, chartColor, isOpen, isSelfView }) => {
  if (!isOpen || !card.userBreakdown?.length) return null;

  // Self mode: skip the user header card — just show a compact lead count line
  if (isSelfView) {
    const entry = card.userBreakdown[0];
    if (!entry) return null;
    return (
      <div className="border-t border-slate-100 px-4 pb-4 pt-3 animate-fade-in">
        <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-600">Your leads in this stage</span>
          <span className="text-[14px] font-black text-slate-900">{entry.count}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-100 px-4 pb-4 pt-3 animate-fade-in">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Team Breakdown</p>
      <div className="space-y-2 overflow-y-auto custom-scrollbar-thin" style={{ maxHeight: '220px' }}>
        {card.userBreakdown.map((entry, i) => (
          <UserBreakdownCard
            key={entry.user?.id ?? i}
            entry={entry}
            stageTotal={card.count}
            stageColor={chartColor}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Team Contribution Panel (replaces donut chart) ───────────────────────────
const TeamContributionPanel = ({ cards, fixedHeight }) => {
  // Merge all userBreakdown arrays across all cards into per-user totals
  const contributors = useMemo(() => {
    const map = new Map();
    cards.forEach(card => {
      (card.userBreakdown ?? []).forEach(entry => {
        const uid   = entry.user?.id ?? 'unknown';
        const name  = entry.user?.name  ?? 'Unknown User';
        const email = entry.user?.email ?? '';
        if (!map.has(uid)) {
          map.set(uid, { uid, name, email, total: 0, stages: [] });
        }
        const rec = map.get(uid);
        rec.total += entry.count;
        if (entry.count > 0 && card.stageName) rec.stages.push(card.stageName);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [cards]);

  const grandTotal = contributors.reduce((s, c) => s + c.total, 0);
  const hasData    = contributors.length > 0;

  return (
    <div
      className="bg-white  border border-slate-200/70 p-4 sm:p-5 flex flex-col"
      
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.18em] leading-none mb-1">Team</p>
          <p className="text-sm font-bold text-slate-800 leading-none">Team Contribution</p>
        </div>
        <div className="h-8 w-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
          <Medal size={15} strokeWidth={1.8} />
        </div>
      </div>
      <div className="h-px bg-slate-100 mb-3 shrink-0" />

      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-10">
          <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
            <UserCircle size={18} />
          </div>
          <p className="text-xs font-semibold text-slate-500">No team activity for this range</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto custom-scrollbar-thin flex-1 min-h-0 pr-0.5">
          {contributors.map((c, idx) => {
            const ac  = avatarColor(typeof c.uid === 'number' ? c.uid : idx);
            const pct = grandTotal > 0 ? Math.round((c.total / grandTotal) * 100) : 0;
            const rankColor = idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-orange-400' : 'text-slate-300';
            return (
              <div key={c.uid} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                {/* Rank + avatar */}
                <div className="relative shrink-0">
                  <div className={`h-9 w-9 rounded-xl ${ac.bg} ${ac.text} flex items-center justify-center text-[11px] font-black`}>
                    {getInitials(c.name)}
                  </div>
                  {idx < 3 && (
                    <div className={`absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white border border-slate-100 flex items-center justify-center ${rankColor}`}>
                      <Medal size={9} strokeWidth={2.5} />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-[12px] font-bold text-slate-800 truncate">{c.name}</p>
                    <span className="text-[12px] font-black text-slate-900 shrink-0">{c.total} <span className="text-[10px] font-semibold text-slate-500">leads</span></span>
                  </div>
                  {c.email && <p className="text-[10px] text-slate-500 truncate mb-1.5">{c.email}</p>}
                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {/* Stage badges */}
                  {c.stages.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {c.stages.map(s => (
                        <span key={s} className="text-[9px] font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Metric Card ─────────────────────────────────────────────────────────────
const MetricCard = ({ card, index, chartColor, isExpanded, onToggle, isSelfView }) => {
  const visual       = CARD_VISUAL_MAP[card.key] ?? FALLBACK_VISUAL;
  const cfg          = COLOR_CONFIG[visual.color];
  const Icon         = visual.icon;
  const hasBreakdown = (card.userBreakdown?.length ?? 0) > 0;

  return (
    <div
      className="group relative bg-white  border border-slate-200/70 overflow-hidden animate-slide-in-bottom"
      style={{
        animationDelay: `${index * 55}ms`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)';
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute top-0 left-0 w-[3px] h-full opacity-40 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundColor: chartColor }}
      />

      <div className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4">
        {/* Icon row */}
        <div className="flex items-start justify-between mb-4">
          <div className={`h-11 w-11 rounded-xl ${cfg.bg} ${cfg.text} border ${cfg.border} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0`}>
            <Icon size={20} strokeWidth={1.8} />
          </div>
          {card.stageExists === false && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-bold leading-none">
              <AlertTriangle size={10} strokeWidth={2.5} />
              Not configured
            </span>
          )}
        </div>

        {/* Label */}
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.18em] mb-1 group-hover:text-primary transition-colors duration-200 leading-none">
          {card.label}
        </p>

        {/* Animated count */}
        <h2 className={`text-3xl sm:text-4xl font-black font-heading tracking-tight leading-none mb-3 transition-colors duration-200 ${card.count > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
          {card.count > 0
            ? <CountUp end={card.count} duration={1.1} separator="," useEasing />
            : '0'
          }
        </h2>

        {/* Stage name + expand toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: card.stageExists === false ? '#e2e8f0' : chartColor }}
            />
            <span className={`text-[11px] font-semibold truncate ${card.stageExists === false ? 'text-slate-400' : 'text-slate-600'}`}>
              {card.stageName || 'No stage linked'}
            </span>
          </div>
          {hasBreakdown && (
            <button
              onClick={onToggle}
              className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-lg hover:bg-primary/8 text-slate-500 hover:text-primary transition-all shrink-0"
              style={{ '--tw-bg-opacity': 0.08 }}
            >
              {isExpanded
                ? <><ChevronUp size={11} strokeWidth={2.5} />Hide</>
                : isSelfView
                  ? <><ChevronDown size={11} strokeWidth={2.5} />View my leads</>
                  : <><ChevronDown size={11} strokeWidth={2.5} />View by user</>
              }
            </button>
          )}
        </div>
      </div>

      {/* Expandable breakdown accordion */}
      <StageCardBreakdown card={card} chartColor={chartColor} isOpen={isExpanded} isSelfView={isSelfView} />
    </div>
  );
};

// ─── Shimmer skeleton primitive ──────────────────────────────────────────────
// A single reusable shimmer block — more premium than plain animate-pulse.
const Shimmer = ({ className = '' }) => (
  <div className={`relative overflow-hidden bg-slate-100 rounded-lg ${className}`}>
    <div
      className="absolute inset-0 -translate-x-full"
      style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
        animation: 'shimmer 1.6s infinite',
      }}
    />
  </div>
);

// ─── Metric Card skeleton ─────────────────────────────────────────────────────
const MetricCardSkeleton = () => (
  <div className="relative bg-white  border border-slate-200/70 overflow-hidden" >
    <div className="absolute top-0 left-0 w-[3px] h-full bg-slate-100" />
    <div className="px-5 pt-5 pb-4 space-y-4">
      <Shimmer className="h-11 w-11 rounded-xl" />
      <div className="space-y-2">
        <Shimmer className="h-2.5 w-20" />
        <Shimmer className="h-9 w-16 rounded-xl" />
      </div>
      <div className="flex items-center gap-1.5">
        <Shimmer className="h-1.5 w-1.5 rounded-full" />
        <Shimmer className="h-2.5 w-24" />
      </div>
    </div>
  </div>
);

// ─── Summary strip skeleton ───────────────────────────────────────────────────
const SummaryStripSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
    {[1,2,3,4].map(i => (
      <div key={i} className="bg-white  border border-slate-100 px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2.5 sm:gap-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <Shimmer className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <Shimmer className="h-2 w-16" />
          <Shimmer className="h-5 w-12 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Chart section skeleton ───────────────────────────────────────────────────
const ChartSectionSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
    <div className="lg:col-span-2 bg-white  border border-slate-200/70 p-4 sm:p-5" >
      <div className="flex items-center justify-between mb-3">
        <div className="space-y-2">
          <Shimmer className="h-2.5 w-24" />
          <Shimmer className="h-3 w-36" />
        </div>
      </div>
      <div className="h-px bg-slate-100 mb-3" />
      <Shimmer className="flex-1 h-[300px] w-full rounded-xl" />
    </div>
    <div className="bg-white  border border-slate-200/70 p-4 sm:p-5" >
      <div className="flex items-center justify-between mb-3">
        <div className="space-y-2">
          <Shimmer className="h-2.5 w-16" />
          <Shimmer className="h-3 w-28" />
        </div>
        <Shimmer className="h-8 w-8 rounded-xl" />
      </div>
      <div className="h-px bg-slate-100 mb-3" />
      <div className="space-y-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Shimmer className="h-9 w-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-2.5 w-24" />
              <Shimmer className="h-1.5 w-full rounded-full" />
            </div>
            <Shimmer className="h-4 w-8 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Custom bar chart tooltip ─────────────────────────────────────────────────
const BarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div
      className="bg-white border border-slate-100 rounded-xl px-3 py-2.5"
      style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.10)', minWidth: 140 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
        <span className="text-[11px] font-bold text-slate-600 truncate">{entry.payload.label}</span>
      </div>
      <p className="text-[18px] font-black text-slate-900 leading-none">
        {entry.value.toLocaleString()}
        <span className="text-[11px] font-semibold text-slate-500 ml-1">leads</span>
      </p>
      {entry.payload.stageName && (
        <p className="text-[10px] font-semibold text-slate-500 mt-1 truncate">{entry.payload.stageName}</p>
      )}
    </div>
  );
};

// ─── Custom Y-axis tick (stage label) ─────────────────────────────────────────
const BarYAxisTick = ({ x, y, payload }) => (
  <text
    x={x - 8}
    y={y}
    dy={4}
    textAnchor="end"
    fill="#475569"
    fontSize={11}
    fontWeight={700}
    fontFamily="DM Sans, sans-serif"
  >
    {payload.value}
  </text>
);

// ─── Bar value label (rendered at end of each bar) ───────────────────────────
const BarValueLabel = ({ x, y, width, height, value }) => {
  if (!value) return null;
  return (
    <text
      x={x + width + 6}
      y={y + height / 2}
      dy={4}
      textAnchor="start"
      fill="#1e293b"
      fontSize={11}
      fontWeight={700}
      fontFamily="DM Sans, sans-serif"
    >
      {value.toLocaleString()}
    </text>
  );
};

// ─── Horizontal Bar Chart section ─────────────────────────────────────────────
const StageBarChart = ({ cards }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const yAxisWidth = containerWidth < 400 ? 120 : containerWidth < 600 ? 150 : 180;
  const data = useMemo(() =>
    cards.map(c => ({
      label:     c.label,
      stageName: c.stageName,
      key:       c.key,
      count:     c.count,
      color:     CHART_COLORS[c.key] ?? CHART_COLORS.fallback,
    })),
    [cards]
  );

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const hasData  = data.some(d => d.count > 0);

  const barSeries = [
    {
      dataKey: 'count',
      radius: [0, 5, 5, 0],
      maxBarSize: 22,
      label: <BarValueLabel />,
    },
  ];

  return (
    <div className="bg-white border border-slate-200/70 p-4 sm:p-5 flex flex-col">
      <div className="mb-3 shrink-0">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.18em] leading-none mb-1">
          Stage Activity
        </p>
        <p className="text-sm font-bold text-slate-800 leading-none">
          Lead Movement by Stage
        </p>
      </div>

      <div className="h-px bg-slate-100 mb-3 shrink-0" />

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-2 text-center rounded-xl bg-slate-50 border border-slate-100 flex-1">
          <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300">
            <BarChart3 size={18} />
          </div>
          <p className="text-xs font-semibold text-slate-500">No movement data for this range</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0" ref={containerRef}>
          <CrmBarChart
            data={data}
            xKey="label"
            bars={barSeries}
            layout="vertical"
            height={260}
            yAxisWidth={yAxisWidth}
            customYTick={<BarYAxisTick />}
            customTooltip={<BarTooltip />}
            showGrid={true}
            showLegend={false}
          />
        </div>
      )}

      {hasData && (
        <div className="flex flex-wrap justify-center gap-x-3 sm:gap-x-5 gap-y-1.5 mt-3 pt-3 border-t border-slate-100 shrink-0">
          {data.map(d => (
            <div key={d.key} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-[9px] sm:text-[10px] font-semibold text-slate-600 whitespace-nowrap leading-none">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Pie tooltip ─────────────────────────────────────────────────────────────
const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-slate-100 rounded-xl px-3 py-2" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
      <p className="text-[11px] font-bold text-slate-700">{d.name}</p>
      <p className="text-[12px] font-black text-slate-900">
        {d.value.toLocaleString()}
        <span className="text-slate-500 font-semibold ml-1">({d.payload.pct}%)</span>
      </p>
    </div>
  );
};

// ─── Donut / Pie Chart section ────────────────────────────────────────────────
const StageDonutChart = ({ cards }) => {
  const total = cards.reduce((s, c) => s + c.count, 0);

  const pieData = useMemo(() =>
    cards
      .filter(c => c.count > 0)
      .map(c => ({
        name:  c.label,
        key:   c.key,
        value: c.count,
        pct:   total > 0 ? Math.round((c.count / total) * 100) : 0,
      })),
    [cards, total]
  );

  const colors = pieData.map((entry, i) => CHART_COLORS[entry.key] ?? PIE_COLORS[i % PIE_COLORS.length]);

  return (
    <div className="bg-white border border-slate-200/70 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.18em] leading-none mb-1">Distribution</p>
          <p className="text-sm font-bold text-slate-800 leading-none">Stage Breakdown</p>
        </div>
        <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
          <PieIcon size={15} strokeWidth={1.8} />
        </div>
      </div>

      <div className="h-px bg-slate-100 mb-4" />

      <CrmPieChart
        data={pieData}
        colors={colors}
        innerRadius={54}
        outerRadius={80}
        height={180}
        showLegend={true}
        showPercentage={true}
        customTooltip={<PieTooltip />}
        emptyMessage="No data to distribute"
      />
    </div>
  );
};

// ─── Scope Header Banner ─────────────────────────────────────────────────────
// Renders a contextual banner based on viewMode. Uses only data.viewMode and
// data.viewer — never checks role names directly.
const ScopeHeader = ({ viewMode, viewer }) => {
  const isSelf = viewMode === 'self';

  return (
    <div
      className="relative overflow-hidden  border animate-fade-in"
      style={
        isSelf
          ? {
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderColor: '#e2e8f0',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03)',
            }
          : {
              background: 'linear-gradient(135deg, #fafbff 0%, #f5f7ff 100%)',
              borderColor: '#e0e7ff',
              boxShadow: '0 1px 4px rgba(99,102,241,0.06), 0 4px 12px rgba(99,102,241,0.04)',
            }
      }
    >
      {/* Subtle left accent */}
      <div
        className="absolute top-0 left-0 w-[3px] h-full rounded-l-2xl"
        style={{ background: isSelf ? 'linear-gradient(180deg, #64748b, #94a3b8)' : 'linear-gradient(180deg, #6366f1, #818cf8)' }}
      />

      <div className="pl-5 pr-5 py-4 flex items-center gap-4">
        {/* Icon */}
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
          style={
            isSelf
              ? { background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569' }
              : { background: '#eef2ff', border: '1px solid #e0e7ff', color: '#6366f1' }
          }
        >
          {isSelf ? <ClipboardList size={18} strokeWidth={1.8} /> : <Building2 size={18} strokeWidth={1.8} />}
        </div>

        {/* Text block */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] leading-none mb-1"
            style={{ color: isSelf ? '#64748b' : '#6366f1' }}>
            {isSelf ? 'Personal View' : 'Branch View'}
          </p>
          <p className="text-sm font-bold text-slate-800 leading-none">
            {isSelf ? 'Your Performance Overview' : 'Branch Performance Overview'}
          </p>
        </div>

        {/* Right: viewer info + scope description */}
        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
          {viewer?.name && (
            <div className="flex items-center gap-1.5">
              <div
                className="h-5 w-5 rounded-md flex items-center justify-center text-[9px] font-black"
                style={
                  isSelf
                    ? { background: '#e2e8f0', color: '#475569' }
                    : { background: '#e0e7ff', color: '#6366f1' }
                }
              >
                {getInitials(viewer.name)}
              </div>
              <span className="text-[12px] font-bold text-slate-700">{viewer.name}</span>
            </div>
          )}
          <p className="text-[10px] font-medium text-slate-500">
            {isSelf
              ? '📋 Showing your personal lead activity'
              : '🏢 Showing branch-wide performance analytics'}
          </p>
        </div>

        {/* Mobile: scope description only */}
        <div className="sm:hidden shrink-0">
          <span className="text-[11px] font-medium text-slate-500">
            {isSelf ? '📋 Personal' : '🏢 Branch-wide'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Self-view Personal Summary ───────────────────────────────────────────────
// Shown only in self mode. Replaces team analytics with a personal insights card.
const SelfPersonalSummary = ({ cards, totalLeads }) => {
  const totalMoved = totalLeads;

  // Most active stage (highest count)
  const topCard = cards.length > 0
    ? cards.reduce((a, b) => a.count >= b.count ? a : b, cards[0])
    : null;

  // Number of stages with activity
  const activeStageCount = cards.filter(c => c.count > 0).length;

  // Latest activity timestamp across all leads in all cards
  const latestTs = useMemo(() => {
    let latest = null;
    cards.forEach(card => {
      (card.userBreakdown ?? []).forEach(entry => {
        (entry.leads ?? []).forEach(lead => {
          if (lead.movedAt) {
            if (!latest || lead.movedAt > latest) latest = lead.movedAt;
          }
        });
      });
    });
    return latest;
  }, [cards]);

  const stats = [
    {
      icon: TrendingUp,
      label: 'Total Leads',
      sublabel: 'Moved',
      value: totalMoved,
      isText: false,
      gradient: 'from-blue-50 to-indigo-50',
      border: 'border-blue-100',
      iconBg: 'bg-blue-500',
      iconText: 'text-white',
      valueColor: 'text-blue-700',
    },
    {
      icon: Flame,
      label: 'Most Active',
      sublabel: 'Stage',
      value: topCard?.stageName ?? '—',
      isText: true,
      gradient: 'from-amber-50 to-orange-50',
      border: 'border-amber-100',
      iconBg: 'bg-amber-500',
      iconText: 'text-white',
      valueColor: 'text-amber-700',
    },
    {
      icon: Activity,
      label: 'Active',
      sublabel: 'Categories',
      value: activeStageCount,
      isText: false,
      gradient: 'from-emerald-50 to-teal-50',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-500',
      iconText: 'text-white',
      valueColor: 'text-emerald-700',
    },
    {
      icon: Clock,
      label: 'Latest',
      sublabel: 'Activity',
      value: latestTs ? formatDateTime(latestTs) : '—',
      isText: true,
      gradient: 'from-slate-50 to-slate-100',
      border: 'border-slate-200',
      iconBg: 'bg-slate-600',
      iconText: 'text-white',
      valueColor: 'text-slate-700',
    },
  ];

  const hasActivity = totalMoved > 0;

  return (
    <div
      className="bg-white  border border-slate-200/70 p-5 flex flex-col overflow-hidden animate-fade-in"
      
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.18em] leading-none mb-1">Personal</p>
          <p className="text-sm font-bold text-slate-800 leading-none">Your Activity Summary</p>
        </div>
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <Zap size={15} strokeWidth={2} />
        </div>
      </div>
      <div className="h-px bg-slate-100 mb-3 shrink-0" />

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
        {stats.map(({ icon: Icon, label, sublabel, value, isText, gradient, border, iconBg, iconText, valueColor }) => (
          <div
            key={label}
            className={`relative rounded-xl border ${border} bg-gradient-to-br ${gradient} px-3 py-2.5 flex flex-col gap-2 overflow-hidden`}
          >
            <div className={`h-6 w-6 rounded-lg ${iconBg} ${iconText} flex items-center justify-center shadow-sm shrink-0`}>
              <Icon size={12} strokeWidth={2} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{sublabel}</p>
              {isText ? (
                <p className={`text-[13px] font-black ${valueColor} leading-none truncate`}>{value}</p>
              ) : (
                <p className={`text-xl font-black ${valueColor} leading-none font-heading`}>
                  {typeof value === 'number' && value > 0
                    ? <CountUp end={value} duration={1.0} separator="," useEasing />
                    : value || '0'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-slate-100 mb-3 shrink-0" />

      {/* ── Summary insight — flex-1 so it fills remaining space without overflowing ── */}
      <div className="flex-1 min-h-0">
        {hasActivity ? (
          <div className="h-full rounded-xl bg-gradient-to-br from-primary/5 to-indigo-50 border border-primary/10 px-3.5 py-3 flex flex-col justify-between">
            {/* Label row */}
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <TrendingUp size={11} strokeWidth={2.5} />
              </div>
              <p className="text-[9px] font-black text-primary uppercase tracking-widest">Performance Insight</p>
            </div>
            {/* Insight text */}
            <p className="text-[11.5px] font-medium text-slate-600 leading-relaxed flex-1">
              You moved{' '}
              <span className="font-black text-slate-900">{totalMoved.toLocaleString()} lead{totalMoved !== 1 ? 's' : ''}</span>{' '}
              in this date range
              {topCard && topCard.count > 0 && (
                <>, with the most activity in{' '}
                  <span className="font-black text-slate-900">{topCard.stageName}</span>
                </>
              )}.
            </p>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center rounded-xl bg-slate-50 border border-slate-100">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300">
              <Activity size={18} />
            </div>
            <p className="text-xs font-semibold text-slate-400">No activity recorded for this range</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const BranchDashboardPage = () => {
  const today = getTodayDate();
  const { forceHideLoader } = useLoader();
  const didHideInitialLoaderRef = useRef(false);

  // Two-phase date state: temp (controlled by inputs) vs committed (triggers fetch)
  const [tempStartDate, setTempStartDate] = useState(today);
  const [tempEndDate,   setTempEndDate]   = useState(today);
  const [dateError,     setDateError]     = useState('');
  const [filters, setFilters] = useState({ startDate: today, endDate: today });
  // Accordion state — only one card open at a time
  const [expandedCards, setExpandedCards] = useState({});
  const toggleCard = useCallback((key) => {
    setExpandedCards(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const { dashboardData, loading, error, refetch } = useBranchDashboard({
    startDate: filters.startDate || undefined,
    endDate:   filters.endDate   || undefined,
  });

  // Hide the global route-transition loader once the first data load completes
  useEffect(() => {
    if (!didHideInitialLoaderRef.current && !loading) {
      forceHideLoader();
      didHideInitialLoaderRef.current = true;
    }
  }, [loading, forceHideLoader]);

  // Validate dates on every temp change so the Apply button can be disabled
  useEffect(() => {
    if (tempStartDate && tempEndDate && tempStartDate > tempEndDate) {
      setDateError('Start date cannot be after end date');
    } else {
      setDateError('');
    }
  }, [tempStartDate, tempEndDate]);

  const handleApplyFilter = useCallback(() => {
    if (dateError) {
      toast.error(dateError);
      return;
    }
    setFilters({ startDate: tempStartDate, endDate: tempEndDate });
  }, [dateError, tempStartDate, tempEndDate]);

  const handleResetFilter = useCallback(() => {
    const t = getTodayDate();
    setTempStartDate(t);
    setTempEndDate(t);
    setDateError('');
    setFilters({ startDate: t, endDate: t });
  }, []);

  // Derived values from API response.
  // normalizeDate() handles both ISO timestamps and plain YYYY-MM-DD strings,
  // always resolving to the LOCAL calendar date — no UTC-offset day shifts.
  const cards          = dashboardData?.cards ?? [];
  const totalLeads     = dashboardData?.totalLeadsInRange ?? 0;
  const rangeStart     = normalizeDate(dashboardData?.range?.startDate ?? filters.startDate);
  const rangeEnd       = normalizeDate(dashboardData?.range?.endDate   ?? filters.endDate);
  const isDefaultRange = dashboardData?.range?.isDefault ?? false;
  // Both comparisons now operate on normalized YYYY-MM-DD strings — safe string equality
  const isSingleDay    = rangeStart !== '' && rangeStart === rangeEnd;

  // ── Role-based view mode — derived from backend response only ──
  // NEVER check role names here. Use data.viewMode exclusively.
  const isSelfView = dashboardData?.viewMode === 'self';
  const viewer     = dashboardData?.viewer ?? null;

  // ── 403 / permission error ──
  const is403 = error?.includes('403') || error?.toLowerCase().includes('permission') || error?.toLowerCase().includes('forbidden');

  // ── Error state (no data at all) ──
  if (error && !dashboardData) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 bg-white rounded-3xl p-8 sm:p-10 shadow-soft border border-slate-100 max-w-sm w-full text-center">
          <div className={`h-12 w-12  flex items-center justify-center ${is403 ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'}`}>
            {is403 ? <AlertTriangle size={22} /> : <RefreshCw size={22} />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 mb-1">
              {is403 ? 'Access Restricted' : 'Failed to load dashboard'}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              {is403
                ? 'You do not have permission to access branch analytics.'
                : error}
            </p>
          </div>
          {!is403 && (
            <button
              onClick={refetch}
              className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="  space-y-4  min-h-screen">

      {/* ══════════════════════════════════════════════════════
           PAGE HEADER
           Mobile  : stacked — title block / date filter / total leads
           Tablet+ : 2-col — [title] [filter controls]
         ══════════════════════════════════════════════════════ */}
      <div className="bg-white  border border-slate-200/80 overflow-hidden" >

        {/* Brand accent bar */}
        {/* <div className="h-[3px] w-full bg-gradient-to-r from-primary via-orange-400 to-amber-300" /> */}

        <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">

          {/* ── LEFT: Identity ─────────────────────────────────── */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="h-11 w-11 sm:h-12 sm:w-12 bg-orange-50 rounded-lg flex items-center justify-center text-primary  shrink-0">
              <LayoutDashboard size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight leading-none">
                  Branch Analytics
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-slate-500 text-xs font-medium mt-1 leading-none">
                Pipeline stage movement analytics
                {!loading && (
                  <>
                    <span className="mx-2 text-slate-300">·</span>
                    <span className="text-slate-500 font-semibold">
                      {isDefaultRange || isSingleDay
                        ? formatDisplayDate(rangeStart)
                        : `${formatDisplayDate(rangeStart)} – ${formatDisplayDate(rangeEnd)}`}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* ── RIGHT: Date filter controls ────────────────────── */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3 shrink-0">

            {/* MOBILE date filter (hidden sm+) */}
            <div className="sm:hidden bg-slate-50 border border-slate-200  overflow-hidden">
              <label className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 cursor-pointer">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar size={15} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">From</p>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full text-sm font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer"
                  />
                </div>
              </label>
              <label className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 cursor-pointer">
                <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Calendar size={15} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">To</p>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full text-sm font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer"
                  />
                </div>
              </label>
              {dateError && (
                <p className="px-4 py-2 text-[11px] font-semibold text-rose-500 bg-rose-50 border-b border-rose-100">
                  {dateError}
                </p>
              )}
              <div className="flex items-center gap-2 px-4 py-3">
                <button
                  onClick={handleApplyFilter}
                  disabled={loading || !!dateError}
                  className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-40 shadow-md shadow-primary/20"
                >
                  <Filter size={14} />
                  Apply Filter
                </button>
                <button
                  onClick={handleResetFilter}
                  disabled={loading}
                  title="Reset to today"
                  className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-500 flex items-center justify-center hover:text-primary hover:border-primary/40 active:scale-95 transition-all disabled:opacity-40 shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* DESKTOP date filter (hidden on mobile) */}
            <div className="hidden sm:flex flex-col gap-1.5">
              <div className="flex items-stretch bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                {/* From */}
                <label className="flex items-center gap-2 px-3 py-2.5 border-r border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors min-w-0">
                  <Calendar size={14} className="text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">From</p>
                    <input
                      type="date"
                      value={tempStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                      className="block text-[12px] font-semibold text-slate-700 bg-transparent border-none outline-none cursor-pointer mt-0.5 w-[118px]"
                    />
                  </div>
                </label>
                {/* To */}
                <label className="flex items-center gap-2 px-3 py-2.5 border-r border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors min-w-0">
                  <Calendar size={14} className="text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">To</p>
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
                    disabled={loading || !!dateError}
                    className="h-8 px-3.5 rounded-lg bg-primary text-white text-[11px] font-bold flex items-center gap-1.5 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-40 shadow-sm shadow-primary/20 whitespace-nowrap"
                  >
                    <Filter size={12} />
                    Apply
                  </button>
                  <button
                    onClick={handleResetFilter}
                    disabled={loading}
                    title="Reset to today"
                    className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-500 flex items-center justify-center hover:text-primary hover:border-primary/40 active:scale-95 transition-all disabled:opacity-40"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
              {/* Inline validation — only visible when invalid */}
              {dateError && (
                <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 px-1">
                  <AlertTriangle size={11} strokeWidth={2.5} />
                  {dateError}
                </p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── KPI Summary Strip ── */}
      {loading ? (
        <SummaryStripSkeleton />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 animate-fade-in">
          {/* Total Leads */}
          <div className="bg-white  border border-slate-200/70 px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2.5 sm:gap-3" >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <TrendingUp size={16} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black font-bold uppercase tracking-widest leading-none mb-1">Total Leads</p>
              <p className="text-lg sm:text-xl font-black font-heading text-slate-900 leading-none">
                <CountUp end={totalLeads} duration={1.0} separator="," useEasing />
              </p>
            </div>
          </div>

          {/* Active Stages */}
          <div className="bg-white  border border-slate-200/70 px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2.5 sm:gap-3" >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Activity size={16} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black font-bold uppercase tracking-widest leading-none mb-1">Active Stages</p>
              <p className="text-lg sm:text-xl font-black font-heading text-slate-900 leading-none">
                <CountUp end={cards.filter(c => c.stageExists !== false).length} duration={0.8} useEasing />
              </p>
            </div>
          </div>

          {/* Best Stage */}
          <div className="bg-white  border border-slate-200/70 px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2.5 sm:gap-3" >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Flame size={16} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black font-bold uppercase tracking-widest leading-none mb-1">Top Stage</p>
              <p className="text-[12px] sm:text-[13px] font-black text-slate-900 leading-none truncate">
                {cards.length > 0
                  ? (cards.reduce((a, b) => a.count >= b.count ? a : b, cards[0])?.stageName || '—')
                  : '—'}
              </p>
            </div>
          </div>

          {/* Date range */}
          <div className="bg-white  border border-slate-200/70 px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2.5 sm:gap-3" >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
              <Calendar size={16} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black font-bold uppercase tracking-widest leading-none mb-1">Range</p>
              <p className="text-[11px] sm:text-[12px] font-bold text-slate-700 leading-none truncate">
                {isDefaultRange
                  ? 'Today'
                  : isSingleDay
                    ? formatDisplayDate(rangeStart)
                    : `${formatDisplayDate(rangeStart)} → ${formatDisplayDate(rangeEnd)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Follow-up Reminders Widget ── */}
      <ReminderWidget />

      {/* ── Charts Section ── */}
      {loading ? (
        <ChartSectionSkeleton />
      ) : cards.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 animate-fade-in">
          <div className="lg:col-span-2">
            <StageBarChart cards={cards} />
          </div>
          <div className="lg:col-span-1">
            {isSelfView
              ? <SelfPersonalSummary cards={cards} totalLeads={totalLeads} />
              : <TeamContributionPanel cards={cards} />
            }
          </div>
        </div>
      ) : null}

      {/* ── Metric Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 sm:gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <MetricCardSkeleton key={i} />)
          : cards.length === 0
            ? (
              <div className="col-span-full flex flex-col items-center justify-center gap-4 bg-white  border border-slate-100 py-16 px-6 text-center animate-fade-in" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="h-14 w-14  bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-200">
                  <BarChart3 size={26} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-600 mb-1.5">No lead movement detected</p>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    No stage transitions were recorded for the selected date range.<br />Try a different period or reset to today.
                  </p>
                </div>
                <button
                  onClick={handleResetFilter}
                  className="mt-1 px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/20"
                >
                  Reset to today
                </button>
              </div>
            )
            : cards.map((card, index) => (
                <MetricCard
                  key={card.key}
                  card={card}
                  index={index}
                  chartColor={CHART_COLORS[card.key] ?? CHART_COLORS.fallback}
                  isExpanded={!!expandedCards[card.key]}
                  onToggle={() => toggleCard(card.key)}
                  isSelfView={isSelfView}
                />
              ))
        }
      </div>

    </div>
  );
};

export default BranchDashboardPage;
