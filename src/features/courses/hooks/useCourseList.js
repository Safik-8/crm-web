// src/features/courses/hooks/useCourseList.js

import { useState, useCallback, useRef, useEffect } from 'react';
import { useCoursesQuery, useToggleCourseStatusMutation } from './useCourses';

/**
 * Custom hook to manage the state and logic for Course searching, filtering, and paging.
 * Ensures isolation checks and debounced search triggers.
 *
 * @param {object} currentUser - Logged in user context
 * @returns {object} Filter states, loaders, pagination controls, and status actions
 */
export const useCourseList = (currentUser = null) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filter states
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [companyId, setCompanyId] = useState('');

  const debounceTimer = useRef(null);

  // Sync tenant/company isolation rules
  useEffect(() => {
    if (currentUser) {
      if (currentUser.primaryRole !== 'SUPER_ADMIN') {
        // Locked to own company
        setCompanyId(currentUser.companyId || '');
      }
    }
  }, [currentUser]);

  /**
   * Search input handler with 400ms debounce
   */
  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  /**
   * Filter change handler
   */
  const handleFilterChange = useCallback((field, value) => {
    setPage(1);
    if (field === 'status') setStatus(value);
    if (field === 'category') setCategory(value);
    if (field === 'companyId') setCompanyId(value);
  }, []);

  /**
   * Clears all filters and resets search inputs
   */
  const clearFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
    setStatus('');
    setCategory('');
    if (currentUser?.primaryRole === 'SUPER_ADMIN') {
      setCompanyId('');
    }
  }, [currentUser]);

  // Request parameters structure
  const params = {
    page,
    limit,
    search: debouncedSearch,
    status,
    category,
    companyId: companyId ? Number(companyId) : undefined
  };

  const { data, isLoading, isError, error, refetch } = useCoursesQuery(params);
  const toggleStatusMutation = useToggleCourseStatusMutation();

  const courses = Array.isArray(data?.courses) ? data.courses : [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  };

  /**
   * Status change action trigger
   */
  const handleToggleStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    toggleStatusMutation.mutate({ id, nextStatus });
  };

  // Derive page loading states
  let loadingState = 'success';
  if (isLoading) {
    loadingState = 'loading';
  } else if (isError) {
    loadingState = 'error';
  } else if (courses.length === 0) {
    loadingState = 'empty';
  }

  const hasActiveFilters = !!(
    debouncedSearch ||
    status ||
    category ||
    (currentUser?.primaryRole === 'SUPER_ADMIN' && companyId)
  );

  return {
    courses,
    pagination,
    search,
    status,
    category,
    companyId,
    loadingState,
    errorMessage: error?.message || 'Something went wrong.',
    hasActiveFilters,
    page,
    setPage,
    handleSearchChange,
    handleFilterChange,
    clearFilters,
    refetch,
    handleToggleStatus,
    isTogglingStatus: toggleStatusMutation.isPending
  };
};
