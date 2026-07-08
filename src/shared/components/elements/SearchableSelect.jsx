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
  allowEmptyOption = false
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

  // Filter options based on search term
  const filteredOptions = options.filter(opt => 
    opt.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.id === value?.toString() || opt.id === value);

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {/* Target button simulating standard select input */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchTerm('');
          }
        }}
        className={`w-full flex items-center justify-between rounded-[10px] border bg-[#F8FAFC] px-3.5 py-[10px] text-[13px] font-medium text-left outline-none transition-all ${
          hasError
            ? 'border-red-500 focus:border-red-500 focus:ring-3 focus:ring-red-500/14'
            : 'border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#CBD5E1] focus:border-[#F86F03] focus:ring-3 focus:ring-[#F86F03]/14'
        } ${
          disabled ? 'opacity-50 bg-slate-100 cursor-not-allowed text-slate-500' : 'focus:bg-white cursor-pointer text-slate-900'
        } ${isOpen && !disabled ? 'border-[#F86F03] ring-3 ring-[#F86F03]/14 bg-white' : ''}`}
      >
        <span className={selectedOption ? 'text-slate-900' : 'text-slate-500 font-medium'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Dropdown using identical aesthetic to login form */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Search bar inside dropdown */}
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
                return (
                  <li
                    key={opt.id}
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`flex items-center justify-between px-4 py-2.5 my-0.5 text-[13px] font-medium rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-slate-700 hover:bg-slate-100'
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
