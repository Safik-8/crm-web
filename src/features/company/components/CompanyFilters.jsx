import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import SelectField from '../../../shared/components/elements/SelectField';

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
    <div className="p-3 bg-white border border-slate-200/60 mb-4">
      <div className="flex flex-col xl:flex-row gap-3 xl:gap-4 items-center">
        
        {/* ── Search Bar (Glassmorphic) ─────────────────────────────────── */}
        <div className="relative flex-1 w-full min-w-0">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center bg-white shadow-sm h-7 w-7 rounded-lg">
            <Search size={14} className="text-primary" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by company name, code, or industry..."
            disabled={isLoading}
            className="w-full h-12 pl-14 pr-10 bg-white/50 border-0 shadow-inner rounded-xl text-sm text-slate-800 placeholder-slate-400 font-bold
                       focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors shadow-sm"
              title="Clear search"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* ── Filter Controls ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100/50 rounded-xl border border-slate-200/50 hidden md:flex">
            <SlidersHorizontal size={16} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filters</span>
          </div>
          
          <div className="flex-1 sm:flex-none w-full sm:w-auto relative">
            <SelectField
              id="company-status-filter"
              value={status}
              onChange={onStatusChange}
              disabled={isLoading}
              placeholder="All Statuses"
              allowEmptyOption={true}
              options={STATUS_OPTIONS.filter(opt => opt.value !== '')}
              selectSx={{
                py: '12px !important',
                fontSize: '13px',
                fontWeight: '700',
                color: '#1e293b'
              }}
              sx={{
                width: '100%',
                minWidth: { sm: '160px' },
                '& .MuiOutlinedInput-root': {
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                  '& fieldset': {
                    borderColor: 'transparent',
                  },
                  '&:hover fieldset': {
                    borderColor: '#e2e8f0',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#F86F03',
                    borderWidth: '2px',
                  }
                }
              }}
            />
            {status && (
               <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm z-10" />
            )}
          </div>

          <div className="flex-1 sm:flex-none w-full sm:w-auto">
            <SelectField
              id="company-sort"
              value={currentSort}
              onChange={onSortChange}
              disabled={isLoading}
              placeholder="Sort By"
              options={SORT_OPTIONS}
              selectSx={{
                py: '12px !important',
                fontSize: '13px',
                fontWeight: '700',
                color: '#1e293b'
              }}
              sx={{
                width: '100%',
                minWidth: { sm: '160px' },
                '& .MuiOutlinedInput-root': {
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                  '& fieldset': {
                    borderColor: 'transparent',
                  },
                  '&:hover fieldset': {
                    borderColor: '#e2e8f0',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#F86F03',
                    borderWidth: '2px',
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
