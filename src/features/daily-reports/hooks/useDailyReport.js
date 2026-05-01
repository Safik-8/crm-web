import { useState } from 'react';
import { apiClient } from '../../../lib/api/api';
import { toast } from 'sonner';

export const useDailyReport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitReport = async (reportData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient('/daily-branch-reports/submit', {
        method: 'POST',
        body: reportData,
      });

      if (response && response.success) {
        toast.success(response.message || 'Report submitted successfully!');
        return { success: true, data: response.data };
      } else {
        throw new Error(response?.message || 'Failed to submit report');
      }
    } catch (err) {
      const errorMessage = err?.message || 'Something went wrong';
      setError(errorMessage);
      
      if (err?.errors && Array.isArray(err.errors)) {
        err.errors.forEach(errorObj => {
          toast.error(`${errorObj.field}: ${errorObj.message}`);
        });
      } else {
        toast.error(errorMessage);
      }
      
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    submitReport,
    loading,
    error,
  };
};
