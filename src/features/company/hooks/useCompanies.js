// src/features/company/hooks/useCompanies.js

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, useIsMutating } from '@tanstack/react-query';
import { companyService } from '../services/companyService';

const DEFAULT_LIMIT = 10;

/**
 * useCompanies
 * Orchestrates the React state for searching, sorting, and pagination
 * while using TanStack Query for caching and server-state management.
 */
export const useCompanies = () => {
  // ── Filter / Sort / Page React States ────────────────────────────────────
  const [search, setSearch]         = useState('');
  const [status, setStatus]         = useState('');
  const [sortBy, setSortBy]         = useState('createdAt');
  const [sortOrder, setSortOrder]   = useState('desc');
  const [page, setPage]             = useState(1);

  // ── Debounce Search Logic ────────────────────────────────────────────────
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef(null);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1); // Reset page to 1 on new search query
    }, 400);
  }, []);

  const handleStatusChange = useCallback((value) => {
    setStatus(value);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((value) => {
    const [field, order] = value.split('_');
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  }, []);

  // ── Query Parameters Payload ─────────────────────────────────────────────
  const params = {
    page,
    limit: DEFAULT_LIMIT,
    search: debouncedSearch,
    status,
    sortBy,
    sortOrder
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
    queryKey: ['companies', params],
    queryFn: () => companyService.getCompanies(params),
    staleTime: 5 * 60 * 1000, // Keep stale data cached for 5 minutes
  });

  // Extract companies list and pagination details safely
  const companiesList = Array.isArray(data?.data?.companies) ? data.data.companies : [];
  const paginationInfo = data?.data?.pagination || {
    page: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false
  };

  const isMutatingCompanies = useIsMutating({ mutationKey: ['companies'] }) > 0;

  // Derive loadingState string expected by existing UI components
  let loadingState = 'success';
  if (isLoading || isFetching || isMutatingCompanies) {
    loadingState = 'loading';
  } else if (isError) {
    loadingState = 'error';
  } else if (companiesList.length === 0) {
    loadingState = 'empty';
  }

  // Cleanup timers
  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  return {
    // query results
    companies: companiesList,
    pagination: paginationInfo,
    loadingState,
    errorMessage: error?.message || '',
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
    refetch
  };
};

/**
 * useCompany - Fetch single company by ID
 */
export const useCompany = (id) => {
  return useQuery({
    queryKey: ['company', id],
    queryFn: () => companyService.getCompanyById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * useCreateCompany - Onboards a new company and registers its Company Admin user.
 */
export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (companyData) => companyService.createCompany(companyData),
    onSuccess: () => {
      // Invalidate list queries to trigger refreshing of data in background
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    }
  });
};

/**
 * useUpdateCompany - Updates company master parameters
 */
export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => companyService.updateCompany(id, data),
    onSuccess: (res, variables) => {
      // Refresh single company detail caches, company lists, and system settings
      queryClient.invalidateQueries({ queryKey: ['company', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    }
  });
};

/**
 * useToggleCompanyStatus - Toggles company ACTIVE/INACTIVE state
 */
export const useToggleCompanyStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, currentStatus }) => companyService.toggleCompanyStatus(id, currentStatus),
    onSuccess: () => {
      // Invalidate list queries to update company state immediately
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    }
  });
};
