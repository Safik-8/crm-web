import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../../lib/api/api';
import { toast } from 'sonner';

/**
 * useBranchDashboard
 *
 * Fetches branch-level pipeline analytics from the new stage-movement
 * endpoint. Replaces the old ISE report aggregation hook (useBranchReports).
 *
 * Endpoint: GET /daily-branch-reports/dashboard
 * Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD) — both optional.
 *
 * @param {{ startDate?: string, endDate?: string }} options
 * @returns {{ dashboardData, loading, error, refetch }}
 */
export const useBranchDashboard = ({ startDate, endDate } = {}) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  // Keep a ref to the active AbortController so we can cancel in-flight
  // requests when params change or the component unmounts.
  const abortRef = useRef(null);

  const fetchDashboard = useCallback(async () => {
    // Cancel any previous in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate)   params.append('endDate',   endDate);

      const qs       = params.toString();
      const endpoint = `/daily-branch-reports/dashboard${qs ? `?${qs}` : ''}`;

      const response = await apiClient(endpoint, {
        method: 'GET',
        signal: controller.signal,
      });

      // Aborted — do nothing; state is managed by the next call
      if (response === null) return;

      if (response?.success) {
        setDashboardData(response.data ?? null);
      } else {
        throw new Error(response?.message || 'Failed to fetch branch dashboard');
      }
    } catch (err) {
      // AbortError is swallowed by apiClient; guard here for safety
      if (err?.name === 'AbortError') return;

      const msg = err?.message || 'Something went wrong while loading the dashboard';
      setError(msg);
      toast.error(msg);
      setDashboardData(null);
    } finally {
      // Only update loading state if this request wasn't superseded
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchDashboard();
    return () => {
      // Cleanup: abort on unmount or dependency change
      abortRef.current?.abort();
    };
  }, [fetchDashboard]);

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchDashboard,
  };
};
