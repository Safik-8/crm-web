import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, TrendingUp, Plus, AlertCircle, BarChart3, PieChart as PieIcon, CheckCircle2, Clock, Search, Filter } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useKpiDashboard } from '../hooks/useKpi';
import KpiCard from '../components/KpiCard';
import { CrmBarChart, CrmLineChart, CrmPieChart, ChartEmptyState } from '../../../shared/components/charts';
import Skeleton from '../../../shared/components/elements/Skeleton';
import Button from '../../../shared/components/elements/Button';
import SelectField from '../../../shared/components/elements/SelectField';
import TextField from '../../../shared/components/elements/TextField';

export default function KpiAnalyticsPage() {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'team' | 'branch' | 'company'

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKpiType, setSelectedKpiType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedTeamId, setSelectedTeamId] = useState('ALL');
  const [selectedBranchId, setSelectedBranchId] = useState('ALL');
  const [selectedCompanyId, setSelectedCompanyId] = useState('ALL');

  const primaryRole = user?.primaryRole || '';
  const rank = user?.primaryRoleRank ?? 0;

  const isSuperAdmin = primaryRole === 'SUPER_ADMIN' || rank >= 100;
  const isCompanyAdmin = primaryRole === 'COMPANY_ADMIN' || rank === 80;
  const isBranchManager = primaryRole === 'BRANCH_MANAGER' || rank === 60;

  const canCreate =
    hasPermission('KPI', 'canCreate') ||
    hasPermission('create:kpi') ||
    isSuperAdmin ||
    isCompanyAdmin ||
    isBranchManager;
  const canViewAll = hasPermission('KPI', 'canViewAll') || hasPermission('view:kpi_analytics');

  const filters = {
    search: searchQuery,
    kpiType: selectedKpiType,
    statusColor: selectedStatus,
    teamId: selectedTeamId,
    branchId: selectedBranchId,
    companyId: selectedCompanyId,
  };

  const { data: dashboardData, isLoading, isFetching, isError, error } = useKpiDashboard(activeTab, filters, {
    enabled: Boolean(user),
  });

  const rawData = dashboardData?.data || dashboardData || {};
  const userRoleInfo = rawData.userRoleInfo || {};
  const filterOptions = rawData.filterOptions || {};
  const isTeamLeader = userRoleInfo.isTeamLeader;

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

  const teamSelectOptions = [
    { value: 'ALL', label: 'All Teams' },
    ...(filterOptions.teamOptions || []).map((t) => ({ value: String(t.id), label: t.name })),
  ];

  const branchSelectOptions = [
    { value: 'ALL', label: 'All Branches' },
    ...(filterOptions.branchOptions || []).map((b) => ({ value: String(b.id), label: b.name })),
  ];

  const companySelectOptions = [
    { value: 'ALL', label: 'All Companies' },
    ...(filterOptions.companyOptions || []).map((c) => ({ value: String(c.id), label: c.name })),
  ];

  // Build tabs dynamically based on user role & team leader status
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

  const summary = rawData.summary || {};
  const targets = rawData.targets || [];
  const charts = rawData.charts || {};

  const isIse = primaryRole === 'ISE';
  const canDrill = !isIse;

  const barSeries = [
    { dataKey: 'Target', name: 'Target Value', fill: '#cbd5e1', radius: [6, 6, 0, 0] },
    { dataKey: 'Achieved', name: 'Achieved Value', fill: '#f97316', radius: [6, 6, 0, 0] },
  ];

  if (isError) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-none flex items-center gap-3">
        <AlertCircle size={20} className="text-rose-600" />
        <div>
          <h3 className="font-bold text-sm">Failed to load KPI Analytics</h3>
          <p className="text-xs text-rose-600 mt-0.5">{error?.message || 'An unexpected error occurred.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Enterprise Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Target className="text-orange-500" size={24} />
            <span>KPI Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Aggregated performance tracking, target achievement & team leaderboards.
          </p>
        </div>

        {canCreate && (
          <Link to="/kpi-management">
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<Plus size={16} />}
            >
              Assign KPI Target
            </Button>
          </Link>
        )}
      </div>

      {/* Dynamic Tabs per role */}
      {availableTabs.length > 1 && (
        <div className="border-b border-slate-200/80">
          <nav className="flex space-x-6 overflow-x-auto scrollbar-hide">
            {availableTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSelectedTeamId('ALL');
                  setSelectedBranchId('ALL');
                  setSelectedCompanyId('ALL');
                }}
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

      {/* Role-Aware Filter Bar using Built-In Shared Components */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <TextField
            placeholder="Search assignee, team or KPI type..."
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
            startIcon={Search}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* KPI Type Filter */}
          <div className="w-44">
            <SelectField
              value={selectedKpiType}
              onChange={(val) => setSelectedKpiType(val)}
              options={kpiTypeOptions}
              searchable={false}
            />
          </div>

          {/* Status Filter */}
          <div className="w-44">
            <SelectField
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val)}
              options={statusOptions}
              searchable={false}
            />
          </div>

          {/* Team Dropdown: Visible on Team Tab when authorized */}
          {activeTab === 'team' && (isTeamLeader || isBranchManager || isCompanyAdmin || isSuperAdmin) && filterOptions.teamOptions?.length > 0 && (
            <div className="w-44">
              <SelectField
                value={selectedTeamId}
                onChange={(val) => setSelectedTeamId(val)}
                options={teamSelectOptions}
                searchable={teamSelectOptions.length >= 10}
              />
            </div>
          )}

          {/* Branch Dropdown: Visible for Company Admin & Super Admin on Branch/Team Tab */}
          {(activeTab === 'branch' || activeTab === 'team') && (isCompanyAdmin || isSuperAdmin) && filterOptions.branchOptions?.length > 0 && (
            <div className="w-44">
              <SelectField
                value={selectedBranchId}
                onChange={(val) => setSelectedBranchId(val)}
                options={branchSelectOptions}
                searchable={branchSelectOptions.length >= 10}
              />
            </div>
          )}

          {/* Company Dropdown: Visible for Super Admin on Company Tab */}
          {activeTab === 'company' && isSuperAdmin && filterOptions.companyOptions?.length > 0 && (
            <div className="w-44">
              <SelectField
                value={selectedCompanyId}
                onChange={(val) => setSelectedCompanyId(val)}
                options={companySelectOptions}
                searchable={companySelectOptions.length >= 10}
              />
            </div>
          )}
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

      {/* Target Cards Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Active Target Achievements</h2>
        {targets.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 p-8 rounded-none text-center space-y-2">
            <Target size={36} className="mx-auto text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">No KPI Targets Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No active targets have been assigned for this performance scope yet.
            </p>
          </div>
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
          <div className="bg-white p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
              <BarChart3 className="text-orange-500" size={18} />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Target vs Achieved Comparison</h3>
                <p className="text-[11px] text-slate-500 font-medium">Comparative live progress</p>
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
                <p className="text-[11px] text-slate-500 font-medium">Completed vs In Progress breakdown</p>
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
