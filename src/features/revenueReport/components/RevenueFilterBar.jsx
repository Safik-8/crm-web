// crm-web/src/features/revenueReport/components/RevenueFilterBar.jsx

import React from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import SelectField from '../../../shared/components/elements/SelectField';
import TextField from '../../../shared/components/elements/TextField';
import Button from '../../../shared/components/elements/Button';

export const RevenueFilterBar = ({
  filters = {},
  setFilters,
  companies = [],
  branches = [],
  teams = [],
  courses = [],
  userRoleInfo = {},
  canExportReport = false,
  isExporting = false,
  handleOpenExportMenu,
  isExportMenuOpen = false,
  handleExport
}) => {
  const { isSuperAdmin, isCompanyAdmin, isBranchManager } = userRoleInfo;

  const handleChange = (field, val) => {
    setFilters((prev) => {
      const updated = { ...prev, [field]: val };
      if (field === 'rankingPeriod' && val !== 'CUSTOM') {
        updated.startDate = '';
        updated.endDate = '';
      }
      if (field === 'companyId') {
        updated.branchId = '';
        updated.teamId = '';
      }
      if (field === 'branchId') {
        updated.teamId = '';
      }
      return updated;
    });
  };

  const handleReset = () => {
    setFilters({
      rankingPeriod: 'ALL',
      companyId: '',
      branchId: '',
      teamId: '',
      courseId: '',
      startDate: '',
      endDate: ''
    });
  };

  const hasActiveFilters = 
    filters.rankingPeriod !== 'ALL' ||
    filters.companyId ||
    filters.branchId ||
    filters.teamId ||
    filters.courseId ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="bg-white p-3.5 border border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
          {/* Period Selector */}
          <div className="w-full sm:w-40">
            <SelectField
              placeholder="Time Period"
              value={filters.rankingPeriod || 'ALL'}
              onChange={(val) => handleChange('rankingPeriod', val === undefined ? 'ALL' : val)}
              options={[
                { value: 'ALL', label: 'All Time' },
                { value: 'MONTHLY', label: 'Monthly' },
                { value: 'QUARTERLY', label: 'Quarterly' },
                { value: 'YEARLY', label: 'Yearly' },
                { value: 'CUSTOM', label: 'Custom' }
              ]}
            />
          </div>

          {/* Company Selector (SUPER ADMIN ONLY) */}
          {isSuperAdmin && (
            <div className="w-full sm:w-44">
              <SelectField
                placeholder="All Companies"
                value={filters.companyId || ''}
                onChange={(val) => handleChange('companyId', val === undefined ? '' : val)}
                allowEmptyOption
                searchable={true}
                options={companies.map((c) => ({ value: String(c.id), label: c.name }))}
              />
            </div>
          )}

          {/* Branch Selector (SUPER ADMIN & COMPANY ADMIN) */}
          {(isSuperAdmin || isCompanyAdmin) && (
            <div className="w-full sm:w-44">
              <SelectField
                placeholder={isSuperAdmin && !filters.companyId ? 'Select company first' : 'All Branches'}
                value={filters.branchId || ''}
                onChange={(val) => handleChange('branchId', val === undefined ? '' : val)}
                allowEmptyOption
                searchable={true}
                disabled={isSuperAdmin && branches.length === 0 && !filters.companyId}
                options={branches.map((b) => ({ value: String(b.id), label: b.name }))}
              />
            </div>
          )}

          {/* Team Selector */}
          {(isSuperAdmin || isCompanyAdmin || isBranchManager) && (
            <div className="w-full sm:w-44">
              <SelectField
                placeholder="All Teams"
                value={filters.teamId || ''}
                onChange={(val) => handleChange('teamId', val === undefined ? '' : val)}
                allowEmptyOption
                searchable={true}
                options={teams.map((t) => ({ value: String(t.id), label: t.name || t.teamName }))}
              />
            </div>
          )}

          {/* Course / Product Selector */}
          <div className="w-full sm:w-44">
            <SelectField
              placeholder="All Courses"
              value={filters.courseId || ''}
              onChange={(val) => handleChange('courseId', val === undefined ? '' : val)}
              allowEmptyOption
              searchable={true}
              options={courses.map((c) => ({ value: String(c.id), label: c.name || c.courseName }))}
            />
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
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
              onClick={handleOpenExportMenu}
              disabled={isExporting}
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
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-orange-600" />
                  <span>Export Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Export CSV (.csv)</span>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-rose-600" />
                  <span>Export PDF (.pdf)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Date Pickers when Period === 'CUSTOM' */}
      {filters.rankingPeriod === 'CUSTOM' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3 pt-3 border-t border-slate-100">
          <div>
            <TextField
              label="Start Date"
              type="date"
              placeholder="Start Date"
              value={filters.startDate || ''}
              onChange={(val) => handleChange('startDate', val)}
            />
          </div>
          <div>
            <TextField
              label="End Date"
              type="date"
              placeholder="End Date"
              value={filters.endDate || ''}
              onChange={(val) => handleChange('endDate', val)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
