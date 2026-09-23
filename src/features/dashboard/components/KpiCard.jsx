// crm-web/src/features/dashboard/components/KpiCard.jsx
import CountUp from 'react-countup';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const COLOR_CONFIG = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: 'text-blue-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', icon: 'text-purple-500' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100', icon: 'text-sky-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', icon: 'text-orange-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: 'text-emerald-500' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-100', icon: 'text-slate-400' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', icon: 'text-rose-500' },
};

const KpiCard = ({ icon: Icon, title, value = 0, prefix = '', suffix = '', subtext, badges, trend, color = 'blue', isLoading = false }) => {
  const c = COLOR_CONFIG[color] ?? COLOR_CONFIG.slate;
  const hasTrend = trend !== undefined && trend !== null;
  const isPositive = trend > 0;

  return (
    <div className={`bg-white border border-slate-200 shadow-sm p-4 flex flex-col justify-between h-full min-h-[130px] transition-all hover:border-slate-300 ${c.border} ${isLoading ? 'animate-pulse' : ''}`}>
      {/* Top Header: Icon on Left, Badges or Trend on Right */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center ${c.bg}`}>
          {Icon && <Icon size={19} className={c.icon} aria-hidden="true" />}
        </span>

        {/* Right Header: Badges or Trend Pill */}
        {badges && badges.length > 0 && !isLoading ? (
          <div className="flex items-center gap-1 flex-wrap justify-end max-w-[70%]">
            {badges.map((b, idx) => (
              <span
                key={idx}
                title={b.tooltip || `${b.label}: ${b.value ?? 0}`}
                className={`inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 border transition-all ${
                  b.color === 'sky'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : b.color === 'indigo'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : b.color === 'rose'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : b.color === 'emerald'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <span className="opacity-80 font-medium">{b.label}:</span>
                <span className="font-extrabold">{b.value ?? 0}</span>
              </span>
            ))}
          </div>
        ) : hasTrend ? (
          <span className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 border ${isPositive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        ) : null}
      </div>

      {/* Main Metric & Title */}
      <div className="mt-auto">
        <p className={`text-2xl font-extrabold tracking-tight ${c.text}`}>
          {isLoading ? '—' : <>{prefix}<CountUp end={typeof value === 'number' ? value : 0} duration={0.8} />{suffix}</>}
        </p>
        <p className="text-xs font-semibold text-slate-600 mt-0.5 truncate">{title}</p>
        {subtext && <p className="text-[11px] text-slate-400 mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
};

export default KpiCard;
