// src/features/users/hooks/useUserList.js

import { useState, useCallback, useRef, useEffect } from 'react';
import { useUsersQuery, useToggleUserStatusMutation } from './useUsers';

export const useUserList = (currentUser = null) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filters state
  const [status, setStatus] = useState('');
  const [roleId, setRoleId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [branchId, setBranchId] = useState('');

  const debounceTimer = useRef(null);

  // Sync multitenancy scopes based on logged-in user role
  useEffect(() => {
    if (currentUser) {
      if (currentUser.primaryRole !== 'SUPER_ADMIN') {
        setCompanyId(currentUser.companyId || '');
      }
      if (currentUser.primaryRole !== 'SUPER_ADMIN' && currentUser.primaryRole !== 'COMPANY_ADMIN') {
        setBranchId(currentUser.branchId || '');
      }
    }
  }, [currentUser]);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  const handleFilterChange = useCallback((field, value) => {
    setPage(1);
    if (field === 'status') setStatus(value);
    if (field === 'roleId') setRoleId(value);
    if (field === 'companyId') {
      setCompanyId(value);
      setBranchId(''); // Reset branch on company change
    }
    if (field === 'branchId') setBranchId(value);
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
    setStatus('');
    setRoleId('');
    if (currentUser?.primaryRole === 'SUPER_ADMIN') {
      setCompanyId('');
      setBranchId('');
    } else if (currentUser?.primaryRole === 'COMPANY_ADMIN') {
      setBranchId('');
    }
  }, [currentUser]);

  const params = {
    page,
    limit,
    search: debouncedSearch,
    status,
    roleId,
    companyId: companyId ? Number(companyId) : undefined,
    branchId: branchId ? Number(branchId) : undefined
  };

  const { data, isLoading, isError, error, refetch } = useUsersQuery(params);
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
    toggleStatusMutation.mutate({ id, nextStatus });
  };

  let loadingState = 'success';
  if (isLoading) {
    loadingState = 'loading';
  } else if (isError) {
    loadingState = 'error';
  } else if (users.length === 0) {
    loadingState = 'empty';
  }

  const hasActiveFilters = !!(
    debouncedSearch ||
    status ||
    roleId ||
    (currentUser?.primaryRole === 'SUPER_ADMIN' && (companyId || branchId)) ||
    (currentUser?.primaryRole === 'COMPANY_ADMIN' && branchId)
  );

  return {
    users,
    pagination,
    search,
    status,
    roleId,
    companyId,
    branchId,
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
