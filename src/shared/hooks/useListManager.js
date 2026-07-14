import { useState, useCallback, useMemo } from 'react';
import useDebounce from './useDebounce';

/**
 * Reusable Custom Hook to manage common search, filter, sorting, and pagination logic.
 *
 * @param {object} options - Configuration parameters
 * @param {object} options.defaultSort - Default sorting (field and direction)
 * @param {number} options.defaultLimit - Default records per page
 * @param {object} options.initialFilters - Starting values for other filters
 * @returns {object} Orchestrated search/sort/filter state and controls
 */
export const useListManager = ({
  defaultSort = { field: 'createdAt', order: 'desc' },
  defaultLimit = 10,
  initialFilters = {}
} = {}) => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);

  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState(defaultSort.field);
  const [sortOrder, setSortOrder] = useState(defaultSort.order);

  const handleSearchChange = useCallback((val) => {
    setSearch(val);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((field, val) => {
    setPage(1);
    setFilters((prev) => {
      // Support object merges for multi-field updates (e.g. resetting branchId when companyId changes)
      if (typeof field === 'object' && field !== null) {
        return { ...prev, ...field };
      }
      return {
        ...prev,
        [field]: val
      };
    });
  }, []);

  const toggleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  }, [sortBy]);

  const clearFilters = useCallback((defaults = {}) => {
    setSearch('');
    setPage(1);
    setFilters(defaults);
  }, []);

  // Compute hasActiveFilters based on search query or filters
  const hasActiveFilters = useMemo(() => {
    const hasSearch = !!debouncedSearch.trim();
    
    // We check if any filter key has a valid search parameter that differs from empty
    const hasFilters = Object.entries(filters).some(([key, val]) => {
      // Ignore keys that are used for mandatory backend scopes (handled at component levels)
      if (key === 'companyIdLocked') return false;
      return val !== '' && val !== null && val !== undefined;
    });

    return hasSearch || hasFilters;
  }, [debouncedSearch, filters]);

  // Derived parameter payload for API consumption
  const queryParams = useMemo(() => {
    // Filter out undefined and empty string values to keep the request clean
    const cleanFilters = {};
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== '' && val !== undefined && val !== null) {
        cleanFilters[key] = val;
      }
    });

    return {
      page,
      limit,
      search: debouncedSearch.trim() || undefined,
      sortBy,
      sortOrder,
      ...cleanFilters
    };
  }, [page, limit, debouncedSearch, sortBy, sortOrder, filters]);

  // Derived loading state mapping helper
  const getLoadingState = useCallback((isLoading, isError, dataLength) => {
    if (isLoading) return 'loading';
    if (isError) return 'error';
    if (!dataLength || dataLength === 0) return 'empty';
    return 'success';
  }, []);

  return {
    search,
    setSearch,
    debouncedSearch,
    handleSearchChange,

    page,
    setPage,
    limit,
    setLimit,

    filters,
    setFilters,
    handleFilterChange,
    clearFilters,

    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    toggleSort,

    hasActiveFilters,
    queryParams,
    getLoadingState
  };
};

export default useListManager;
