// crm-web/src/features/dashboard/components/KpiCard.jsx
import CountUp from 'react-countup';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const COLOR_CONFIG = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100',    icon: 'text-blue-500'    },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-100',  icon: 'text-purple-500'  },
  sky:     { bg: 'bg-sky-50',     text: 'text-sky-600',     border: 'border-sky-100',     icon: 'text-sky-500'     },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-100',  icon: 'text-orange-500'  },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: 'text-emerald-500' },
  slate:   { bg: 'bg-slate-50',   text: 'text-slate-500',   border: 'border-slate-100',   icon: 'text-slate-400'   },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-100',    icon: 'text-rose-500'    },
};

const KpiCard = ({ icon: Icon, title, value = 0, prefix = '', suffix = '', subtext, trend, color = 'blue', isLoading = false }) => {
  const c = COLOR_CONFIG[color] ?? COLOR_CONFIG.slate;
  const hasTrend = trend !== undefined && trend !== null;
  const isPositive = trend > 0;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col gap-2.5 transition-all ${c.border} ${isLoading ? 'animate-pulse' : ''}`}>
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg}`}>
          {Icon && <Icon size={19} className={c.icon} aria-hidden="true" />}
        </span>
        {hasTrend && (
          <span className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <div>
        <p className={`text-2xl font-extrabold ${c.text}`}>
          {isLoading ? '—' : <>{prefix}<CountUp end={typeof value === 'number' ? value : 0} duration={0.8} />{suffix}</>}
        </p>
        <p className="text-xs font-semibold text-slate-600 mt-0.5">{title}</p>
        {subtext && <p className="text-[11px] text-slate-400 mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
};

export default KpiCard;
