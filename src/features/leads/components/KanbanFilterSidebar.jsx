import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  SlidersHorizontal,
  Search,
  Users,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Loader2,
  X,
  AlertCircle,
  ChevronLeft,
  Check,
} from 'lucide-react';
import { SearchableDropdown } from './SearchableDropdown';

/**
 * KanbanFilterSidebar
 *
 * Desktop (lg+):
 *   Single <aside> always mounted. Width animates between SIDEBAR_WIDTH ↔ RAIL_WIDTH
 *   via CSS transition — no mount/unmount, no layout jump.
 *   Content cross-fades: expanded panel fades in, rail icons fade in.
 *
 * Mobile/Tablet:
 *   Portal drawer always mounted in document.body.
 *   Backdrop + drawer slide in/out via CSS transform + opacity.
 *   isMobileOpen drives a CSS class — element stays in DOM so exit animation plays.
 */

const SORT_BY_OPTIONS = [
  { id: 'createdAt', name: 'Date Created' },
  { id: 'updatedAt', name: 'Date Updated' },
  { id: 'name', name: 'Lead Name' },
  { id: 'date', name: 'Lead Date' },
  { id: 'mobile', name: 'Mobile Number' },
];

const PRIORITY_OPTIONS = [
  { id: 'ALL', name: 'All Priorities' },
  { id: 'HIGH', name: 'High' },
  { id: 'MEDIUM', name: 'Medium' },
  { id: 'LOW', name: 'Low' },
];

const SIDEBAR_WIDTH = 252;
const RAIL_WIDTH = 48;

// ─── Sub-components ───────────────────────────────────────────────────────────

const FilterSection = ({ title, children }) => (
  <div className="px-3 py-3.5">
    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.16em] mb-2.5 px-0.5">
      {title}
    </p>
    <div className="space-y-2">{children}</div>
  </div>
);

