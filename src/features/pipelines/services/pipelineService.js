import { apiClient } from '../../../lib/api/api';

export const getPipelines = () =>
  apiClient('/pipelines', { method: 'GET' });

export const getPipelineById = (id) =>
  apiClient(`/pipelines/${id}`, { method: 'GET' });

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
