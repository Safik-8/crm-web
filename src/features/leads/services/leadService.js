import { apiClient } from '../../../lib/api/api';

export const getLeads = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.pipelineId) qs.set('pipelineId', params.pipelineId);
  if (params.stageId)    qs.set('stageId', params.stageId);
  if (params.page)       qs.set('page', params.page);
  if (params.limit)      qs.set('limit', params.limit);
  return apiClient(`/leads?${qs.toString()}`, { method: 'GET' });
};

export const createLead = (data) =>
  apiClient('/leads', { method: 'POST', body: data });

export const updateLead = (leadId, data) =>
  apiClient(`/leads/${leadId}`, { method: 'PUT', body: data });

export const deleteLead = (leadId) =>
  apiClient(`/leads/${leadId}`, { method: 'DELETE' });

export const updateLeadStage = (leadId, stageId) =>
  apiClient(`/leads/${leadId}/stage`, {
    method: 'PATCH',
    body: { stageId },
    silent: true,
  });

export const getLeadComments = (leadId) =>
  apiClient(`/leads/${leadId}/comments`, { method: 'GET' });

export const addLeadComment = (leadId, comment) =>
  apiClient(`/leads/${leadId}/comments`, { method: 'POST', body: { comment } });

export const getBranchUsers = () =>
  apiClient('/leads/branch-users', { method: 'GET' });

export const importLeads = (formData) =>
  apiClient('/leads/import-excel', {
    method: 'POST',
    body: formData,
  });

