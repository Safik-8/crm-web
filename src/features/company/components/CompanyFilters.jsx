import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

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
            placeholder="Search companies…"
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
        <div className="flex items-center gap-2 shrink-0">

          {/* Status filter */}
          <div className="relative">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              disabled={isLoading}
              className="h-9 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700
                         focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white
                         disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer transition-all"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <SlidersHorizontal
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={currentSort}
              onChange={(e) => onSortChange(e.target.value)}
              disabled={isLoading}
              className="h-9 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700
                         focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white
                         disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer transition-all
                         hidden sm:block"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {/* Mobile: icon-only sort button that cycles through options */}
            <select
              value={currentSort}
              onChange={(e) => onSortChange(e.target.value)}
              disabled={isLoading}
              aria-label="Sort companies"
              className="h-9 w-9 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700
                         focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40
                         disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer transition-all
                         sm:hidden opacity-0 absolute inset-0"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {/* Mobile visible icon */}
            <div className="sm:hidden h-9 w-9 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 pointer-events-none">
              <SlidersHorizontal size={15} />
            </div>
          </div>

          {/* Active filter indicator dot */}
          {hasActiveFilters && (
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" title="Filters active" />
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyFilters;
