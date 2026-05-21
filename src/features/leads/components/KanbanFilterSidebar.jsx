import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  SlidersHorizontal,
  Search,
  Phone,
  BookOpen,
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
 * KanbanFilterSidebar — Enterprise-grade left sidebar filter panel.
 *
 * Layout:
 *   Desktop (lg+): Fixed-width panel, collapsible to icon-only rail.
 *   Mobile/Tablet: Slide-over drawer with backdrop overlay.
 *
 * Filter contract (unchanged from toolbar):
 *   - All inputs update draftFilters locally — zero API calls while editing.
 *   - Apply commits draft → URL → one API request.
 *   - Reset clears everything.
 *   - Date validation is inline, never a toast.
 *   - allDates toggle bypasses date inputs.
 *
 * Inspired by: Linear, HubSpot, Jira, Salesforce left panels.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_BY_OPTIONS = [
  { id: 'createdAt', name: 'Date Created' },
  { id: 'updatedAt', name: 'Date Updated' },
  { id: 'name', name: 'Lead Name' },
  { id: 'date', name: 'Lead Date' },
  { id: 'mobile', name: 'Mobile Number' },
];

const SIDEBAR_WIDTH = 256; // px — expanded
const RAIL_WIDTH = 48;     // px — collapsed icon rail

// ─── Field validation ─────────────────────────────────────────────────────────

/**
 * Validate all draft filter fields.
 * Returns an object of { fieldKey: errorString | null }.
 * Only fields with actual values are validated — empty = no error.
 */
const validateDraftFields = (draftFilters) => {
  const errors = {};

  // Mobile: digits only, exactly 10 digits
  if (draftFilters.mobile) {
    if (!/^\d+$/.test(draftFilters.mobile)) {
      errors.mobile = 'Only digits allowed';
    } else if (draftFilters.mobile.length !== 10) {
      errors.mobile = 'Must be exactly 10 digits';
    }
  }

  // Lead name: letters, spaces, dots only
  if (draftFilters.leadName && !/^[a-zA-Z\s.]+$/.test(draftFilters.leadName)) {
    errors.leadName = 'Letters, spaces and dots only';
  }

  return errors;
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

const FilterSection = ({ title, children }) => (
  <div className="px-3 py-3.5">
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 px-1 flex items-center gap-1.5">
      {title}
    </p>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);

// ─── Text input ───────────────────────────────────────────────────────────────

const SidebarInput = ({ icon: Icon, placeholder, value, onChange, onApply, error, maxLength, inputMode }) => {
  const hasValue = value.length > 0;
  const hasError = !!error;

  return (
    <div className="space-y-1">
      <div className="relative group">
        <Icon
          size={12}
          className={`absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-150 ${
            hasError ? 'text-red-400' : hasValue ? 'text-primary' : 'text-slate-400 group-focus-within:text-primary'
          }`}
        />
        <input
          type="text"
          inputMode={inputMode}
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onApply?.(); } }}
          placeholder={placeholder}
          className={`h-8 w-full rounded-lg border pl-7 text-xs font-medium outline-none transition-all duration-150
            placeholder:text-slate-400 placeholder:font-normal
            ${hasError
              ? 'border-red-300 bg-red-50/60 text-red-700 pr-6 focus:border-red-400 focus:ring-2 focus:ring-red-500/10'
              : hasValue
              ? 'border-primary/50 text-slate-900 pr-6 bg-primary/[0.03] focus:border-primary focus:ring-2 focus:ring-primary/10'
              : 'border-slate-300 bg-white text-slate-800 pr-2.5 hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10'
            }`}
        />
        {hasValue && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            tabIndex={-1}
            aria-label="Clear"
          >
            <X size={10} strokeWidth={2.5} />
          </button>
        )}
      </div>
      {hasError && (
        <div className="flex items-center gap-1 px-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <AlertCircle size={10} className="text-red-400 shrink-0" />
          <span className="text-[10px] font-semibold text-red-500">{error}</span>
        </div>
      )}
    </div>
  );
};

// ─── Date input ───────────────────────────────────────────────────────────────

