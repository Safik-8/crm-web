import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export const SearchableSelect = ({
  options = [],     // array of { id, name }
  value,            // current selected id
  onChange,         // function(id)
  placeholder = "Select...",
  disabled = false,
  className = "",
  hasError = false,
  allowEmptyOption = false,
  searchable = true, // whether to render search input inside dropdown
  isLoading = false  // loading state
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  
  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // Filter options based on search term (only if searchable is true)
  const filteredOptions = searchable
    ? options.filter(opt => 
        opt.name?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const selectedOption = options.find(opt => opt.id?.toString() === value?.toString() || opt.id === value);

  const isBtnDisabled = disabled || isLoading;

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {/* Target button simulating standard select input */}
      <button
        type="button"
        disabled={isBtnDisabled}
        onClick={() => {
          if (!isBtnDisabled) {
            setIsOpen(!isOpen);
            setSearchTerm('');
          }
        }}
        className={`w-full flex items-center justify-between rounded-[10px] border bg-[#F8FAFC] px-3.5 py-[10px] text-[13px] font-medium text-left outline-none transition-all ${
          hasError
            ? 'border-red-500 focus:border-red-500 focus:ring-3 focus:ring-red-500/14'
            : 'border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#CBD5E1] focus:border-[#F86F03] focus:ring-3 focus:ring-[#F86F03]/14'
        } ${
          isBtnDisabled ? 'opacity-50 bg-slate-100 cursor-not-allowed text-slate-500' : 'focus:bg-white cursor-pointer text-slate-900'
        } ${isOpen && !isBtnDisabled ? 'border-[#F86F03] ring-3 ring-[#F86F03]/14 bg-white' : ''}`}
      >
        <span className={`truncate flex-1 pr-2 ${selectedOption && !isLoading ? 'text-slate-900' : 'text-slate-500 font-medium'}`}>
          {isLoading ? (
            <span className="flex items-center gap-2 text-slate-400 font-normal">
              <svg className="animate-spin h-3.5 w-3.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </span>
          ) : selectedOption ? (
            selectedOption.name
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Dropdown using identical aesthetic to login form */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Search bar inside dropdown */}
          {searchable && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  className="w-full bg-white border border-[#E2E8F0] rounded-[10px] pl-9 pr-3 py-2 text-[13px] text-slate-900 outline-none focus:border-[#F86F03] focus:ring-3 focus:ring-[#F86F03]/14 transition-all font-medium placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Options list */}
          <ul className="max-h-60 overflow-y-auto p-1">
            {allowEmptyOption && (
              <li
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className={`flex items-center justify-between px-4 py-2.5 my-0.5 text-[13px] font-medium italic rounded-lg cursor-pointer text-slate-500 hover:bg-slate-100`}
              >
                <span>{placeholder}</span>
              </li>
            )}
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-[13px] text-slate-500 text-center font-medium">
                No results found.
              </li>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === value?.toString() || opt.id === value;
                const isDisabled = !!opt.disabled;
                return (
                  <li
                    key={opt.id}
                    onClick={() => {
                      if (isDisabled) return;
                      onChange(opt.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`flex items-center justify-between px-4 py-2.5 my-0.5 text-[13px] font-medium rounded-lg transition-colors ${
                      isDisabled
                        ? 'opacity-40 bg-slate-50/50 text-slate-400 cursor-not-allowed'
                        : isSelected 
                          ? 'bg-primary/10 text-primary cursor-pointer' 
                          : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                    }`}
                  >
                    <span>{opt.name}</span>
                    {isSelected && <Check size={16} className="text-primary" />}
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
