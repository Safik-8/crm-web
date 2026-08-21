// crm-web/src/features/dashboard/components/TargetProgressBar.jsx
import CountUp from 'react-countup';
import { Target } from 'lucide-react';

const KPI_LABEL_MAP = {
  LEAD_TARGET:                 'Lead Target',
  REVENUE_TARGET:              'Revenue Target',
  SALES_TARGET:                'Sales Target',
  OPPORTUNITY_TARGET:          'Opportunity Target',
  CONVERSION_TARGET:           'Conversion Target',
  CUSTOMER_ACQUISITION_TARGET: 'Customer Acquisition',
};

const TargetProgressBar = ({ kpi, isLoading = false }) => {
  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 rounded-xl h-16" />;
  }

  const target    = Number(kpi?.targetValue   ?? 0);
  const achieved  = Number(kpi?.achievedValue ?? 0);
  const pct       = target > 0 ? Math.min((achieved / target) * 100, 100) : 0;
  const remaining = Math.max(target - achieved, 0);

  const color =
    pct >= 100 ? 'bg-emerald-500' :
    pct >= 60  ? 'bg-amber-400'   :
                 'bg-rose-400';

  const textColor =
    pct >= 100 ? 'text-emerald-600' :
    pct >= 60  ? 'text-amber-600'   :
                 'text-rose-600';

  const label = KPI_LABEL_MAP[kpi?.kpiType] ?? kpi?.kpiType ?? 'KPI';

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
            <Target size={15} className="text-slate-500" />
          </span>
          <p className="text-xs font-semibold text-slate-600">{label}</p>
        </div>
        <span className={`text-xs font-bold ${textColor}`}>
          <CountUp end={pct} decimals={1} duration={0.8} />%
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <p className="text-[10px] text-slate-400">
          {achieved.toLocaleString()} / {target.toLocaleString()}
        </p>
        <p className="text-[10px] text-slate-400">
          {remaining.toLocaleString()} remaining
        </p>
      </div>
    </div>
  );
};

export default TargetProgressBar;
