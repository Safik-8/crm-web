import { apiClient } from '../../../lib/api/api';

const qs = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
};

export const getDeals      = (params = {}) => apiClient(`/deals${qs(params)}`,        { method: 'GET' });
export const getDealsStats = (params = {}) => apiClient(`/deals/stats${qs(params)}`,  { method: 'GET' });
export const getDealById   = (id)          => apiClient(`/deals/${id}`,               { method: 'GET' });
