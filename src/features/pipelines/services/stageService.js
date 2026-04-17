import { apiClient } from '../../../lib/api/api';

export const getAllStages = () =>
  apiClient('/stages', { method: 'GET' });

export const getPipelineStages = (pipelineId) =>
  apiClient(`/stages/pipeline/${pipelineId}`, { method: 'GET' });

export const createStage = (data) =>
  apiClient('/stages', { method: 'POST', body: data });

export const updateStage = (id, data) =>
  apiClient(`/stages/${id}`, { method: 'PUT', body: data });

export const deleteStage = (id) =>
  apiClient(`/stages/${id}`, { method: 'DELETE' });
