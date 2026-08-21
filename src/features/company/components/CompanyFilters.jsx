import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import SelectField from '../../../shared/components/elements/SelectField';
import SearchInput from '../../../shared/components/elements/SearchInput';

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Newest First' },
  { value: 'createdAt_asc', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name A → Z' },
  { value: 'name_desc', label: 'Name Z → A' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const CompanyFilters = ({
  search,
  status,
  sortBy,
  sortOrder,
  onSearchChange,
  onStatusChange,
  onSortChange,
  isLoading,
}) => {
  const currentSort = `${sortBy}_${sortOrder}`;
  const hasActiveFilters = search || status;

  const handleClearSearch = () => onSearchChange('');

  return (
    <div className="relative z-20 bg-white border border-slate-200 p-3 sm:p-4">
      <div className="flex flex-col xl:flex-row gap-3 xl:gap-4 items-center">

        {/* ── Search Bar (Unified Component) ─────────────────────────────────── */}
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search by company name, code, or industry..."
          isLoading={isLoading}
        />

        {/* ── Filter Controls ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-3 w-full xl:w-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              onStatusChange('');
            }}
            disabled={!hasActiveFilters || isLoading}
            className={`flex items-center gap-2 h-11 px-5 rounded-[10px] border text-[13px] font-semibold uppercase tracking-wider transition-all hidden md:flex ${hasActiveFilters && !isLoading
                ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 hover:text-orange-700 cursor-pointer'
                : 'bg-[#F8FAFC] text-slate-500 border-[#E2E8F0] cursor-default'
              }`}
            title={hasActiveFilters ? "Clear all active filters" : "No active filters"}
          >
            <SlidersHorizontal size={16} className={hasActiveFilters ? 'text-orange-500' : 'text-slate-400'} />
            <span>{hasActiveFilters ? 'Clear Filters' : 'Filters'}</span>
          </button>

          <div className="w-full relative">
            <SelectField
              id="company-status-filter"
              value={status}
              onChange={onStatusChange}
              disabled={isLoading}
              placeholder="All Statuses"
              allowEmptyOption={true}
              options={STATUS_OPTIONS.filter(opt => opt.value !== '')}
              sx={{
                width: '100%',
                minWidth: { sm: '160px' },
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

          <div className="w-full">
            <SelectField
              id="company-sort"
              value={currentSort}
              onChange={onSortChange}
              disabled={isLoading}
              placeholder="Sort By"
              options={SORT_OPTIONS}
              sx={{
                width: '100%',
                minWidth: { sm: '160px' },
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyFilters;
