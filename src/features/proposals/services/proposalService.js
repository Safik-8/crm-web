import { apiClient } from '../../../lib/api/api';

const qs = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
};

export const getProposals = (params = {}) => apiClient(`/proposals${qs(params)}`, { method: 'GET' });
export const getProposalById = (id) => apiClient(`/proposals/${id}`, { method: 'GET' });
export const createProposal = (data) => apiClient(`/proposals`, { method: 'POST', body: JSON.stringify(data) });
export const updateProposal = (id, data) => apiClient(`/proposals/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const updateProposalStatus = (id, status) => apiClient(`/proposals/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const deleteProposal = (id) => apiClient(`/proposals/${id}`, { method: 'DELETE' });
