import React, { useState } from 'react';
import { Target, TrendingUp, CheckCircle2, Clock, AlertCircle, BarChart3, PieChart as PieIcon, Filter, Search } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useKpiDashboard } from '../hooks/useKpi';
import KpiCard from '../components/KpiCard';
import { CrmBarChart, CrmLineChart, CrmPieChart, ChartEmptyState } from '../../../shared/components/charts';
import Skeleton from '../../../shared/components/elements/Skeleton';
import SelectField from '../../../shared/components/elements/SelectField';
import TextField from '../../../shared/components/elements/TextField';

export default function MyPerformancePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKpiType, setSelectedKpiType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const filters = {
    search: searchQuery,
    kpiType: selectedKpiType,
    statusColor: selectedStatus,
  };

  // Request 'my' tab for personal performance with API-level filters
  const { data: dashboardData, isLoading, isFetching, isError, error } = useKpiDashboard('my', filters, {
    enabled: Boolean(user),
  });

  const rawData = dashboardData?.data || dashboardData || {};
  const summary = rawData.summary || {};
  const targets = rawData.targets || [];
  const charts = rawData.charts || {};

  const isIse = user?.primaryRole === 'ISE';

  const kpiTypeOptions = [
    { value: 'ALL', label: 'All KPI Types' },
    { value: 'LEAD', label: 'Lead Target' },
    { value: 'REVENUE', label: 'Revenue Target' },
    { value: 'SALES', label: 'Sales Target' },
    { value: 'OPPORTUNITY', label: 'Opportunity Target' },
    { value: 'CONVERSION', label: 'Conversion Target' },
    { value: 'CUSTOMER', label: 'Customer Target' },
  ];

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'GREEN', label: 'Completed' },
    { value: 'YELLOW', label: 'In Progress' },
    { value: 'RED', label: 'Below Target' },
  ];

  const barSeries = [
    { dataKey: 'Target', name: 'Target Value', fill: '#cbd5e1', radius: [6, 6, 0, 0] },
    { dataKey: 'Achieved', name: 'Achieved Value', fill: '#f97316', radius: [6, 6, 0, 0] },
  ];

  if (isError) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-none flex items-center gap-3">
        <AlertCircle size={20} className="text-rose-600" />
        <div>
          <h3 className="font-bold text-sm">Failed to load My Performance</h3>
          <p className="text-xs text-rose-600 mt-0.5">{error?.message || 'An unexpected error occurred.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Target className="text-orange-500" size={24} />
            <span>My Performance</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Track your personal target achievements, live CRM progress, and KPI metrics.
          </p>
        </div>
      </div>

      {/* Personal Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <TextField
            placeholder="Search my targets or KPI type..."
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
            startIcon={Search}
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="w-44">
            <SelectField
              value={selectedKpiType}
              onChange={(val) => setSelectedKpiType(val)}
              options={kpiTypeOptions}
              searchable={false}
            />
          </div>

          <div className="w-44">
            <SelectField
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val)}
              options={statusOptions}
              searchable={false}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area: Cards and Charts with localized loading skeleton */}
      {isLoading || isFetching ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-200/80 p-4 rounded-none shadow-2xs space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-slate-200/80 p-5 rounded-none shadow-2xs space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 p-4 rounded-none shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase">My Targets</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block">{summary.totalTargetsCount || 0}</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-none">
            <Target size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-none shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase">Completed</span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-0.5 block">{summary.completedTargetsCount || 0}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-none">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-none shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase">In Progress</span>
            <span className="text-2xl font-extrabold text-amber-600 mt-0.5 block">{summary.inProgressTargetsCount || 0}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-none">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-none shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase">Achievement %</span>
            <span className="text-2xl font-extrabold text-orange-600 mt-0.5 block">{summary.overallAchievementPct || 0}%</span>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-none">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Target Progress Cards */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">My Active KPI Targets</h2>
        {targets.length === 0 ? (
          <ChartEmptyState message="No personal KPI targets assigned yet. Your manager will assign targets shortly." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {targets.map((target) => (
              <KpiCard key={target.id} target={target} canDrill={!isIse} />
            ))}
          </div>
        )}
      </div>

      {/* Shared Charts Section */}
      {targets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          <div className="bg-white p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
              <BarChart3 className="text-orange-500" size={18} />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Target vs Live Achievement</h3>
                <p className="text-[11px] text-slate-500 font-medium">Comparison of personal target goals vs real-time CRM progress</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <CrmBarChart
                data={charts.barChartData || []}
                xKey="name"
                bars={barSeries}
                height={240}
                emptyMessage="No comparison records"
              />
            </div>
          </div>

          <div className="bg-white p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
              <PieIcon className="text-emerald-500" size={18} />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Status Distribution</h3>
                <p className="text-[11px] text-slate-500 font-medium">Breakdown of target statuses</p>
              </div>
            </div>
            <div className="w-full">
              <CrmPieChart
                data={charts.pieChartData || []}
                nameKey="name"
                valueKey="value"
                height={180}
                emptyMessage="No distribution records"
              />
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
