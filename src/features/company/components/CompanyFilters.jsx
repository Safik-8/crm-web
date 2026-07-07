import React from 'react';
import { Search, X } from 'lucide-react';
import SelectField from '../../../shared/components/elements/SelectField';

/**
 * CompanyFilters
 * Search input + Status filter + Sort selector.
 * Fully controlled — all state lives in the parent (useCompanies hook).
 */
const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Newest First' },
  { value: 'createdAt_asc',  label: 'Oldest First' },
  { value: 'name_asc',       label: 'Name A → Z'   },
  { value: 'name_desc',      label: 'Name Z → A'   },
];

const STATUS_OPTIONS = [
  { value: '',         label: 'All Statuses' },
  { value: 'ACTIVE',   label: 'Active'       },
  { value: 'INACTIVE', label: 'Inactive'     },
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
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm px-3 sm:px-4 py-3">
      <div className="flex flex-col sm:flex-row gap-2.5">

        {/* ── Search ─────────────────────────────────────────────────────── */}
        <div className="relative flex-1 min-w-0">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, code, industry…"
            disabled={isLoading}
            className="w-full h-9 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-medium
                       focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Right controls ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto shrink-0">

          {/* Status filter */}
          <div className="w-full sm:w-auto">
            <SelectField
              id="company-status-filter"
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

          {/* Sort */}
          <div className="w-full sm:w-auto">
            <SelectField
              id="company-sort"
              value={currentSort}
              onChange={onSortChange}
              disabled={isLoading}
              placeholder="Sort By"
              options={SORT_OPTIONS}
              selectSx={{
                py: '8px !important',
                fontSize: '13px',
              }}
              sx={{
                width: '100%',
                minWidth: { sm: '150px' },
                '& .MuiOutlinedInput-root': {
                  height: '36px',
                  borderRadius: '12px',
                }
              }}
            />
          </div>

          {/* Active filter indicator dot */}
          {hasActiveFilters && (
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0 hidden sm:block" title="Filters active" />
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyFilters;
