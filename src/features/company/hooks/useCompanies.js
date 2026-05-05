import { useState, useEffect, useCallback, useRef } from 'react';
import { companyApi } from '../api/companyApi';

const DEFAULT_LIMIT = 10;

/**
 * useCompanies
 * Centralises all state for the paginated companies listing:
 *   - data fetching (loading / success / error / empty)
 *   - pagination  (page, pages, total, hasNext, hasPrev)
 *   - search      (debounced, 400 ms)
 *   - status filter
 *   - sort
 *
 * Returns everything the page + sub-components need.
 */
const useCompanies = () => {
  // ── Filter / sort state ──────────────────────────────────────────────────
  const [search, setSearch]         = useState('');
  const [status, setStatus]         = useState('');
  const [sortBy, setSortBy]         = useState('createdAt');
  const [sortOrder, setSortOrder]   = useState('desc');
  const [page, setPage]             = useState(1);

  // ── Data state ───────────────────────────────────────────────────────────
  const [companies, setCompanies]   = useState([]);
  const [pagination, setPagination] = useState({
    page: 1, pages: 1, total: 0, hasNext: false, hasPrev: false,
  });
  const [loadingState, setLoadingState] = useState('loading'); // 'loading' | 'success' | 'error' | 'empty'
  const [errorMessage, setErrorMessage] = useState('');

  // ── Debounce search ──────────────────────────────────────────────────────
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef(null);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1); // reset to page 1 on new search
    }, 400);
  }, []);

  // ── Reset page when filters change ──────────────────────────────────────
  const handleStatusChange = useCallback((value) => {
    setStatus(value);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((value) => {
    // value format: 'createdAt_desc' | 'createdAt_asc' | 'name_asc' | 'name_desc'
    const [field, order] = value.split('_');
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  }, []);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchCompanies = useCallback(async () => {
    setLoadingState('loading');
    setErrorMessage('');
    try {
      const res = await companyApi.getPaginatedCompanies({
        page,
        limit: DEFAULT_LIMIT,
        search: debouncedSearch,
        status,
        sortBy,
        sortOrder,
      });

      if (res && res.success) {
        const list = Array.isArray(res.data?.companies) ? res.data.companies : [];
        setCompanies(list);
        setPagination({
          page:    res.data?.pagination?.page    ?? 1,
          pages:   res.data?.pagination?.pages   ?? 1,
          total:   res.data?.pagination?.total   ?? 0,
          hasNext: res.data?.pagination?.hasNext ?? false,
          hasPrev: res.data?.pagination?.hasPrev ?? false,
        });
        setLoadingState(list.length === 0 ? 'empty' : 'success');
      } else {
        setErrorMessage(res?.message || 'Failed to load companies.');
        setLoadingState('error');
      }
    } catch (err) {
      console.error('useCompanies fetch error:', err);
      setErrorMessage(err?.message || 'An unexpected error occurred.');
      setLoadingState('error');
    }
  }, [page, debouncedSearch, status, sortBy, sortOrder]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // ── Cleanup debounce on unmount ──────────────────────────────────────────
  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  return {
    // data
    companies,
    pagination,
    loadingState,
    errorMessage,
    // filters
    search,
    status,
    sortBy,
    sortOrder,
    // handlers
    handleSearchChange,
    handleStatusChange,
    handleSortChange,
    setPage,
    refetch: fetchCompanies,
  };
};

export default useCompanies;
