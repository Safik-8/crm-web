// crm-web/src/features/revenueReport/components/RevenueFilterBar.jsx

import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

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

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6">
      <div className="flex items-center space-x-2 mb-3 text-slate-800 text-xs font-bold uppercase tracking-wider">
        <Filter className="w-4 h-4 text-emerald-600" />
        <span>Financial Report Filters</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Period Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Time Period</label>
          <select
            value={filters.rankingPeriod || 'ALL'}
            onChange={(e) => handleChange('rankingPeriod', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-800"
          >
            <option value="ALL">All Time</option>
            <option value="MONTHLY">Monthly (Current Month)</option>
            <option value="QUARTERLY">Quarterly (Current Quarter)</option>
            <option value="YEARLY">Yearly (Current Year)</option>
            <option value="CUSTOM">Custom Date Range</option>
          </select>
        </div>

        {/* Company Selector (SUPER ADMIN ONLY) */}
        {isSuperAdmin && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Company</label>
            <select
              value={filters.companyId || ''}
              onChange={(e) => handleChange('companyId', e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-800"
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Branch Selector (SUPER ADMIN & COMPANY ADMIN) */}
        {(isSuperAdmin || isCompanyAdmin) && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Branch</label>
            <select
              value={filters.branchId || ''}
              onChange={(e) => handleChange('branchId', e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-800"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Team Selector */}
        {(isSuperAdmin || isCompanyAdmin || isBranchManager) && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Team</label>
            <select
              value={filters.teamId || ''}
              onChange={(e) => handleChange('teamId', e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-800"
            >
              <option value="">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || t.teamName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Course / Product Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Course / Product</label>
          <select
            value={filters.courseId || ''}
            onChange={(e) => handleChange('courseId', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-800"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.courseName}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Custom Date Pickers when Period === 'CUSTOM' */}
      {filters.rankingPeriod === 'CUSTOM' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
};
