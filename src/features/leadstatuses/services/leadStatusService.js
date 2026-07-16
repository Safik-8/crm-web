// src/features/leadstatuses/services/leadStatusService.js
import { apiClient } from '../../../lib/api/api';

const qs = (params) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      q.set(k, v);
    }
  });
  const s = q.toString();
  return s ? `?${s}` : '';
};

export const getLeadStatuses = (params = {}) => {
  return apiClient(`/lead-statuses${qs(params)}`, { method: 'GET' });
};

export const createLeadStatus = (data) => {
  return apiClient('/lead-statuses', { method: 'POST', body: data });
};

export const updateLeadStatus = (id, data) => {
  return apiClient(`/lead-statuses/${id}`, { method: 'PUT', body: data });
};

export const toggleLeadStatus = (id) => {
  return apiClient(`/lead-statuses/${id}/toggle-status`, { method: 'PATCH' });
};

export const deleteLeadStatus = (id) => {
  return apiClient(`/lead-statuses/${id}`, { method: 'DELETE' });
};

export const reorderLeadStatuses = (items) => {
  return apiClient('/lead-statuses/reorder', { method: 'PATCH', body: items });
};