const SearchInput = ({ value, onChange, onApply }) => {
  const hasValue = value.length > 0;
  return (
    <div className="relative group">
      <Search
        size={13}
        className={`absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-150 ${
          hasValue ? 'text-primary' : 'text-zinc-400 group-focus-within:text-primary'
        }`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onApply?.(); } }}
        placeholder="Name, phone, or interest…"
        className={`h-8 w-full rounded-xl border pl-7 text-[12px] font-medium outline-none transition-all duration-150
          placeholder:text-zinc-400 placeholder:font-normal
          ${hasValue
            ? 'border-orange-200 text-zinc-900 pr-6 bg-orange-50/30 focus:border-primary focus:ring-2 focus:ring-primary/10'
            : 'border-zinc-200 bg-white text-zinc-800 pr-2.5 hover:border-zinc-300 focus:border-primary focus:ring-2 focus:ring-primary/10'
          }`}
      />
      {hasValue && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          tabIndex={-1}
          aria-label="Clear search"
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

const SidebarDateInput = ({ label, value, onChange, min, max, hasError, disabled }) => {
  const hasValue = !!value;
  return (
    <div className={`flex items-center gap-2 h-8 rounded-xl border px-2.5 transition-all duration-150 ${
      disabled ? 'opacity-40 cursor-not-allowed border-zinc-200 bg-zinc-100'
      : hasError ? 'border-red-300 bg-red-50/60'
      : hasValue ? 'border-orange-200 bg-orange-50/30'
      : 'border-zinc-200 bg-white hover:border-zinc-300'
    }`}>
      <span className={`text-[10px] font-bold shrink-0 w-6 ${
        disabled ? 'text-zinc-300' : hasError ? 'text-red-400' : 'text-zinc-500'
      }`}>{label}</span>
      <input
        type="date" value={value} min={min} max={max} disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`flex-1 bg-transparent text-[12px] font-medium outline-none border-none p-0 min-w-0 ${
          disabled ? 'cursor-not-allowed text-zinc-300'
          : hasError ? 'text-red-600 cursor-pointer'
          : hasValue ? 'text-zinc-900 cursor-pointer'
          : 'text-zinc-600 cursor-pointer'
        }`}
      />
      {hasValue && !disabled && (
        <button type="button" onClick={() => onChange('')}
          className="p-0.5 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors shrink-0" tabIndex={-1}>
          <X size={9} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

const AllDatesToggle = ({ value, onChange }) => (
  <label className="flex items-center justify-between cursor-pointer select-none group px-0.5">
    <span className={`text-[12px] font-semibold transition-colors duration-150 ${value ? 'text-primary' : 'text-zinc-700'}`}>
      Show all dates
    </span>
    <div className="relative shrink-0">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <div className={`w-8 h-[18px] rounded-full transition-colors duration-200 ${value ? 'bg-primary' : 'bg-zinc-300 group-hover:bg-zinc-400'}`} />
      <div className={`absolute top-[3px] left-[3px] w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${value ? 'translate-x-[14px]' : 'translate-x-0'}`} />
    </div>
  </label>
);

const SortOrderButton = ({ value, onChange }) => {
  const isDesc = value === 'desc';
  return (
    <button type="button" onClick={() => onChange(isDesc ? 'asc' : 'desc')}
      className={`flex items-center justify-between w-full h-8 px-2.5 rounded-xl border text-[12px] font-semibold transition-all duration-150 outline-none focus:ring-2 focus:ring-primary/10 ${
        isDesc ? 'border-orange-200 bg-orange-50/40 text-primary hover:bg-orange-50/70'
        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
      }`}>
      <span>{isDesc ? 'Descending' : 'Ascending'}</span>
      {isDesc ? <ArrowDown size={12} strokeWidth={2.5} /> : <ArrowUp size={12} strokeWidth={2.5} />}
    </button>
  );
};

const FilterBadge = ({ count }) => {
  if (!count) return null;
  return (
    <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-primary text-white text-[9px] font-black leading-none">
      {count}
    </span>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const KanbanFilterSidebar = ({
  draftFilters,
  setDraftFilters,
  applyFilters,
  resetFilters,
  hasActiveFilters,
  isDirty,
  dateRangeError,
  isRefetching,
  assignableUsers = [],
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileClose,
}) => {
  const canApply = isDirty && !dateRangeError;

  // Track whether the mobile portal has ever been opened so we can keep it
  // mounted in the DOM (for exit animation) after first open.
  const [portalMounted, setPortalMounted] = useState(false);
  const prevMobileOpen = useRef(false);

  useEffect(() => {
    if (isMobileOpen && !portalMounted) setPortalMounted(true);
    prevMobileOpen.current = isMobileOpen;
  }, [isMobileOpen, portalMounted]);

  const userOptions = useMemo(
    () => assignableUsers.map((u) => ({ id: u.id, name: u.name, subtitle: u.email || null })),
    [assignableUsers]
  );

  const activeDraftCount = useMemo(() => {
    let count = 0;
    if (draftFilters.search) count++;
    if (draftFilters.assignedToId) count++;
    if (draftFilters.priority && draftFilters.priority !== 'ALL') count++;
    if (!draftFilters.allDates) {
      if (draftFilters.dateFrom) count++;
      if (draftFilters.dateTo) count++;
    }
    if (draftFilters.sortBy !== 'createdAt') count++;
    if (draftFilters.sortOrder !== 'desc') count++;
    return count;
  }, [draftFilters]);

  const handleApply = useCallback(() => {
    if (!canApply) return;
    applyFilters();
  }, [canApply, applyFilters]);

  const handleReset = useCallback(() => resetFilters(), [resetFilters]);

  const handleAllDatesChange = useCallback((checked) => {
    setDraftFilters({ allDates: checked, ...(checked ? { dateFrom: '', dateTo: '' } : {}) });
  }, [setDraftFilters]);

  const handleSearchApply = useCallback(() => {
    if (canApply) applyFilters();
  }, [canApply, applyFilters]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  // ── Shared filter panel content ───────────────────────────────────────────
  const filterPanelContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 h-[52px] border-b border-zinc-100 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-zinc-500" strokeWidth={2} />
          <span className="text-[12px] font-bold text-zinc-700 tracking-wide">Filters</span>
          <FilterBadge count={activeDraftCount} />
        </div>
        <button
          type="button"
          onClick={isMobileOpen ? onMobileClose : onToggleCollapse}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors outline-none focus:ring-2 focus:ring-primary/20"
          aria-label={isMobileOpen ? 'Close filters' : 'Collapse filters'}
        >
          {isMobileOpen
            ? <X size={14} />
            : <ChevronLeft size={14} style={{ transform: 'rotate(180deg)' }} />
          }
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-zinc-100 bg-zinc-50/50">
        <FilterSection title="Search">
          <SearchInput
            value={draftFilters.search}
            onChange={(v) => setDraftFilters({ search: v })}
            onApply={handleSearchApply}
          />
          <p className="text-[10px] text-zinc-400 px-0.5 leading-relaxed">
            Searches by name, phone, or interest
          </p>
        </FilterSection>

        <FilterSection title="Assignment">
          <SearchableDropdown
            options={userOptions}
            value={draftFilters.assignedToId}
            onChange={(val) => setDraftFilters({ assignedToId: val })}
            onClear={() => setDraftFilters({ assignedToId: '' })}
            placeholder="All users"
            icon={Users}
            emptyMessage="No assignable users found"
            className="w-full"
            block
          />
        </FilterSection>

        <FilterSection title="Priority">
          <SearchableDropdown
            options={PRIORITY_OPTIONS}
            value={draftFilters.priority || 'ALL'}
            onChange={(val) => setDraftFilters({ priority: val === 'ALL' ? '' : val })}
            clearable={false}
            placeholder="All Priorities"
            icon={SlidersHorizontal}
            className="w-full"
            block
          />
        </FilterSection>

        <FilterSection title="Date Range">
          <AllDatesToggle value={draftFilters.allDates} onChange={handleAllDatesChange} />
          <SidebarDateInput
            label="From" value={draftFilters.dateFrom}
            onChange={(v) => setDraftFilters({ dateFrom: v })}
            max={draftFilters.dateTo || undefined}
            hasError={!!dateRangeError} disabled={draftFilters.allDates}
          />
          <SidebarDateInput
            label="To" value={draftFilters.dateTo}
            onChange={(v) => setDraftFilters({ dateTo: v })}
            min={draftFilters.dateFrom || undefined}
            hasError={!!dateRangeError} disabled={draftFilters.allDates}
          />
          {dateRangeError && !draftFilters.allDates && (
            <div className="flex items-center gap-1.5 px-0.5 text-[11px] font-semibold text-red-500 animate-in fade-in duration-150">
              <AlertCircle size={11} className="shrink-0" />
              {dateRangeError}
            </div>
          )}
        </FilterSection>

        <FilterSection title="Sorting">
          <SearchableDropdown
            options={SORT_BY_OPTIONS}
            value={draftFilters.sortBy}
            onChange={(val) => setDraftFilters({ sortBy: val })}
            clearable={false}
            placeholder="Sort by"
            icon={ArrowUpDown}
            className="w-full"
            block
          />
          <SortOrderButton
            value={draftFilters.sortOrder}
            onChange={(val) => setDraftFilters({ sortOrder: val })}
          />
        </FilterSection>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-zinc-100 bg-white px-3 py-3 space-y-2">
        <p className="text-[10px] text-zinc-400 font-medium px-0.5">
          Press{' '}
          <kbd className="px-1 py-0.5 rounded bg-zinc-100 text-zinc-500 font-mono text-[9px] border border-zinc-200">
            Enter
          </kbd>{' '}
          in search or click Apply.
        </p>
        <button
          type="button"
          onClick={handleApply}
          disabled={!canApply || isRefetching}
          className={`flex items-center justify-center gap-1.5 w-full h-8 rounded-xl text-[12px] font-bold transition-all duration-150 outline-none focus:ring-2 focus:ring-primary/20 ${
            canApply && !isRefetching
              ? 'bg-primary text-white shadow-sm shadow-primary/20 hover:bg-primary/90 active:scale-[0.98]'
              : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
          }`}
          title={!isDirty ? 'No changes to apply' : dateRangeError || 'Apply filters'}
        >
          {isRefetching ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={2.5} />}
          {isRefetching ? 'Applying…' : 'Apply Filters'}
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            disabled={isRefetching}
            className="flex items-center justify-center gap-1.5 w-full h-8 rounded-xl border border-zinc-200 text-[12px] font-semibold text-zinc-600 hover:text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-150 outline-none focus:ring-2 focus:ring-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw size={11} strokeWidth={2} />
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );

  // ── Mobile portal ─────────────────────────────────────────────────────────
  // Always kept in DOM once first opened so the CSS exit animation can play.
  const mobilePortal = portalMounted ? createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onMobileClose}
        aria-hidden="true"
        style={{
          transition: 'opacity 280ms cubic-bezier(0.4,0,0.2,1), visibility 280ms cubic-bezier(0.4,0,0.2,1)',
          opacity: isMobileOpen ? 1 : 0,
          visibility: isMobileOpen ? 'visible' : 'hidden',
          pointerEvents: isMobileOpen ? 'auto' : 'none',
        }}
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
      />
      {/* Drawer */}
      <aside
        style={{
          width: Math.min(SIDEBAR_WIDTH, typeof window !== 'undefined' ? window.innerWidth - 48 : SIDEBAR_WIDTH),
          transition: 'transform 300ms cubic-bezier(0.32,0.72,0,1), opacity 280ms cubic-bezier(0.4,0,0.2,1)',
          transform: isMobileOpen ? 'translateX(0)' : 'translateX(100%)',
          opacity: isMobileOpen ? 1 : 0,
        }}
        className="fixed top-0 right-0 z-[61] h-full bg-white shadow-2xl border-l border-zinc-200 flex flex-col overflow-hidden"
      >
        {filterPanelContent}
      </aside>
    </>,
    document.body
  ) : null;

  // ── Desktop sidebar — single element, width animates ─────────────────────
  return (
    <>
      <aside
        style={{
          width: isCollapsed ? RAIL_WIDTH : SIDEBAR_WIDTH,
          transition: 'width 280ms cubic-bezier(0.4,0,0.2,1)',
          minWidth: isCollapsed ? RAIL_WIDTH : SIDEBAR_WIDTH,
        }}
        className="hidden lg:flex flex-col flex-shrink-0 h-full bg-white border-l border-zinc-200/70 overflow-hidden"
      >
        {/* ── Expanded panel — fades out when collapsing ── */}
        <div
          style={{
            transition: 'opacity 200ms ease, visibility 200ms ease',
            opacity: isCollapsed ? 0 : 1,
            visibility: isCollapsed ? 'hidden' : 'visible',
            position: isCollapsed ? 'absolute' : 'relative',
            width: SIDEBAR_WIDTH,
            height: '100%',
            pointerEvents: isCollapsed ? 'none' : 'auto',
          }}
        >
          {filterPanelContent}
        </div>

        {/* ── Collapsed rail — fades in when collapsing ── */}
        <div
          style={{
            transition: 'opacity 200ms ease 80ms, visibility 200ms ease 80ms',
            opacity: isCollapsed ? 1 : 0,
            visibility: isCollapsed ? 'visible' : 'hidden',
            position: isCollapsed ? 'relative' : 'absolute',
            width: RAIL_WIDTH,
            height: '100%',
            pointerEvents: isCollapsed ? 'auto' : 'none',
          }}
          className="flex flex-col items-center"
        >
          {/* Expand button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand filter panel"
            className="group flex flex-col items-center justify-center gap-1.5 w-full py-4 border-b border-zinc-100 hover:bg-orange-50/50 transition-colors outline-none focus:ring-2 focus:ring-inset focus:ring-primary/20"
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-xl transition-colors duration-150 ${
              activeDraftCount > 0
                ? 'bg-orange-50 text-primary'
                : 'bg-zinc-100 text-zinc-500 group-hover:bg-orange-50 group-hover:text-primary'
            }`}>
              <SlidersHorizontal size={14} strokeWidth={2} />
            </div>
            <span
              className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-150 ${
                activeDraftCount > 0 ? 'text-primary' : 'text-zinc-400 group-hover:text-primary'
              }`}
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
            >
              Filters
            </span>
            {activeDraftCount > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-primary text-white text-[9px] font-black leading-none">
                {activeDraftCount}
              </span>
            )}
          </button>

          {/* Rail icons */}
          <div className="flex flex-col items-center gap-1 pt-3 px-1.5">
            {[
              { icon: Search, label: 'Search', active: !!draftFilters.search },
              { icon: Users, label: 'Assigned user', active: !!draftFilters.assignedToId },
              { icon: Calendar, label: 'Date filters', active: !draftFilters.allDates && !!(draftFilters.dateFrom || draftFilters.dateTo) },
              { icon: ArrowUpDown, label: 'Sort options', active: draftFilters.sortBy !== 'createdAt' || draftFilters.sortOrder !== 'desc' },
            ].map(({ icon: Icon, label, active }) => (
              <button
                key={label}
                type="button"
                onClick={onToggleCollapse}
                title={`${label} — click to expand`}
                className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 outline-none focus:ring-2 focus:ring-primary/20 ${
                  active ? 'bg-orange-50 text-primary' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                }`}
              >
                <Icon size={15} strokeWidth={1.8} />
                {active && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>

          {/* Expand chevron */}
          <div className="mt-auto mb-3 flex justify-center">
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Expand filters"
              className="flex items-center justify-center w-7 h-7 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-primary transition-colors outline-none"
            >
              <ChevronLeft size={13} />
            </button>
          </div>
        </div>
      </aside>

      {mobilePortal}
    </>
  );
};
