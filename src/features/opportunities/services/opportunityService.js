// src/features/opportunities/services/opportunityService.js
import { apiClient } from '../../../lib/api/api';

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.set(key, val);
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
};

/**
 * Fetch paginated list of opportunities
 */
export const getOpportunities = (params = {}) => {
  return apiClient(`/opportunities${buildQueryString(params)}`, { method: 'GET' });
};

/**
 * Fetch a single opportunity profile by ID
 */
export const getOpportunityById = (id) => {
  return apiClient(`/opportunities/${id}`, { method: 'GET' });
};

/**
 * Create a new opportunity record
 */
export const createOpportunity = (data) => {
  return apiClient('/opportunities', { method: 'POST', body: data });
};

/**
 * Update opportunity details (revenue, stage, closing date, notes)
 */
export const updateOpportunity = (id, data) => {
  return apiClient(`/opportunities/${id}`, { method: 'PATCH', body: data });
};

/**
 * Close opportunity (WON / LOST / CANCELLED)
 */
export const closeOpportunity = (id, data) => {
  return apiClient(`/opportunities/${id}/close`, { method: 'POST', body: data });
};

/**
 * Fetch dynamic Opportunity deal stages
 */
export const getOpportunityStages = () => {
  return apiClient('/opportunities/stages', { method: 'GET' });
};
