// crm-web/src/features/salesPerformance/components/PerformanceFilterBar.jsx

import React from 'react';
import { Calendar, Building, Building2, Users, Download, ChevronDown, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import SelectField from '../../../shared/components/elements/SelectField';
import Button from '../../../shared/components/elements/Button';

export default function PerformanceFilterBar({
  filters,
  onFilterChange,
  companies = [],
  branches = [],
  teams = [],
  userRoleInfo = {},
  onReset,
  isFetching = false,
  canExportReport = false,
  isExporting = false,
  isQueryEnabled = true,
  handleExport,
  isExportMenuOpen = false,
  setIsExportMenuOpen
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

  const hasActiveFilters = Boolean(filters.companyId || filters.branchId || filters.teamId || filters.startDate || filters.endDate || filters.rankingPeriod !== 'MONTHLY');

  return (
    <div className="bg-white border border-slate-200 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
          {/* 1. Time Period Selector */}
          <div className="w-full sm:w-40">
            <SelectField
              placeholder="Period"
              value={filters.rankingPeriod || 'MONTHLY'}
              onChange={(val) => onFilterChange('rankingPeriod', val)}
              options={periodOptions}
              icon={Calendar}
              searchable={true}
            />
          </div>

          {/* 2. Company Selector */}
          {isSuperAdmin && (
            <div className="w-full sm:w-44">
              <SelectField
                placeholder="Company *"
                value={filters.companyId || ''}
                onChange={(val) => onFilterChange('companyId', val)}
                options={companyOptions}
                icon={Building}
                searchable={true}
              />
            </div>
          )}

          {/* 3. Branch Selector */}
          {(isSuperAdmin || isCompanyAdmin) && (
            <div className="w-full sm:w-44">
              <SelectField
                placeholder="Branch"
                value={filters.branchId || ''}
                onChange={(val) => onFilterChange('branchId', val)}
                options={branchOptions}
                disabled={isSuperAdmin && !filters.companyId}
                icon={Building2}
                searchable={true}
              />
            </div>
          )}

          {/* 4. Team Selector */}
          <div className="w-full sm:w-44">
            <SelectField
              placeholder="Team"
              value={filters.teamId || ''}
              onChange={(val) => onFilterChange('teamId', val)}
              options={teamOptions}
              disabled={isSuperAdmin && !filters.companyId}
              icon={Users}
              searchable={true}
            />
          </div>

          {/* Reset / Clear Filters */}
          {hasActiveFilters && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Action Button: Export Report (Orange) */}
        {canExportReport && (
          <div className="relative shrink-0">
            <Button
              variant="contained"
              startIcon={<Download className="w-4 h-4" />}
              endIcon={<ChevronDown className="w-3.5 h-3.5" />}
              onClick={() => setIsExportMenuOpen && setIsExportMenuOpen((prev) => !prev)}
              disabled={!isQueryEnabled || isExporting}
              className="group shadow-sm hover:shadow-md transition-all whitespace-nowrap"
              sx={{
                backgroundColor: '#F86F03',
                '&:hover': { backgroundColor: '#E06202' },
                height: '38px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'none',
              }}
            >
              {isExporting ? 'Exporting...' : 'Export Report'}
            </Button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer text-left"
                >
                  <FileSpreadsheet className="w-4 h-4 text-orange-600" />
                  <span>Export Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer text-left"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Export CSV (.csv)</span>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer text-left"
                >
                  <Printer className="w-4 h-4 text-rose-600" />
                  <span>Export PDF (.pdf)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Date Range Picker */}
      {filters.rankingPeriod === 'CUSTOM' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
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
