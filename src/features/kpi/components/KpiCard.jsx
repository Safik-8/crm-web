// FrontEnd/src/features/kpi/components/KpiCard.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Target, TrendingUp, CheckCircle, AlertTriangle, Clock, ArrowRight, User, Users, Building2 } from 'lucide-react';

export default function KpiCard({ target, canDrill = true }) {
  if (!target) return null;

  const {
    id,
    kpiType,
    targetValue,
    achievedValue,
    remainingValue,
    achievementPercentage,
    statusColor,
    duration,
    startDate,
    endDate,
    employee,
    team,
    branch,
  } = target;

  const formattedTarget = kpiType === 'REVENUE' || kpiType === 'SALES'
    ? `₹${Number(targetValue).toLocaleString('en-IN')}`
    : kpiType === 'CONVERSION'
    ? `${targetValue}%`
    : Number(targetValue).toLocaleString('en-IN');

  const formattedAchieved = kpiType === 'REVENUE' || kpiType === 'SALES'
    ? `₹${Number(achievedValue).toLocaleString('en-IN')}`
    : kpiType === 'CONVERSION'
    ? `${achievedValue}%`
    : Number(achievedValue).toLocaleString('en-IN');

  const formattedRemaining = kpiType === 'REVENUE' || kpiType === 'SALES'
    ? `₹${Number(remainingValue).toLocaleString('en-IN')}`
    : kpiType === 'CONVERSION'
    ? `${remainingValue}%`
    : Number(remainingValue).toLocaleString('en-IN');

  // Status Color Styling Config
  const statusConfig = {
    GREEN: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      bar: 'bg-emerald-500',
      icon: <CheckCircle size={15} className="text-emerald-600" />,
      label: 'Completed',
    },
    YELLOW: {
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      bar: 'bg-amber-500',
      icon: <Clock size={15} className="text-amber-600" />,
      label: 'In Progress',
    },
    RED: {
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      bar: 'bg-rose-500',
      icon: <AlertTriangle size={15} className="text-rose-600" />,
      label: 'Below Target',
    },
  };

  const currentStatus = statusConfig[statusColor] || statusConfig.RED;
  const progressPct = Math.min(100, Math.max(0, achievementPercentage));

  const entityName = employee?.name || team?.name || branch?.name || 'Assigned Target';

  return (
    <div className="bg-white border border-slate-200/80 rounded-none p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-slate-100 text-slate-700 rounded-md">
              <Target size={16} />
            </span>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight capitalize">
              {kpiType} Target
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded-full">
              {duration}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
            {employee ? <User size={13} /> : team ? <Users size={13} /> : <Building2 size={13} />}
            <span>{entityName}</span>
          </p>
        </div>

        {/* Status Badge */}
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${currentStatus.badge}`}>
          {currentStatus.icon}
          <span>{currentStatus.label}</span>
        </div>
      </div>

      {/* Target Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50/70 border border-slate-100 rounded-none text-center">
        <div>
          <span className="text-[11px] text-slate-500 uppercase font-semibold block">Target</span>
          <span className="text-sm font-bold text-slate-900">{formattedTarget}</span>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 uppercase font-semibold block">Achieved</span>
          <span className="text-sm font-extrabold text-orange-600">{formattedAchieved}</span>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 uppercase font-semibold block">Remaining</span>
          <span className="text-sm font-bold text-slate-600">{formattedRemaining}</span>
        </div>
      </div>

      {/* Progress Bar & Percentage */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Achievement Progress</span>
          <span className="font-extrabold text-slate-900">{achievementPercentage}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${currentStatus.bar}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Footer / Drill-down Link */}
      {canDrill && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-normal">
            Ends: {new Date(endDate).toLocaleDateString('en-IN')}
          </span>
          <Link
            to={`/kpi/${id}`}
            className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 hover:underline transition-colors"
          >
            <span>View Details</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}
