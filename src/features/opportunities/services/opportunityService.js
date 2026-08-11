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
export const getOpportunityStages = (params = {}) => {
  return apiClient(`/opportunities/stages${buildQueryString(params)}`, { method: 'GET' });
};

/**
 * Create a new opportunity stage
 */
export const createOpportunityStage = (data) => {
  return apiClient('/opportunities/stages', { method: 'POST', body: data });
};

/**
 * Update opportunity stage details
 */
export const updateOpportunityStage = (stageId, data) => {
  return apiClient(`/opportunities/stages/${stageId}`, { method: 'PATCH', body: data });
};

/**
 * Toggle opportunity stage status (ACTIVE / INACTIVE)
 */
export const toggleOpportunityStage = (stageId, status, params = {}) => {
  return apiClient(`/opportunities/stages/${stageId}/toggle${buildQueryString(params)}`, { method: 'PATCH', body: { status } });
};

/**
 * Delete opportunity stage
 */
export const deleteOpportunityStage = (stageId, params = {}) => {
  return apiClient(`/opportunities/stages/${stageId}${buildQueryString(params)}`, { method: 'DELETE' });
};

/**
 * Move opportunity to another stage
 */
export const moveOpportunityStage = (oppId, data) => {
  return apiClient(`/opportunities/${oppId}/stage`, { method: 'PATCH', body: data });
};

/**
 * Bulk update opportunity stages display order and status
 */
export const bulkUpdateOpportunityStages = (data) => {
  return apiClient('/opportunities/stages/bulk', { method: 'PUT', body: data });
};

/**
 * Fetch active win/loss reasons for the current company
 */
export const getWinLossReasons = (params = {}) => {
  return apiClient(`/opportunities/reasons${buildQueryString(params)}`, { method: 'GET' });
};
