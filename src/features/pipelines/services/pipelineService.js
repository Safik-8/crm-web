import { apiClient } from '../../../lib/api/api';

export const getPipelines = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      qs.set(key, val);
    }
  });
  const queryString = qs.toString();
  return apiClient(`/pipelines${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
};

export const getPipelineById = (id, params = {}, options = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      qs.set(key, val);
    }
  });
  const queryString = qs.toString();
  const endpoint = `/pipelines/${id}${queryString ? `?${queryString}` : ''}`;
  return apiClient(endpoint, { method: 'GET', ...options });
};

export const createPipeline = (data) =>
  apiClient('/pipelines', { method: 'POST', body: data });

export const updatePipeline = (id, data) =>
  apiClient(`/pipelines/${id}`, { method: 'PUT', body: data });

export const deletePipeline = (id) =>
  apiClient(`/pipelines/${id}`, { method: 'DELETE' });

/**
 * Assign/reorder stages for a pipeline.
 * @param {number} pipelineId
 * @param {{ stageIds?: number[], newStages?: {name:string}[], orderedStageIds: number[] }} body
 */
export const assignPipelineStages = (pipelineId, body) =>
  apiClient(`/pipelines/${pipelineId}/stages`, { method: 'POST', body });

export const reorderPipelineStages = (pipelineId, orderedStageIds) =>
  apiClient(`/pipelines/${pipelineId}/stages/order`, {
    method: 'PUT',
    body: { orderedStageIds },
  });

export const getLeadPipelineHistory = (leadId) =>
  apiClient(`/leads/${leadId}/pipeline-history`, { method: 'GET' });
