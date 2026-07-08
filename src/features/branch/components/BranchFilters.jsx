// src/features/branch/components/BranchFilters.jsx

import React from 'react';
import { Search, X } from 'lucide-react';
import SelectField from '../../../shared/components/elements/SelectField';

const STATUS_OPTIONS = [
  { value: '',         label: 'All Statuses' },
  { value: 'ACTIVE',   label: 'Active'       },
  { value: 'INACTIVE', label: 'Inactive'     },
];

const BranchFilters = ({
  search,
  status,
  onSearchChange,
  onStatusChange,
  isLoading,
}) => {
  const hasActiveFilters = search || status;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm px-3 sm:px-4 py-3">
      <div className="flex flex-col sm:flex-row gap-2.5">

        {/* ── Search ── */}
        <div className="relative flex-1 min-w-0">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search branches by name, code, location..."
            disabled={isLoading}
            className="w-full h-9 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-medium
                       focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Status filter ── */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <SelectField
            id="branch-status-filter"
            value={status}
            onChange={onStatusChange}
            disabled={isLoading}
            placeholder="All Statuses"
            allowEmptyOption={true}
            options={STATUS_OPTIONS.filter(opt => opt.value !== '')}
            selectSx={{
              py: '8px !important',
              fontSize: '13px',
            }}
            sx={{
              width: '100%',
              minWidth: { sm: '140px' },
              '& .MuiOutlinedInput-root': {
                height: '36px',
                borderRadius: '12px',
              }
            }}
          />
        </div>

          {/* Active filter indicator dot */}
          {hasActiveFilters && (
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" title="Filters active" />
          )}
      </div>
    </div>
  );
};

export default BranchFilters;
