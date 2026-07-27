import { apiClient } from '../../../lib/api/api';

export const getAllStages = () =>
  apiClient('/stages', { method: 'GET' });

/** Admin variant — returns ACTIVE + INACTIVE stages (for Pipeline Builder) */
export const getAllStagesAdmin = () =>
  apiClient('/stages/admin/all', { method: 'GET' });

export const getPipelineStages = (pipelineId) =>
  apiClient(`/stages/pipeline/${pipelineId}`, { method: 'GET' });

export const createStage = (data) =>
  apiClient('/stages', { method: 'POST', body: data });

export const updateStage = (id, data) =>
  apiClient(`/stages/${id}`, { method: 'PUT', body: data });

export const deleteStage = (id) =>
  apiClient(`/stages/${id}`, { method: 'DELETE' });

/** Toggle a stage between ACTIVE and INACTIVE */
export const toggleStageStatus = (id, status) =>
  apiClient(`/stages/${id}/status`, { method: 'PATCH', body: { status } });

