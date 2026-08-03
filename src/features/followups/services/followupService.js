// src/features/followups/services/followupService.js
import { apiClient } from '../../../lib/api/api';

const buildQS = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
};

export const createFollowup     = (data)           => apiClient('/followups',                     { method: 'POST',   body: data });
export const getFollowups       = (params = {})    => apiClient(`/followups${buildQS(params)}`,   { method: 'GET' });
export const getFollowupsByLead = (leadId, p = {}) => apiClient(`/followups/lead/${leadId}${buildQS(p)}`, { method: 'GET' });
export const getFollowupById    = (id)             => apiClient(`/followups/${id}`,               { method: 'GET' });
export const updateFollowup     = (id, data)       => apiClient(`/followups/${id}`,               { method: 'PATCH',  body: data });
export const completeFollowup   = (id, data = {})  => apiClient(`/followups/${id}/complete`,     { method: 'PATCH',  body: data });
export const cancelFollowup     = (id)             => apiClient(`/followups/${id}/cancel`,        { method: 'PATCH',  body: {} });
export const deleteFollowup     = (id)             => apiClient(`/followups/${id}`,               { method: 'DELETE' });
