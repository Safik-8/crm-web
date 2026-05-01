import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../lib/api/api';
import { toast } from 'sonner';

/**
 * Custom hook to fetch branch performance reports from the API.
 * 
 * @param {Object} options
 * @param {string} [options.startDate] - Start date in YYYY-MM-DD format
 * @param {string} [options.endDate] - End date in YYYY-MM-DD format
 * @returns {{ reportData, reportsCount, dateRange, loading, error, refetch }}
 */
export const useBranchReports = ({ startDate, endDate } = {}) => {
  const [reportData, setReportData] = useState(null);
  const [reportsCount, setReportsCount] = useState(0);
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query string from optional date params
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString();
      const endpoint = `/daily-branch-reports/get-reports${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient(endpoint, { method: 'GET' });

      if (response && response.success) {
        const { cards = [], reportsCount: count = 0, range = null } = response.data || {};

        setReportData(cards);
        setReportsCount(count);
        setDateRange(range);
      } else {
        throw new Error(response?.message || 'Failed to fetch branch reports');
      }
    } catch (err) {
      const errorMessage = err?.message || 'Something went wrong while fetching reports';
      setError(errorMessage);
      toast.error(errorMessage);
      // On error, set empty data so UI shows 0s gracefully
      setReportData([]);
      setReportsCount(0);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reportData,
    reportsCount,
    dateRange,
    loading,
    error,
    refetch: fetchReports,
  };
};
