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
    body: data,
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
    method: 'GET',
  });
  return response?.data || [];
};

/**
 * Get active dynamic qualification criteria for the company
 */
export const getQualificationCriteria = async (companyId = null) => {
  const query = companyId ? `?companyId=${companyId}` : '';
  const response = await apiClient(`/qualification-settings/criteria${query}`, {
    method: 'GET',
  });
  return response?.data || [];
};

/**
 * Get company qualification settings (pass threshold, hold threshold)
 */
export const getQualificationSettings = async (companyId = null) => {
  const query = companyId ? `?companyId=${companyId}` : '';
  const response = await apiClient(`/qualification-settings/settings${query}`, {
    method: 'GET',
  });
  return response?.data || { passThreshold: 60, holdThreshold: 40 };
};

/**
 * Create a new criterion field (Admin)
 */
export const createCriteria = async (data, companyId = null) => {
  const query = companyId ? `?companyId=${companyId}` : '';
  const response = await apiClient(`/qualification-settings/criteria${query}`, {
    method: 'POST',
    body: { ...data, ...(companyId ? { companyId } : {}) },
  });
  return response?.data || response;
};

/**
 * Update an existing criterion field (Admin)
 */
export const updateCriteria = async (id, data, companyId = null) => {
  const query = companyId ? `?companyId=${companyId}` : '';
  const response = await apiClient(`/qualification-settings/criteria/${id}${query}`, {
    method: 'PUT',
    body: { ...data, ...(companyId ? { companyId } : {}) },
  });
  return response?.data || response;
};

/**
 * Soft-delete a criterion field (Admin)
 */
export const deleteCriteria = async (id, companyId = null) => {
  const query = companyId ? `?companyId=${companyId}` : '';
  const response = await apiClient(`/qualification-settings/criteria/${id}${query}`, {
    method: 'DELETE',
  });
  return response?.data || response;
};

/**
 * Save entire criteria matrix (Admin)
 */
export const saveCriteriaMatrix = async (criteria, companyId = null) => {
  const query = companyId ? `?companyId=${companyId}` : '';
  const response = await apiClient(`/qualification-settings/matrix${query}`, {
    method: 'POST',
    body: { criteria, ...(companyId ? { companyId } : {}) },
  });
  return response?.data || response;
};

/**
 * Auto-balance criteria weights to 100 points using Largest Remainder Algorithm (Admin)
 */
export const autoBalanceCriteria = async (companyId = null) => {
  const query = companyId ? `?companyId=${companyId}` : '';
  const response = await apiClient(`/qualification-settings/auto-balance${query}`, {
    method: 'POST',
    body: companyId ? { companyId } : {},
  });
  return response?.data || response;
};

/**
 * Update company qualification settings (pass threshold, hold threshold)
 */
export const updateQualificationSettings = async (data, companyId = null) => {
  const query = companyId ? `?companyId=${companyId}` : '';
  const response = await apiClient(`/qualification-settings/settings${query}`, {
    method: 'PUT',
    body: { ...data, ...(companyId ? { companyId } : {}) },
  });
  return response?.data || response;
};
