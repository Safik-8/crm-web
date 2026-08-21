// FrontEnd/src/features/kpi/pages/KpiDetailPage.jsx

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Target, ArrowLeft, Calendar, User, Users, Building2, TrendingUp, AlertCircle, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useKpiDetail } from '../hooks/useKpi';
import GlobalLoader from '../../../shared/components/elements/GlobalLoader';
import Skeleton from '../../../shared/components/elements/Skeleton';
import Button from '../../../shared/components/elements/Button';
import { CrmBarChart, CrmLineChart } from '../../../shared/components/charts';

export default function KpiDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const primaryRole = user?.primaryRole || '';
  const isIse = primaryRole === 'ISE';

  const { data: detailResponse, isLoading, isError, error } = useKpiDetail(id, {
    enabled: Boolean(id) && !isIse,
  });

  const target = detailResponse?.data || detailResponse || {};

  if (isIse) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-8 rounded-none text-center max-w-lg mx-auto my-12 space-y-3">
        <AlertCircle size={36} className="mx-auto text-rose-600" />
        <h3 className="text-lg font-bold">Access Restricted</h3>
        <p className="text-xs text-rose-600">
          ISE role users are restricted from inspecting detailed target breakdowns.
        </p>
        <Link to="/my-performance" className="inline-block pt-2 text-xs font-bold text-rose-700 underline">
          Back to My Performance
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
        <div className="bg-white border border-slate-200/80 p-6 rounded-none shadow-2xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 bg-slate-50 border border-slate-100 space-y-2">
                <Skeleton className="h-3 w-20 mx-auto" />
                <Skeleton className="h-7 w-24 mx-auto" />
              </div>
            ))}
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !target) {
    const isForbidden = error?.response?.status === 403 || error?.message?.includes('Forbidden') || error?.message?.includes('restricted');
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-8 rounded-none text-center max-w-lg mx-auto my-12 space-y-3 shadow-2xs">
        <AlertCircle size={36} className="mx-auto text-rose-600" />
        <h3 className="text-lg font-bold">{isForbidden ? 'Access Restricted (403)' : 'Target Detail Error'}</h3>
        <p className="text-xs text-rose-600">
          {error?.response?.data?.message || error?.message || 'You do not have permission to inspect this KPI target.'}
        </p>
        <Link to="/kpi-analytics" className="inline-block pt-2 text-xs font-bold text-rose-700 underline">
          Back to KPI Analytics
        </Link>
      </div>
    );
  }

  const {
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
    createdBy,
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

  const statusMap = {
    GREEN: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500' },
    YELLOW: { label: 'In Progress', color: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'bg-amber-500' },
    RED: { label: 'Below Target', color: 'bg-rose-50 text-rose-700 border-rose-200', bar: 'bg-rose-500' },
  };
  const currentStatus = statusMap[statusColor] || statusMap.RED;

  const progressPct = Math.min(100, Math.max(0, achievementPercentage));

  const chartData = [
    { period: 'Start', Target: 0, Achieved: 0 },
    { period: 'Mid Period', Target: Math.round(targetValue / 2), Achieved: Math.round(achievedValue / 2) },
    { period: 'Current Live', Target: targetValue, Achieved: achievedValue },
  ];

  const lineSeries = [
    { dataKey: 'Target', name: 'Target Line', stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '4 4' },
    { dataKey: 'Achieved', name: 'Live Achievement', stroke: '#f97316', strokeWidth: 3 },
  ];

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Target className="text-orange-500" size={24} />
            <span>{kpiType} Target Detail</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Detailed breakdown, target metrics, timeline & achievement trajectory.
          </p>
        </div>

        <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${currentStatus.color}`}>
          {currentStatus.label}
        </div>
      </div>

      {/* Target Progress Overview Card */}
      <div className="bg-white border border-slate-200/80 rounded-none p-6 shadow-2xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-none">
            <span className="text-xs font-bold text-slate-500 uppercase block">Metric Type</span>
            <span className="text-lg font-bold text-slate-900 mt-1 block">{kpiType}</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-none">
            <span className="text-xs font-bold text-slate-500 uppercase block">Target Value</span>
            <span className="text-lg font-bold text-slate-900 mt-1 block">{formattedTarget}</span>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-100 rounded-none">
            <span className="text-xs font-bold text-orange-700 uppercase block">Achieved Value</span>
            <span className="text-lg font-extrabold text-orange-600 mt-1 block">{formattedAchieved}</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-none">
            <span className="text-xs font-bold text-slate-500 uppercase block">Remaining</span>
            <span className="text-lg font-bold text-slate-700 mt-1 block">{formattedRemaining}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Achievement Completion Rate</span>
            <span className="font-extrabold text-orange-600 text-sm">{achievementPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${currentStatus.bar}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Target Metadata & Assignment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-none p-5 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
            Assignment Details
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Assigned Employee:</span>
              <span className="font-semibold text-slate-800">{employee?.name || 'N/A (General Target)'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Employee Code:</span>
              <span className="font-semibold text-slate-800">{employee?.employeeCode || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Team:</span>
              <span className="font-semibold text-slate-800">{team?.name || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Branch:</span>
              <span className="font-semibold text-slate-800">{branch?.name || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-none p-5 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
            Timeline & Period
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Duration:</span>
              <span className="font-semibold text-slate-800 uppercase">{duration}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Start Date:</span>
              <span className="font-semibold text-slate-800">{new Date(startDate).toLocaleDateString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">End Date:</span>
              <span className="font-semibold text-slate-800">{new Date(endDate).toLocaleDateString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Defined By:</span>
              <span className="font-semibold text-slate-800">{createdBy?.name || 'System Admin'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trajectory Line Chart */}
      <div className="bg-white border border-slate-200/80 rounded-none p-5 shadow-2xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
          Achievement Trajectory
        </h3>
        <div className="h-64 w-full">
          <CrmLineChart
            data={chartData}
            xKey="period"
            lines={lineSeries}
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}
