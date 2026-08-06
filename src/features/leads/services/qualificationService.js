import { apiClient } from '../../../lib/api/api';

/**
 * Qualify a lead
 * @param {number|string} leadId - The ID of the lead to qualify
 * @param {Object} data - The qualification data
 * @returns {Promise<Object>} The API response
 */
export const qualifyLead = async (leadId, data) => {
  const response = await apiClient(`/leads/${leadId}/qualify`, {
    method: 'POST',
    body: data
  });
  return response?.data || response;
};

/**
 * Get qualification history for a lead
 * @param {number|string} leadId - The ID of the lead
 * @returns {Promise<Array>} The qualification history records
 */
export const getQualificationHistory = async (leadId) => {
  const response = await apiClient(`/leads/${leadId}/qualification-history`, {
    method: 'GET'
  });
  return response?.data || [];
};
