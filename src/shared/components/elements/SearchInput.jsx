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
    <div className={`relative flex-1 min-w-[220px] group ${className}`}>
      {/* Search Icon (No box border) */}
      <Search
        size={15}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors group-focus-within:text-primary"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-10 pl-10 pr-9 bg-slate-50/60 border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-800 placeholder-slate-400/80 outline-none
                   hover:bg-slate-100/60 hover:border-slate-300
                   focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150
                   disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          title="Clear search"
        >
          <X size={14} className="bg-slate-100 hover:bg-slate-200 p-0.5 h-5 w-5 transition-colors" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
