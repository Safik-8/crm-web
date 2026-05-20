import { useState, useEffect, useMemo } from 'react';
import { Search, User, Phone, BookOpen, Calendar, ArrowUpDown, RefreshCw, Layers, Users } from 'lucide-react';
import { SearchableDropdown } from './SearchableDropdown';
import { getBranchUsers } from '../services/leadService';

/**
 * Filter and sort toolbar for the Leads Kanban board.
 * Renders sticky, responsive inputs and dropdowns, manages input debouncing,
 * and normalizes date ranges and sort behaviors.
 */
export const KanbanFiltersToolbar = ({
  filters,
  setFilters,
  resetFilters,
  hasActiveFilters,
  stages = [], // Current pipeline stages passed down to filter stage options
}) => {
  // Local input state for text search fields to prevent immediate refetching on keystroke
  const [localName, setLocalName] = useState(filters.leadName || '');
  const [localMobile, setLocalMobile] = useState(filters.mobile || '');
  const [localInterested, setLocalInterested] = useState(filters.interestedFor || '');

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load branch users once on mount for Assigned User filter dropdown
  useEffect(() => {
    let mounted = true;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await getBranchUsers();
        if (mounted && res?.success) {
          setUsers(res.data?.users || []);
        }
      } catch (err) {
        console.error('Failed to load branch users for filters:', err);
      } finally {
        if (mounted) setLoadingUsers(false);
      }
    };
    fetchUsers();
    return () => {
      mounted = false;
    };
  }, []);

  // Sync local states with filters when filters change externally (e.g. manual URL changes, reset)
  useEffect(() => {
    setLocalName(filters.leadName || '');
  }, [filters.leadName]);

  useEffect(() => {
    setLocalMobile(filters.mobile || '');
  }, [filters.mobile]);

  useEffect(() => {
    setLocalInterested(filters.interestedFor || '');
  }, [filters.interestedFor]);

  // Debounced input setters for Name, Mobile, and Interested For
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localName.trim() !== (filters.leadName || '')) {
        setFilters({ leadName: localName });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [localName, filters.leadName, setFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localMobile.trim() !== (filters.mobile || '')) {
        setFilters({ mobile: localMobile });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [localMobile, filters.mobile, setFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localInterested.trim() !== (filters.interestedFor || '')) {
        setFilters({ interestedFor: localInterested });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [localInterested, filters.interestedFor, setFilters]);

  // Map options list
  const stageOptions = useMemo(() => {
    return stages.map(s => ({ id: s.id, name: s.name }));
  }, [stages]);

  const userOptions = useMemo(() => {
    return users.map(u => ({ id: u.id, name: `${u.name} ${u.role ? `(${u.role})` : ''}` }));
  }, [users]);

  const sortByOptions = [
    { id: 'createdAt', name: 'Date Created' },
    { id: 'updatedAt', name: 'Date Updated' },
    { id: 'name', name: 'Lead Name' },
    { id: 'date', name: 'Lead Date' },
    { id: 'mobile', name: 'Mobile Number' },
  ];

  // Prevent date bounds invalidation at the handler level
  const handleDateFromChange = (e) => {
    const val = e.target.value;
    if (filters.dateTo && val > filters.dateTo) {
      setFilters({ dateFrom: val, dateTo: '' });
    } else {
      setFilters({ dateFrom: val });
    }
  };

  const handleDateToChange = (e) => {
    const val = e.target.value;
    if (filters.dateFrom && val < filters.dateFrom) {
      setFilters({ dateTo: val, dateFrom: '' });
    } else {
      setFilters({ dateTo: val });
    }
  };

  const handleReset = () => {
    setLocalName('');
    setLocalMobile('');
    setLocalInterested('');
    resetFilters();
  };

  return (
    <div className="sticky top-0 z-20 flex-shrink-0 flex flex-col gap-2 px-4 sm:px-6 md:px-8 py-2 bg-slate-50 border-b border-slate-200">
      {/* Search text inputs row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Name input */}
        <div className="relative flex-1 min-w-[140px] max-w-[220px]">
          <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-slate-700 font-semibold outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-400 placeholder:font-normal"
            placeholder="Search by name..."
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
          />
        </div>

        {/* Mobile input */}
        <div className="relative flex-1 min-w-[140px] max-w-[220px]">
          <Phone size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-slate-700 font-semibold outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-400 placeholder:font-normal"
            placeholder="Search mobile..."
            value={localMobile}
            onChange={(e) => setLocalMobile(e.target.value)}
          />
        </div>

        {/* Interested For input */}
        <div className="relative flex-1 min-w-[140px] max-w-[220px]">
          <BookOpen size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-slate-700 font-semibold outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-400 placeholder:font-normal"
            placeholder="Search interest..."
            value={localInterested}
            onChange={(e) => setLocalInterested(e.target.value)}
          />
        </div>
      </div>

      {/* Selects, dates, sorting, and reset button row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Stage select */}
        <SearchableDropdown
          options={stageOptions}
          value={filters.stageId}
          onChange={(val) => setFilters({ stageId: val })}
          onClear={() => setFilters({ stageId: '' })}
          placeholder="All Stages"
          label="Stage"
          icon={Layers}
        />

        {/* User select */}
        <SearchableDropdown
          options={userOptions}
          value={filters.assignedToId}
          onChange={(val) => setFilters({ assignedToId: val })}
          onClear={() => setFilters({ assignedToId: '' })}
          loading={loadingUsers}
          placeholder="All Users"
          label="Assigned"
          icon={Users}
        />

        {/* Date From */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 select-none">
          <Calendar size={12} className="text-slate-400 shrink-0" />
          <span className="text-[10px] text-slate-400 font-medium shrink-0">From:</span>
          <input
            type="date"
            max={filters.dateTo || undefined}
            className="bg-transparent text-slate-700 text-xs font-semibold outline-none cursor-pointer border-none p-0 w-[95px] h-4"
            value={filters.dateFrom}
            onChange={handleDateFromChange}
          />
        </div>

        {/* Date To */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 select-none">
          <Calendar size={12} className="text-slate-400 shrink-0" />
          <span className="text-[10px] text-slate-400 font-medium shrink-0">To:</span>
          <input
            type="date"
            min={filters.dateFrom || undefined}
            className="bg-transparent text-slate-700 text-xs font-semibold outline-none cursor-pointer border-none p-0 w-[95px] h-4"
            value={filters.dateTo}
            onChange={handleDateToChange}
          />
        </div>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-slate-200 mx-0.5 hidden sm:block" />

        {/* Sort By select */}
        <SearchableDropdown
          options={sortByOptions}
          value={filters.sortBy}
          onChange={(val) => setFilters({ sortBy: val })}
          clearable={false}
          placeholder="Sort By"
          label="Sort"
          icon={ArrowUpDown}
        />

        {/* Sort Order Toggle */}
        <button
          type="button"
          onClick={() => setFilters({ sortOrder: filters.sortOrder === 'desc' ? 'asc' : 'desc' })}
          className="flex items-center justify-center p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500 hover:text-primary bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 h-7 w-7"
          title={filters.sortOrder === 'desc' ? 'Sort Order: Descending' : 'Sort Order: Ascending'}
        >
          <ArrowUpDown
            size={12}
            className={`transition-transform duration-200 ${filters.sortOrder === 'desc' ? 'rotate-180 text-primary' : ''}`}
          />
        </button>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-800 text-xs font-bold transition-all ml-auto focus:outline-none cursor-pointer h-7"
          >
            <RefreshCw size={11} /> Reset
          </button>
        )}
      </div>
    </div>
  );
};
