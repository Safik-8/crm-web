import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * Reusable debounced SearchInput component.
 * Features premium icon badge, uniform height, and active hover/focus indicators.
 */
export const SearchInput = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`relative flex-1 min-w-[240px] group ${className}`}>
      {/* Premium Search Icon Badge */}
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center bg-white shadow-sm h-7 w-7 rounded-lg border border-slate-100 transition-colors group-focus-within:border-[#F86F03]/30">
        <Search size={13} className="transition-colors group-focus-within:text-[#F86F03]" />
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-11 pl-12 pr-10 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[13px] font-semibold text-slate-800 placeholder-slate-400/80 outline-none
                   hover:bg-[#F1F5F9] hover:border-[#CBD5E1]
                   focus:bg-white focus:border-[#F86F03] focus:ring-3 focus:ring-[#F86F03]/14 transition-all duration-150
                   disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          title="Clear search"
        >
          <X size={14} className="bg-slate-100 hover:bg-slate-200 rounded-md p-0.5 h-5 w-5 transition-colors shadow-sm" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
