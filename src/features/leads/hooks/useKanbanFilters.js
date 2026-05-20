import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

/**
 * Hook to manage Leads Kanban board filters and sorting via URL search parameters.
 * Syncs UI controls with URL, normalizes API query params, and handles reset logic.
 */
export const useKanbanFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from search params, using defaults where appropriate
  const filters = useMemo(() => {
    return {
      leadName: searchParams.get('leadName')?.trim() || '',
      mobile: searchParams.get('mobile')?.trim() || '',
      stageId: searchParams.get('stageId') || '',
      assignedToId: searchParams.get('assignedToId') || '',
      interestedFor: searchParams.get('interestedFor')?.trim() || '',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || '',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };
  }, [searchParams]);

  // Set multiple filters at once, keeping URL clean by removing empty values
  const setFilters = useCallback((newFilters) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, val]) => {
      const cleanVal = typeof val === 'string' ? val.trim() : val;
      if (cleanVal === undefined || cleanVal === null || cleanVal === '') {
        next.delete(key);
      } else {
        next.set(key, String(cleanVal));
      }
    });
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  // Reset all filters back to initial state
  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // Normalize and prepare parameters for direct API requests
  const apiParams = useMemo(() => {
    const params = {};
    if (filters.leadName) params.leadName = filters.leadName;
    if (filters.mobile) params.mobile = filters.mobile;
    
    const parsedStage = Number(filters.stageId);
    if (filters.stageId && !Number.isNaN(parsedStage)) {
      params.stageId = parsedStage;
    }
    
    const parsedUser = Number(filters.assignedToId);
    if (filters.assignedToId && !Number.isNaN(parsedUser)) {
      params.assignedToId = parsedUser;
    }
    
    if (filters.interestedFor) params.interestedFor = filters.interestedFor;

    // Strict date range validation logic
    if (filters.dateFrom && filters.dateTo) {
      if (filters.dateFrom <= filters.dateTo) {
        params.dateFrom = filters.dateFrom;
        params.dateTo = filters.dateTo;
      }
    } else {
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
    }

    params.sortBy = filters.sortBy;
    params.sortOrder = filters.sortOrder;
    
    return params;
  }, [filters]);

  // Track if any active filters are applied beyond defaults
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.leadName ||
      filters.mobile ||
      filters.stageId ||
      filters.assignedToId ||
      filters.interestedFor ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.sortBy !== 'createdAt' ||
      filters.sortOrder !== 'desc'
    );
  }, [filters]);

  return {
    filters,
    setFilters,
    resetFilters,
    apiParams,
    hasActiveFilters,
  };
};
