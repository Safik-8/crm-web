import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo, useState } from 'react';

/**
 * useKanbanFilters — Enterprise-grade staged filter state management.
 *
 * Architecture:
 *   draftFilters   → Local editable state. Updated instantly on every input change.
 *                    NO API calls happen while editing draft.
 *   appliedFilters → URL-synced state. Only updated when user clicks "Apply Filters"
 *                    or "Reset Filters". Drives the actual API request.
 *
 * Flow:
 *   1. User edits → draftFilters updates (local only, no URL change, no API call)
 *   2. User clicks Apply → draftFilters committed to URL → API refetch fires once
 *   3. User clicks Reset → URL cleared → API refetch fires once with defaults
 *   4. Browser back/forward → URL restores appliedFilters correctly
 *
 * Search param:
 *   A single `search` field replaces the old leadName / mobile / interestedFor trio.
 *   The backend performs OR-matching across name, mobile, and interestedFor.
 */

const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER = 'desc';

const EMPTY_FILTERS = {
  search: '',
  assignedToId: '',
  dateFrom: '',
  dateTo: '',
  // Default to true: backend filters to today when no date params are sent,
  // which would make the board appear empty for most users on first load.
  // allDates=1 tells the backend to return all leads regardless of date.
  allDates: true,
  sortBy: DEFAULT_SORT_BY,
  sortOrder: DEFAULT_SORT_ORDER,
};

/** Parse applied filters from URL search params */
const parseAppliedFilters = (searchParams) => ({
  search: searchParams.get('search')?.trim() || '',
  assignedToId: searchParams.get('assignedToId') || '',
  dateFrom: searchParams.get('dateFrom') || '',
  dateTo: searchParams.get('dateTo') || '',
  // Default true: when the URL has no allDates param AND no date range params,
  // treat it as "show all dates" to avoid the backend's today-only default.
  // Becomes false only when the user explicitly sets a date range (dateFrom/dateTo).
  allDates: searchParams.has('allDates')
    ? searchParams.get('allDates') === '1'
    : !searchParams.get('dateFrom') && !searchParams.get('dateTo'),
  sortBy: searchParams.get('sortBy') || DEFAULT_SORT_BY,
  sortOrder: searchParams.get('sortOrder') || DEFAULT_SORT_ORDER,
});

/** Build normalized API params from applied filters */
const buildApiParams = (filters) => {
  const params = {};

  // Unified search — backend searches name, mobile, interestedFor via OR
  if (filters.search?.trim()) params.search = filters.search.trim();

  const parsedUser = Number(filters.assignedToId);
  if (filters.assignedToId && !Number.isNaN(parsedUser)) {
    params.assignedToId = parsedUser;
  }

  if (filters.allDates) {
    // Signal backend to ignore its default "today" filter and return all dates
    params.allDates = 1;
    // dateFrom / dateTo are intentionally omitted when allDates is active
  } else {
    // Both dates present: only include if range is valid
    if (filters.dateFrom && filters.dateTo) {
      if (filters.dateFrom <= filters.dateTo) {
        params.dateFrom = filters.dateFrom;
        params.dateTo = filters.dateTo;
      }
    } else {
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
    }
  }

  params.sortBy = filters.sortBy;
  params.sortOrder = filters.sortOrder;

  return params;
};

/** Check if any non-default filter is active */
const computeHasActiveFilters = (filters) =>
  !!(
    filters.search ||
    filters.assignedToId ||
    // allDates=false is non-default (user has switched to date-range mode)
    !filters.allDates ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.sortBy !== DEFAULT_SORT_BY ||
    filters.sortOrder !== DEFAULT_SORT_ORDER
  );

/** Validate date range — returns error string or null.
 *  Always returns null when allDates is enabled (validation is bypassed). */
export const validateDateRange = (dateFrom, dateTo, allDates = false) => {
  if (allDates) return null;
  if (dateFrom && dateTo && dateFrom > dateTo) {
    return '"From" date cannot be after "To" date';
  }
  return null;
};

export const useKanbanFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Applied filters are always derived from URL — single source of truth for API
  const appliedFilters = useMemo(
    () => parseAppliedFilters(searchParams),
    [searchParams]
  );

  // Draft filters start from applied filters (so toolbar shows current state on load)
  const [draftFilters, setDraftFiltersState] = useState(() =>
    parseAppliedFilters(searchParams)
  );

  // Update one or more draft filter fields — does NOT touch URL or trigger API
  const setDraftFilters = useCallback((updates) => {
    setDraftFiltersState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Commit draft → URL → triggers API refetch
  const applyFilters = useCallback(() => {
    const next = new URLSearchParams();
    Object.entries(draftFilters).forEach(([key, val]) => {
      // Boolean field: allDates — write '1' when true, omit when false
      if (key === 'allDates') {
        if (val === true) next.set('allDates', '1');
        return;
      }
      const clean = typeof val === 'string' ? val.trim() : val;
      if (clean !== undefined && clean !== null && clean !== '') {
        // Skip default sort values to keep URL clean
        if (key === 'sortBy' && clean === DEFAULT_SORT_BY) return;
        if (key === 'sortOrder' && clean === DEFAULT_SORT_ORDER) return;
        next.set(key, String(clean));
      }
    });
    setSearchParams(next);
  }, [draftFilters, setSearchParams]);

  // Reset everything — clears URL and resets draft to defaults
  const resetFilters = useCallback(() => {
    setDraftFiltersState({ ...EMPTY_FILTERS });
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // Derived: has the draft diverged from what's currently applied?
  const isDirty = useMemo(() => {
    return JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);
  }, [draftFilters, appliedFilters]);

  // Date validation for the draft (inline, not toast).
  // Bypassed entirely when allDates is enabled.
  const dateRangeError = useMemo(
    () => validateDateRange(draftFilters.dateFrom, draftFilters.dateTo, draftFilters.allDates),
    [draftFilters.dateFrom, draftFilters.dateTo, draftFilters.allDates]
  );

  // API params are always derived from APPLIED (URL) filters
  const apiParams = useMemo(() => buildApiParams(appliedFilters), [appliedFilters]);

  const hasActiveFilters = useMemo(
    () => computeHasActiveFilters(appliedFilters),
    [appliedFilters]
  );

  const hasDraftActiveFilters = useMemo(
    () => computeHasActiveFilters(draftFilters),
    [draftFilters]
  );

  return {
    // Draft state (sidebar binds to these)
    draftFilters,
    setDraftFilters,

    // Applied state (drives API)
    appliedFilters,
    apiParams,
    hasActiveFilters,
    hasDraftActiveFilters,

    // Actions
    applyFilters,
    resetFilters,

    // UX helpers
    isDirty,
    dateRangeError,
  };
};
