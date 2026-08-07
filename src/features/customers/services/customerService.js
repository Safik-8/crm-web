import { apiClient } from '../../../lib/api/api';

const qs = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
};

/** GET /api/customers */
export const getCustomers = (params = {}) =>
  apiClient(`/customers${qs(params)}`, { method: 'GET' });

/** GET /api/customers/:id */
export const getCustomerById = (id) =>
  apiClient(`/customers/${id}`, { method: 'GET' });

/** PATCH /api/customers/:id/status */
export const updateCustomerStatus = (id, status) =>
  apiClient(`/customers/${id}/status`, { method: 'PATCH', body: { status } });
