// src/features/users/hooks/useUserList.js

import { useEffect, useMemo } from 'react';
import useListManager from '../../../shared/hooks/useListManager';
import { useUsersQuery, useToggleUserStatusMutation } from './useUsers';

/**
 * Custom hook to manage the state and logic for User searching, filtering, sorting, and paging.
 * Restructured to consume the shared useListManager framework hook.
 *
 * @param {object} currentUser - Logged in user context
 * @returns {object} Filter states, loaders, pagination controls, status actions, and sort triggers
 */
export const useUserList = (currentUser = null) => {
  const initialFilters = useMemo(() => {
    const defaults = { status: '', roleId: '', companyId: '', branchId: '' };
    if (currentUser) {
      if (currentUser.primaryRole !== 'SUPER_ADMIN') {
        defaults.companyId = currentUser.companyId || '';
      }
      if (currentUser.primaryRole !== 'SUPER_ADMIN' && currentUser.primaryRole !== 'COMPANY_ADMIN') {
        defaults.branchId = currentUser.branchId || '';
      }
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

  // Sync multitenancy scopes based on logged-in user role
  useEffect(() => {
    if (currentUser) {
      if (currentUser.primaryRole !== 'SUPER_ADMIN') {
        handleFilterChange('companyId', currentUser.companyId || '');
      }
      if (currentUser.primaryRole !== 'SUPER_ADMIN' && currentUser.primaryRole !== 'COMPANY_ADMIN') {
        handleFilterChange('branchId', currentUser.branchId || '');
      }
    }
  }, [currentUser, handleFilterChange]);

  // Request parameters structure formatted for axios query params
  const apiParams = {
    ...queryParams,
    companyId: queryParams.companyId ? Number(queryParams.companyId) : undefined,
    branchId: queryParams.branchId ? Number(queryParams.branchId) : undefined
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useUsersQuery(apiParams);
  const toggleStatusMutation = useToggleUserStatusMutation();

  const users = Array.isArray(data?.data?.users) ? data.data.users : [];
  const pagination = data?.data || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  };

  const handleToggleStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return toggleStatusMutation.mutateAsync({ id, nextStatus });
  };

  // Derive page loading states
  const loadingState = getLoadingState(isLoading || isFetching || toggleStatusMutation.isPending, isError, users.length);

  /**
   * Clears all filters and resets search inputs with respects to user rank isolation rules
   */
  const customClearFilters = () => {
    const defaults = { status: '', roleId: '', companyId: '', branchId: '' };
    if (currentUser) {
      if (currentUser.primaryRole !== 'SUPER_ADMIN') {
        defaults.companyId = currentUser.companyId || '';
      }
      if (currentUser.primaryRole !== 'SUPER_ADMIN' && currentUser.primaryRole !== 'COMPANY_ADMIN') {
        defaults.branchId = currentUser.branchId || '';
      }
    }
    listClearFilters(defaults);
  };

  return {
    users,
    pagination,
    search,
    status: filters.status,
    roleId: filters.roleId,
    companyId: filters.companyId,
    branchId: filters.branchId,
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
