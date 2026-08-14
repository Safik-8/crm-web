// crm-web/src/features/salesPerformance/components/PerformanceFilterBar.jsx

import React from 'react';
import { Filter, Calendar, Building, Building2, Users, RefreshCw, ShieldCheck } from 'lucide-react';
import SelectField from '../../../shared/components/elements/SelectField';

export default function PerformanceFilterBar({
  filters,
  onFilterChange,
  companies = [],
  branches = [],
  teams = [],
  userRoleInfo = {},
  onReset,
  isFetching = false
}) {
  const { isSuperAdmin, isCompanyAdmin, isBranchManager } = userRoleInfo;

  const periodOptions = [
    { value: 'MONTHLY', label: 'This Month' },
    { value: 'QUARTERLY', label: 'This Quarter' },
    { value: 'YEARLY', label: 'This Year' },
    { value: 'CUSTOM', label: 'Custom Range' }
  ];

  const companyOptions = [
    { value: '', label: 'Select Company' },
    ...companies.map((c) => ({ value: String(c.id), label: c.name }))
  ];

  const branchOptions = [
    { value: '', label: isSuperAdmin && !filters.companyId ? 'Select Company First' : 'All Branches' },
    ...branches.map((b) => ({ value: String(b.id), label: b.name }))
  ];

  const teamOptions = [
    { value: '', label: isSuperAdmin && !filters.companyId ? 'Select Company First' : 'All Teams' },
    ...teams.map((t) => ({ value: String(t.id), label: t.name }))
  ];

  let gridColsClass = 'grid-cols-1 sm:grid-cols-3';
  if (isSuperAdmin) {
    gridColsClass = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
  } else if (isCompanyAdmin) {
    gridColsClass = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4';
  }

  const getScopeBadge = () => {
    if (isSuperAdmin) return { label: 'Super Admin Scope', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    if (isCompanyAdmin) return { label: 'Company Scope', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (isBranchManager) return { label: 'Branch Scope', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Team Scope', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const badge = getScopeBadge();

  return (
    <div className="bg-white rounded-none border border-slate-200/80 shadow-2xs p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Filter Dimensions</h3>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.color}`}>
            <ShieldCheck size={12} />
            <span>{badge.label}</span>
          </span>

          {onReset && (
            <button
              onClick={onReset}
              className="text-xs text-slate-400 hover:text-slate-700 font-medium transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className={`grid ${gridColsClass} gap-3`}>
        {/* 1. Time Period Selector */}
        <div>
          <SelectField
            label="Period"
            value={filters.rankingPeriod || 'MONTHLY'}
            onChange={(val) => onFilterChange('rankingPeriod', val)}
            options={periodOptions}
            icon={Calendar}
          />
        </div>

        {/* 2. Company Selector */}
        {isSuperAdmin && (
          <div>
            <SelectField
              label="Company *"
              value={filters.companyId || ''}
              onChange={(val) => onFilterChange('companyId', val)}
              options={companyOptions}
              icon={Building}
            />
          </div>
        )}

        {/* 3. Branch Selector */}
        {(isSuperAdmin || isCompanyAdmin) && (
          <div>
            <SelectField
              label="Branch"
              value={filters.branchId || ''}
              onChange={(val) => onFilterChange('branchId', val)}
              options={branchOptions}
              disabled={isSuperAdmin && !filters.companyId}
              icon={Building2}
            />
          </div>
        )}

        {/* 4. Team Selector */}
        <div>
          <SelectField
            label="Team"
            value={filters.teamId || ''}
            onChange={(val) => onFilterChange('teamId', val)}
            options={teamOptions}
            disabled={isSuperAdmin && !filters.companyId}
            icon={Users}
          />
        </div>

        {/* 5. Apply Filters Button */}
        <div className="flex items-end">
          <button
            onClick={() => onFilterChange('refresh', Date.now())}
            disabled={isFetching || (isSuperAdmin && !filters.companyId)}
            className="w-full h-[40px] px-3.5 rounded-md bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            <span>{isFetching ? 'Refreshing...' : 'Apply Filters'}</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {filters.rankingPeriod === 'CUSTOM' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-orange-500 bg-slate-50/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-orange-500 bg-slate-50/50"
            />
          </div>
        </div>
      )}
    </div>
  );
}