const SidebarDateInput = ({ label, value, onChange, min, max, hasError, disabled }) => {
  const hasValue = !!value;
  return (
    <div
      className={`flex items-center gap-2 h-8 rounded-lg border px-2.5 transition-all duration-150 ${
        disabled
          ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-100'
          : hasError
          ? 'border-red-300 bg-red-50/60'
          : hasValue
          ? 'border-primary/50 bg-primary/[0.03]'
          : 'border-slate-300 bg-white hover:border-slate-400'
      }`}
    >
      <span className={`text-[10px] font-bold shrink-0 w-6 ${
        disabled ? 'text-slate-300' : hasError ? 'text-red-400' : 'text-slate-500'
      }`}>
        {label}
      </span>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`flex-1 bg-transparent text-xs font-medium outline-none border-none p-0 min-w-0 ${
          disabled
            ? 'cursor-not-allowed text-slate-300'
            : hasError
            ? 'text-red-600 cursor-pointer'
            : hasValue
            ? 'text-slate-900 cursor-pointer'
            : 'text-slate-600 cursor-pointer'
        }`}
      />
      {hasValue && !disabled && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          tabIndex={-1}
        >
          <X size={9} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

// ─── All Dates toggle ─────────────────────────────────────────────────────────

const AllDatesToggle = ({ value, onChange }) => (
  <label className="flex items-center justify-between cursor-pointer select-none group px-1">
    <span className={`text-xs font-semibold transition-colors duration-150 ${value ? 'text-primary' : 'text-slate-700'}`}>
      Show all dates
    </span>
    <div className="relative shrink-0">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <div className={`w-8 h-[18px] rounded-full transition-colors duration-200 ${value ? 'bg-primary' : 'bg-slate-300 group-hover:bg-slate-400'}`} />
      <div className={`absolute top-[3px] left-[3px] w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${value ? 'translate-x-[14px]' : 'translate-x-0'}`} />
    </div>
  </label>
);

// ─── Sort order toggle ────────────────────────────────────────────────────────

const SortOrderButton = ({ value, onChange }) => {
  const isDesc = value === 'desc';
  return (
    <button
      type="button"
      onClick={() => onChange(isDesc ? 'asc' : 'desc')}
      className={`flex items-center justify-between w-full h-8 px-2.5 rounded-lg border text-xs font-semibold transition-all duration-150 outline-none focus:ring-2 focus:ring-primary/10 ${
        isDesc
          ? 'border-primary/50 bg-primary/[0.04] text-primary hover:bg-primary/[0.07]'
          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
      }`}
    >
      <span>{isDesc ? 'Descending' : 'Ascending'}</span>
      {isDesc ? <ArrowDown size={12} strokeWidth={2.5} /> : <ArrowUp size={12} strokeWidth={2.5} />}
    </button>
  );
};

// ─── Active filter count badge ────────────────────────────────────────────────

const FilterBadge = ({ count }) => {
  if (!count) return null;
  return (
    <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-primary text-white text-[9px] font-black leading-none">
      {count}
    </span>
  );
};

// ─── Collapsed rail tooltip wrapper ──────────────────────────────────────────

const RailIcon = ({ icon: Icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 outline-none focus:ring-2 focus:ring-primary/20 ${
      active
        ? 'bg-primary/10 text-primary'
        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
    }`}
  >
    <Icon size={16} strokeWidth={1.8} />
    {active && (
      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
    )}
  </button>
);

// ─── Main sidebar ─────────────────────────────────────────────────────────────

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
  // Collapse state lifted to parent so board can react to width change
  isCollapsed,
  onToggleCollapse,
  // Mobile drawer state
  isMobileOpen,
  onMobileClose,
}) => {
  const fieldErrors = useMemo(() => validateDraftFields(draftFilters), [draftFilters]);
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const canApply = isDirty && !dateRangeError && !hasFieldErrors;

  const userOptions = useMemo(
    () => assignableUsers.map((u) => ({ id: u.id, name: u.name, subtitle: u.email || null })),
    [assignableUsers]
  );

  const activeDraftCount = useMemo(() => {
    let count = 0;
    if (draftFilters.leadName) count++;
    if (draftFilters.mobile) count++;
    if (draftFilters.assignedToId) count++;
    if (draftFilters.interestedFor) count++;
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

  const handleReset = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  const handleAllDatesChange = useCallback((checked) => {
    setDraftFilters({ allDates: checked, ...(checked ? { dateFrom: '', dateTo: '' } : {}) });
  }, [setDraftFilters]);

  const handleTextApply = useCallback(() => {
    if (canApply) applyFilters();
  }, [canApply, applyFilters]);

  const selectedSortLabel = useMemo(
    () => SORT_BY_OPTIONS.find((o) => o.id === draftFilters.sortBy)?.name || 'Date Created',
    [draftFilters.sortBy]
  );

  // ── Collapsed rail (desktop only) ──────────────────────────────────────
  if (isCollapsed) {
    return (
      <aside
        style={{ width: RAIL_WIDTH }}
        className="hidden lg:flex flex-col flex-shrink-0 h-full bg-white border-r border-slate-200 shadow-[1px_0_0_0_rgba(0,0,0,0.04)] transition-all duration-300"
      >
        {/* Expand button — full-width clickable header strip */}
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Expand filter panel"
          className="group flex flex-col items-center justify-center gap-1.5 w-full py-4 border-b border-slate-200 bg-slate-50 hover:bg-primary/5 transition-colors outline-none focus:ring-2 focus:ring-inset focus:ring-primary/30"
        >
          {/* Filter icon — primary tinted when filters active */}
          <div className={`flex items-center justify-center w-8 h-8 rounded-xl transition-colors duration-150 ${
            activeDraftCount > 0
              ? 'bg-primary/10 text-primary'
              : 'bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary'
          }`}>
            <SlidersHorizontal size={15} strokeWidth={2} />
          </div>

          {/* "Filters" label — rotated 90° so it reads top-to-bottom */}
          <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-150 ${
            activeDraftCount > 0 ? 'text-primary' : 'text-slate-400 group-hover:text-primary'
          }`}
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
          >
            Filters
          </span>

          {/* Active count badge */}
          {activeDraftCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-primary text-white text-[9px] font-black leading-none">
              {activeDraftCount}
            </span>
          )}
        </button>

        {/* Rail icons — individual filter category indicators */}
        <div className="flex flex-col items-center gap-1 pt-3 px-1.5">
          <RailIcon
            icon={Search}
            label="Search filters — click to expand"
            active={!!(draftFilters.leadName || draftFilters.mobile || draftFilters.interestedFor)}
            onClick={onToggleCollapse}
          />
          <RailIcon
            icon={Users}
            label="Assigned user filter — click to expand"
            active={!!draftFilters.assignedToId}
            onClick={onToggleCollapse}
          />
          <RailIcon
            icon={Calendar}
            label="Date filters — click to expand"
            active={!draftFilters.allDates && !!(draftFilters.dateFrom || draftFilters.dateTo)}
            onClick={onToggleCollapse}
          />
          <RailIcon
            icon={ArrowUpDown}
            label="Sort options — click to expand"
            active={draftFilters.sortBy !== 'createdAt' || draftFilters.sortOrder !== 'desc'}
            onClick={onToggleCollapse}
          />
        </div>

        {/* Expand chevron at bottom */}
        <div className="mt-auto mb-3 flex justify-center">
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand filters"
            className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors outline-none"
          >
            <ChevronLeft size={13} className="rotate-180" />
          </button>
        </div>
      </aside>
    );
  }

  // ── Expanded sidebar content (shared between desktop panel + mobile drawer) ──
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 h-12 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-slate-600" strokeWidth={2} />
          <span className="text-xs font-bold text-slate-800 tracking-wide">Filters</span>
          <FilterBadge count={activeDraftCount} />
        </div>
        {/* Desktop collapse / Mobile close */}
        <button
          type="button"
          onClick={isMobileOpen ? onMobileClose : onToggleCollapse}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors outline-none focus:ring-2 focus:ring-primary/20"
          aria-label={isMobileOpen ? 'Close filters' : 'Collapse filters'}
        >
          {isMobileOpen
            ? <X size={14} />
            : <ChevronLeft size={14} />
          }
        </button>
      </div>

      {/* ── Scrollable filter body ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-200 bg-slate-50">

        {/* Search section */}
        <FilterSection title="Search">
          <SidebarInput
            icon={Search}
            placeholder="Lead name..."
            value={draftFilters.leadName}
            onChange={(v) => setDraftFilters({ leadName: v })}
            onApply={handleTextApply}
            error={fieldErrors.leadName}
          />
          <SidebarInput
            icon={Phone}
            placeholder="Mobile number..."
            value={draftFilters.mobile}
            onChange={(v) => {
              // Strip non-digits at input time — never let letters through
              const digitsOnly = v.replace(/\D/g, '');
              setDraftFilters({ mobile: digitsOnly });
            }}
            onApply={handleTextApply}
            error={fieldErrors.mobile}
            maxLength={10}
            inputMode="numeric"
          />
          <SidebarInput
            icon={BookOpen}
            placeholder="Interested in..."
            value={draftFilters.interestedFor}
            onChange={(v) => setDraftFilters({ interestedFor: v })}
            onApply={handleTextApply}
          />
        </FilterSection>

        {/* Assignment section */}
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

        {/* Date section */}
        <FilterSection title="Date Range">
          <AllDatesToggle value={draftFilters.allDates} onChange={handleAllDatesChange} />
          <SidebarDateInput
            label="From"
            value={draftFilters.dateFrom}
            onChange={(v) => setDraftFilters({ dateFrom: v })}
            max={draftFilters.dateTo || undefined}
            hasError={!!dateRangeError}
            disabled={draftFilters.allDates}
          />
          <SidebarDateInput
            label="To"
            value={draftFilters.dateTo}
            onChange={(v) => setDraftFilters({ dateTo: v })}
            min={draftFilters.dateFrom || undefined}
            hasError={!!dateRangeError}
            disabled={draftFilters.allDates}
          />
          {dateRangeError && !draftFilters.allDates && (
            <div className="flex items-center gap-1.5 px-1 text-[11px] font-semibold text-red-500 animate-in fade-in duration-150">
              <AlertCircle size={11} className="shrink-0" />
              {dateRangeError}
            </div>
          )}
        </FilterSection>

        {/* Sorting section */}
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

      {/* ── Sticky action footer ── */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-3 py-3 space-y-2">
        {/* Hint */}
        <p className="text-[10px] text-slate-500 font-medium px-0.5">
          Press <kbd className="px-1 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9px] border border-slate-200">Enter</kbd> in any field or click Apply.
        </p>

        {/* Apply */}
        <button
          type="button"
          onClick={handleApply}
          disabled={!canApply || isRefetching}
          className={`flex items-center justify-center gap-1.5 w-full h-8 rounded-lg text-xs font-bold transition-all duration-150 outline-none focus:ring-2 focus:ring-primary/20 ${
            canApply && !isRefetching
              ? 'bg-primary text-white shadow-sm shadow-primary/20 hover:bg-primary/90 active:scale-[0.98]'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
          title={!isDirty ? 'No changes to apply' : hasFieldErrors ? 'Fix validation errors first' : dateRangeError ? dateRangeError : 'Apply filters'}
        >
          {isRefetching
            ? <Loader2 size={12} className="animate-spin" />
            : <Check size={12} strokeWidth={2.5} />
          }
          {isRefetching ? 'Applying…' : 'Apply Filters'}
        </button>

        {/* Reset — only when filters are active */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            disabled={isRefetching}
            className="flex items-center justify-center gap-1.5 w-full h-8 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 hover:border-slate-400 transition-all duration-150 outline-none focus:ring-2 focus:ring-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw size={11} strokeWidth={2} />
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop expanded panel ── */}
      <aside
        style={{ width: SIDEBAR_WIDTH }}
        className="hidden lg:flex flex-col flex-shrink-0 h-full bg-white border-r border-slate-200 shadow-[1px_0_0_0_rgba(0,0,0,0.04)] transition-all duration-300 overflow-hidden"
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile/Tablet slide-over drawer ── */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside
            style={{ width: SIDEBAR_WIDTH }}
            className="lg:hidden fixed top-0 left-0 z-40 h-full bg-white shadow-2xl border-r border-slate-200 animate-in slide-in-from-left duration-250 flex flex-col overflow-hidden"
          >
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
};
