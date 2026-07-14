import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X, Loader2 } from 'lucide-react';

/**
 * A SaaS-grade searchable dropdown component featuring keyboard navigation,
 * custom scrollbar container, sticky internal search field, and accessibility support.
 */
export const SearchableDropdown = ({
  options = [],         // Array of { id, name }
  value = '',          // Selected value id
  onChange,            // Callback: (id) => void
  placeholder = 'Select...',
  label = '',          // Prefix label (e.g. "Stage")
  icon: Icon,          // Lucide icon component
  loading = false,
  disabled = false,
  clearable = true,
  onClear = null,
  emptyMessage = 'No results found',
  className = '',
  block = false,        // When true: renders as block, trigger fills full width
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const itemRefs = useRef([]);

  // Normalize options to guarantee unified support for both { id, name } and { value, label } formats.
  // Also preserves optional `subtitle` (e.g. email) for richer list rendering.
  const normalizedOptions = useMemo(() => {
    return options.map(opt => ({
      id: opt.id !== undefined ? opt.id : opt.value,
      name: opt.name !== undefined ? opt.name : opt.label,
      subtitle: opt.subtitle || null,
    }));
  }, [options]);

  // Client-side search filtering — matches against both name and subtitle (e.g. email)
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const lower = searchTerm.toLowerCase();
    return normalizedOptions.filter(opt =>
      String(opt.name || '').toLowerCase().includes(lower) ||
      String(opt.subtitle || '').toLowerCase().includes(lower)
    );
  }, [normalizedOptions, searchTerm]);

  // Get active selected option details
  const selectedOption = useMemo(() => {
    return normalizedOptions.find(opt => String(opt.id) === String(value));
  }, [normalizedOptions, value]);

  // Close dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Sync scroll positioning of highlighted list items for keyboard layout alignment
  useEffect(() => {
    if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex] && listRef.current) {
      const itemEl = itemRefs.current[highlightedIndex];
      const listEl = listRef.current;
      const listHeight = listEl.clientHeight;
      const listScrollTop = listEl.scrollTop;
      const itemHeight = itemEl.clientHeight;
      const itemOffsetTop = itemEl.offsetTop;

      if (itemOffsetTop < listScrollTop) {
        listEl.scrollTop = itemOffsetTop;
      } else if (itemOffsetTop + itemHeight > listScrollTop + listHeight) {
        listEl.scrollTop = itemOffsetTop + itemHeight - listHeight;
      }
    }
  }, [highlightedIndex]);

  // Reset highlight index when filter matches or dropdown opens/closes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [isOpen, searchTerm]);

  const handleKeyDown = (e) => {
    if (disabled) return;
    
    // Open dropdown on keyboard action
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          filteredOptions.length > 0 ? (prev + 1) % filteredOptions.length : -1
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          filteredOptions.length > 0 ? (prev - 1 + filteredOptions.length) % filteredOptions.length : -1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const selected = filteredOptions[highlightedIndex];
          onChange(selected.id);
          setIsOpen(false);
          setSearchTerm('');
          triggerRef.current?.focus();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        triggerRef.current?.focus();
        break;
      case 'Tab':
        // Let natural focus tab-out occur, closing dropdown silently
        setIsOpen(false);
        setSearchTerm('');
        break;
      default:
        break;
    }
  };

  const handleSelectOption = (optId) => {
    onChange(optId);
    setIsOpen(false);
    setSearchTerm('');
    triggerRef.current?.focus();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onClear) onClear();
    setSearchTerm('');
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const hasSelection = value !== undefined && value !== null && value !== '';

  return (
    <div
      ref={wrapperRef}
      className={`relative text-left ${block ? 'block w-full' : 'inline-block'} ${className}`}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchTerm('');
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all outline-none ${
          block ? 'w-full h-8' : ''
        } ${
          disabled
            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/10'
        } ${isOpen && !disabled ? 'border-primary ring-2 ring-primary/10' : ''} ${
          hasSelection ? 'border-primary/50 bg-primary/[0.02]' : ''
        }`}
      >
        {Icon && <Icon size={13} className={`shrink-0 ${hasSelection ? 'text-primary' : 'text-slate-400'}`} />}
        
        <span className="truncate">
          {label ? (
            <span>
              <span className="text-slate-400 font-medium">{label}:</span>{' '}
              <span className={hasSelection ? 'text-primary font-bold' : 'text-slate-700'}>
                {selectedOption ? selectedOption.name : placeholder}
              </span>
            </span>
          ) : (
            <span className={hasSelection ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium'}>
              {selectedOption ? selectedOption.name : placeholder}
            </span>
          )}
        </span>

        {clearable && hasSelection && !disabled ? (
          <span
            onClick={handleClear}
            className="p-0.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
            title="Clear choice"
          >
            <X size={10} strokeWidth={2.5} />
          </span>
        ) : (
          <ChevronDown
            size={12}
            className={`text-slate-400 transition-transform duration-200 shrink-0 ml-0.5 ${
              isOpen ? 'rotate-180 text-primary' : ''
            }`}
          />
        )}
      </button>

      {isOpen && !disabled && (
        <div className={`absolute z-50 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 ${block ? 'w-full' : 'min-w-[200px] w-auto max-w-xs'}`}>
          {/* Sticky Search Field */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                className="w-full bg-white border border-slate-200 rounded-md pl-7 pr-3 py-1 text-xs text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium placeholder:text-slate-400 placeholder:font-normal"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()} // Keep popover open on input clicks
              />
            </div>
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto p-1 custom-scrollbar"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-1.5 py-4 text-xs text-slate-400 font-semibold">
                <Loader2 size={12} className="animate-spin" /> Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <li className="px-3 py-3 text-xs text-slate-400 text-center font-medium">
                {emptyMessage}
              </li>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = String(opt.id) === String(value);
                const isHighlighted = index === highlightedIndex;
                
                return (
                  <li
                    key={String(opt.id)}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`flex items-center justify-between gap-2 px-3 py-1.5 my-0.5 rounded-md cursor-pointer transition-colors select-none ${
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : isHighlighted
                        ? 'bg-slate-50 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                    }`}
                  >
                    {/* Name + optional subtitle (e.g. email) */}
                    <span className="flex flex-col min-w-0">
                      <span className="truncate text-xs font-semibold">{opt.name}</span>
                      {opt.subtitle && (
                        <span className={`truncate text-[10px] font-normal leading-tight ${
                          isSelected ? 'text-primary/70' : 'text-slate-400'
                        }`}>
                          {opt.subtitle}
                        </span>
                      )}
                    </span>
                    {isSelected && <Check size={12} strokeWidth={2.5} className="text-primary shrink-0" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
