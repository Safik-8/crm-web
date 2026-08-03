// src/features/branch/components/BranchFilters.jsx

import React from 'react';
import SelectField from '../../../shared/components/elements/SelectField';
import SearchInput from '../../../shared/components/elements/SearchInput';

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
    <div className="bg-white  border-x border-t border-slate-200/60  px-3 sm:px-4 py-3">
      <div className="flex flex-col sm:flex-row gap-2.5 items-center">

        {/* ── Search Bar (Unified Component) ── */}
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search branches by name, code, location..."
          isLoading={isLoading}
        />

        {/* ── Status filter ── */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto relative">
          <SelectField
            id="branch-status-filter"
            value={status}
            onChange={onStatusChange}
            disabled={isLoading}
            placeholder="All Statuses"
            allowEmptyOption={true}
            options={STATUS_OPTIONS.filter(opt => opt.value !== '')}
            sx={{
              width: '100%',
              minWidth: { sm: '140px' },
              '& .MuiOutlinedInput-root': {
                height: '44px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                '& fieldset': {
                  borderColor: '#E2E8F0',
                },
                '&:hover fieldset': {
                  borderColor: '#CBD5E1',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#F86F03',
                }
              }
            }}
          />
          {status && (
             <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm z-10" />
          )}
        </div>

        {/* Active filter indicator dot */}
        {hasActiveFilters && !status && (
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" title="Filters active" />
        )}
      </div>
    </div>
  );
};

export default BranchFilters;
