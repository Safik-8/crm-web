// crm-web/src/features/revenueReport/components/RevenueFilterBar.jsx

import React from 'react';
import { Filter } from 'lucide-react';
import SelectField from '../../../shared/components/elements/SelectField';
import TextField from '../../../shared/components/elements/TextField';

export const RevenueFilterBar = ({
  filters = {},
  setFilters,
  companies = [],
  branches = [],
  teams = [],
  courses = [],
  userRoleInfo = {}
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
    <div className="bg-white p-4 border border-slate-200/80  mb-6">
      <div className="flex items-center space-x-2 mb-4 text-slate-800 text-[11px] font-bold uppercase tracking-wider">
        <Filter className="w-3.5 h-3.5 text-orange-600" />
        <span>Financial Report Filters</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 gap-4 items-end">
        {/* Period Selector */}
        <div>
          <SelectField
            label="Time Period"
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
          <div>
            <SelectField
              label="Company"
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
          <div>
            <SelectField
              label="Branch"
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
          <div>
            <SelectField
              label="Team"
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
        <div>
          <SelectField
            label="Course / Product"
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
          <div>
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center space-x-1.5 h-[42px] px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[13px] rounded-[10px] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Custom Date Pickers when Period === 'CUSTOM' */}
      {filters.rankingPeriod === 'CUSTOM' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
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
