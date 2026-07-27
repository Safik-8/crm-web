// src/features/courses/hooks/useCourseList.js

import { useEffect, useMemo } from 'react';
import useListManager from '../../../shared/hooks/useListManager';
import { useCoursesQuery, useToggleCourseStatusMutation } from './useCourses';

/**
 * Custom hook to manage the state and logic for Course searching, filtering, sorting, and paging.
 * Restructured to consume the shared useListManager framework hook.
 *
 * @param {object} currentUser - Logged in user context
 * @returns {object} Filter states, loaders, pagination controls, status actions, and sort triggers
 */
export const useCourseList = (currentUser = null) => {
  // Memoize starting filters for multitenancy rules
  const initialFilters = useMemo(() => {
    const defaults = { status: '', category: '', companyId: '' };
    if (currentUser && currentUser.primaryRole !== 'SUPER_ADMIN') {
      defaults.companyId = currentUser.companyId || '';
    }
    return defaults;
  }, [currentUser]);

  const {
    search,
    handleSearchChange,
    page,
    setPage,
    filters,
    handleFilterChange,
    clearFilters: listClearFilters,
    sortBy,
    sortOrder,
    toggleSort,
    hasActiveFilters,
    queryParams,
    getLoadingState
  } = useListManager({
    defaultSort: { field: 'createdAt', order: 'desc' },
    defaultLimit: 10,
    initialFilters
  });

  // Sync tenant/company isolation rules when user context changes
  useEffect(() => {
    if (currentUser && currentUser.primaryRole !== 'SUPER_ADMIN') {
      handleFilterChange('companyId', currentUser.companyId || '');
    }
  }, [currentUser, handleFilterChange]);

  // Request parameters structure formatted for axios query params
  const apiParams = {
    ...queryParams,
    companyId: queryParams.companyId ? Number(queryParams.companyId) : undefined
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useCoursesQuery(apiParams);
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
  const loadingState = getLoadingState(isLoading || isFetching || toggleStatusMutation.isPending, isError, courses.length);

  /**
   * Clears all filters and resets search inputs with respects to user rank isolation rules
   */
  const customClearFilters = () => {
    const defaults = { status: '', category: '', companyId: '' };
    if (currentUser && currentUser.primaryRole !== 'SUPER_ADMIN') {
      defaults.companyId = currentUser.companyId || '';
    }
    listClearFilters(defaults);
  };

  return {
    courses,
    pagination,
    search,
    status: filters.status,
    category: filters.category,
    companyId: filters.companyId,
    loadingState,
    errorMessage: error?.message || 'Something went wrong.',
    hasActiveFilters,
    page,
    setPage,
    handleSearchChange,
    handleFilterChange,
    clearFilters: customClearFilters,
    refetch,
    handleToggleStatus,
    isTogglingStatus: toggleStatusMutation.isPending,
    sortBy,
    sortOrder,
    toggleSort
  };
};
