// crm-web/src/features/dashboard/services/dashboardService.js
import { apiClient } from '../../../lib/api/api';

const BASE = '/dashboard';

function buildQs(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, v); });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export const dashboardService = {
  getMetrics:      (params) => apiClient(`${BASE}/metrics${buildQs(params)}`,       { method: 'GET' }),
  getLeadAging:    (params) => apiClient(`${BASE}/lead-aging${buildQs(params)}`,    { method: 'GET' }),
  getKpiTargets:   (params) => apiClient(`${BASE}/kpi-targets${buildQs(params)}`,   { method: 'GET' }),
  getActivityFeed: (params) => apiClient(`${BASE}/activity-feed${buildQs(params)}`, { method: 'GET' }),
  getCallQueue:    (params) => apiClient(`${BASE}/call-queue${buildQs(params)}`,    { method: 'GET' }),
};
