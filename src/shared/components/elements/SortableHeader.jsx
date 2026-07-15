import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

/**
 * Clickable sortable table column header wrapper.
 * Dynamically switches arrow indicators for Ascending/Descending/Neutral states.
 */
export const SortableHeader = ({
  label,
  field,
  activeSort,
  activeOrder,
  onToggle,
  align = 'left'
}) => {
  const isSorted = activeSort === field;

  // Derive flex alignments
  const alignmentClass =
    align === 'center'
      ? 'justify-center'
      : align === 'right'
      ? 'justify-end'
      : 'justify-start';

  return (
    <button
      type="button"
      onClick={() => onToggle(field)}
      className={`group inline-flex items-center gap-1.5 hover:text-slate-800 transition-colors focus:outline-none select-none cursor-pointer ${alignmentClass} w-full`}
    >
      <span className="font-bold text-[12px] uppercase tracking-wider text-slate-500 group-hover:text-slate-800 transition-colors">
        {label}
      </span>
      <span className="text-slate-400 group-hover:text-slate-600 transition-colors shrink-0">
        {isSorted ? (
          activeOrder === 'asc' ? (
            <ArrowUp size={13} className="text-primary" />
          ) : (
            <ArrowDown size={13} className="text-primary" />
          )
        ) : (
          <ArrowUpDown size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </span>
    </button>
  );
};

export default SortableHeader;
