// src/features/branch/hooks/useBranches.js

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchService } from '../services/branchService';

const DEFAULT_LIMIT = 10;

/**
 * useBranches
 * Orchestrates the React state for searching, sorting, and pagination
 * while using TanStack Query for caching and server-state management.
 */
export const useBranches = (companyId) => {
  // ── Filter / Sort / Page React States ────────────────────────────────────
  const [search, setSearch]         = useState('');
  const [status, setStatus]         = useState('');
  const [page, setPage]             = useState(1);

  // ── Debounce Search Logic ────────────────────────────────────────────────
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef(null);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1); // Reset to page 1 on new search terms
    }, 400);
  }, []);

  const handleStatusChange = useCallback((value) => {
    setStatus(value);
    setPage(1);
  }, []);

  // ── Query Parameters Payload ─────────────────────────────────────────────
  const params = {
    page,
    limit: DEFAULT_LIMIT,
    search: debouncedSearch,
    status
  };

  // ── TanStack Query Hook ──
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['branches', companyId, params],
    queryFn: () => branchService.getBranches(companyId, params),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Extract branches list and pagination details safely
  const branchesList = Array.isArray(data?.data?.branches) ? data.data.branches : [];
  const paginationInfo = data?.data ? {
    page: data.data.page || 1,
    limit: data.data.limit || DEFAULT_LIMIT,
    total: data.data.total || 0,
    totalPages: data.data.totalPages || 1,
    hasNext: data.data.hasNext || false,
    hasPrev: data.data.hasPrev || false
  } : {
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  };

  // Derive loadingState string expected by UI components
  let loadingState = 'success';
  if (isLoading || isFetching) {
    loadingState = 'loading';
  } else if (isError) {
    loadingState = 'error';
  } else if (branchesList.length === 0) {
    loadingState = 'empty';
  }

  // Cleanup timers
  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  return {
    // query results
    branches: branchesList,
    pagination: paginationInfo,
    loadingState,
    errorMessage: error?.message || '',
    // filters
    search,
    status,
    // handlers
    handleSearchChange,
    handleStatusChange,
    setPage,
    refetch
  };
};

/**
 * useCreateBranch - Registers a new branch
 */
export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (branchData) => branchService.createBranch(branchData),
    onSuccess: (res, variables) => {
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['branches', String(variables.companyId)] });
      queryClient.invalidateQueries({ queryKey: ['branches', Number(variables.companyId)] });
    }
  });
};

/**
 * useUpdateBranch - Updates branch parameters
 */
export const useUpdateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => branchService.updateBranch(id, data),
    onSuccess: (res, variables) => {
      const companyId = res?.data?.branch?.companyId || res?.data?.companyId;
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: ['branches', String(companyId)] });
        queryClient.invalidateQueries({ queryKey: ['branches', Number(companyId)] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['branches'] });
      }
    }
  });
};

/**
 * useAssignUserToBranch - Onboards a user and links them to the branch
 */
export const useAssignUserToBranch = () => {
  return useMutation({
    mutationFn: ({ branchId, userData }) => branchService.assignUser(branchId, userData)
  });
};

/**
 * useToggleBranchStatus - Deactivates or activates a branch
 */
export const useToggleBranchStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, currentStatus }) => branchService.toggleBranchStatus(id, currentStatus),
    onSuccess: (res) => {
      const companyId = res?.data?.branch?.companyId || res?.data?.companyId;
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: ['branches', String(companyId)] });
        queryClient.invalidateQueries({ queryKey: ['branches', Number(companyId)] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['branches'] });
      }
    }
  });
};
