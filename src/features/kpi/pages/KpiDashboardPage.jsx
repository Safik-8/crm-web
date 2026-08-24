// FrontEnd/src/features/kpi/pages/KpiDashboardPage.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, TrendingUp, Plus, Award, AlertCircle, BarChart3, PieChart as PieIcon, LineChart as LineIcon, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useKpiDashboard } from '../hooks/useKpi';
import KpiCard from '../components/KpiCard';
import { CrmBarChart, CrmLineChart, CrmPieChart, ChartEmptyState } from '../../../shared/components/charts';
import GlobalLoader from '../../../shared/components/elements/GlobalLoader';

export default function KpiDashboardPage() {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'team' | 'branch' | 'company'

  const canManage = hasPermission('KPI', 'canManage') || hasPermission('manage:kpi');
  const canView = hasPermission('KPI', 'canView') || hasPermission('view:kpi');

  // Role Scoping & Dynamic Tab Visibility
  const primaryRole = user?.primaryRole || '';
  const rank = user?.primaryRoleRank ?? 0;

  const isSuperAdmin = primaryRole === 'SUPER_ADMIN' || rank >= 100;
  const isCompanyAdmin = primaryRole === 'COMPANY_ADMIN' || rank === 80;
  const isBranchManager = primaryRole === 'BRANCH_MANAGER' || rank === 60;

  // Determine if user can access team/branch/company tabs
  const { data: dashboardData, isLoading, isError, error } = useKpiDashboard(activeTab, {
    enabled: Boolean(user),
  });

  const userRoleInfo = dashboardData?.userRoleInfo || {};
  const isTeamLeader = userRoleInfo.isTeamLeader;

  // Build visible tabs list dynamically per role specification
  const availableTabs = [
    { key: 'my', label: 'My Performance' },
    ...(isTeamLeader || isBranchManager || isCompanyAdmin || isSuperAdmin
      ? [{ key: 'team', label: 'Team Performance' }]
      : []),
    ...(isBranchManager || isCompanyAdmin || isSuperAdmin
      ? [{ key: 'branch', label: 'Branch Performance' }]
      : []),
    ...(isCompanyAdmin || isSuperAdmin
      ? [{ key: 'company', label: 'Company Performance' }]
      : []),
  ];

  const summary = dashboardData?.summary || {};
  const targets = dashboardData?.targets || [];
  const charts = dashboardData?.charts || {};

  // Check drill down permission (ISE cannot drill down)
  const isIse = primaryRole === 'ISE';
  const canDrill = !isIse;

  const barSeries = [
    { dataKey: 'Target', name: 'Target Value', fill: '#cbd5e1', radius: [6, 6, 0, 0] },
    { dataKey: 'Achieved', name: 'Achieved Value', fill: '#f97316', radius: [6, 6, 0, 0] },
  ];

  const lineSeries = [
    { dataKey: 'target', name: 'Target', stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '4 4' },
    { dataKey: 'achieved', name: 'Achieved', stroke: '#f97316', strokeWidth: 3 },
  ];

  if (isLoading) {
    return <GlobalLoader message="Loading KPI Performance Metrics..." />;
  }

  if (isError) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-none flex items-center gap-3">
        <AlertCircle size={20} className="text-rose-600" />
        <div>
          <h3 className="font-bold text-sm">Failed to load KPI Dashboard</h3>
          <p className="text-xs text-rose-600 mt-0.5">{error?.message || 'An unexpected error occurred.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Enterprise Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Target className="text-orange-500" size={24} />
            <span>KPI & Target Management</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Real-time performance tracking, target achievement analytics & role-scoped KPIs.
          </p>
        </div>

        {canManage && (
          <Link
            to="/kpi/setup"
            className="h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-md shadow-2xs transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Define KPI Target</span>
          </Link>
        )}
      </div>

      {/* Dynamic Role-Based Navigation Tabs */}
      {availableTabs.length > 1 && (
        <div className="border-b border-slate-200/80">
          <nav className="flex space-x-6 overflow-x-auto scrollbar-hide">
            {availableTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-orange-500 text-orange-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* KPI KPI Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 p-4 rounded-none shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase">Total Targets</span>
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
            <span className="text-xs font-semibold text-slate-500 block uppercase">Overall Achievement</span>
            <span className="text-2xl font-extrabold text-orange-600 mt-0.5 block">{summary.overallAchievementPct || 0}%</span>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-none">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* KPI Target Cards Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Active Target Achievements</h2>
        {targets.length === 0 ? (
          <ChartEmptyState message="No active KPI targets found for this scope. Define a new target using the button above." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {targets.map((target) => (
              <KpiCard key={target.id} target={target} canDrill={canDrill} />
            ))}
          </div>
        )}
      </div>

      {/* Shared Charts Section */}
      {targets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          {/* Target vs Achieved Comparison Bar Chart */}
          <div className="bg-white p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
              <BarChart3 className="text-orange-500" size={18} />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Target vs Achieved Comparison</h3>
                <p className="text-[11px] text-slate-500 font-medium">Target volume vs actual live achievement</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <CrmBarChart
                data={charts.barChartData || []}
                xKey="name"
                bars={barSeries}
                height="100%"
                emptyMessage="No comparison data available"
              />
            </div>
          </div>

          {/* KPI Target Status Distribution Pie Chart */}
          <div className="bg-white p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
              <PieIcon className="text-emerald-500" size={18} />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Status Distribution</h3>
                <p className="text-[11px] text-slate-500 font-medium">Completed, In Progress & Below Target breakdown</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <CrmPieChart
                data={charts.pieChartData || []}
                nameKey="name"
                dataKey="value"
                height="100%"
                donut={true}
                emptyMessage="No status distribution data available"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
