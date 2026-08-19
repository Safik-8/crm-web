// crm-web/src/features/revenueReport/services/revenueReportService.js

import { apiClient } from '../../../lib/api/api';

/**
 * Format query params to URL string
 */
const qs = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      q.set(k, String(v));
    }
  });
  const str = q.toString();
  return str ? `?${str}` : '';
};

export const revenueReportService = {
  getSummary: async (params) => {
    const res = await apiClient(`/reports/revenue/summary${qs(params)}`, { method: 'GET' });
    return res?.data;
  },

  getMonthly: async (params) => {
    const res = await apiClient(`/reports/revenue/monthly${qs(params)}`, { method: 'GET' });
    return res?.data;
  },

  getQuarterly: async (params) => {
    const res = await apiClient(`/reports/revenue/quarterly${qs(params)}`, { method: 'GET' });
    return res?.data;
  },

  getProduct: async (params) => {
    const res = await apiClient(`/reports/revenue/product${qs(params)}`, { method: 'GET' });
    return res?.data;
  },

  getTeam: async (params) => {
    const res = await apiClient(`/reports/revenue/team${qs(params)}`, { method: 'GET' });
    return res?.data;
  },

  getBranch: async (params) => {
    const res = await apiClient(`/reports/revenue/branch${qs(params)}`, { method: 'GET' });
    return res?.data;
  },

  getTrend: async (params) => {
    const res = await apiClient(`/reports/revenue/trend${qs(params)}`, { method: 'GET' });
    return res?.data;
  },

  logExport: async (payload) => {
    const res = await apiClient('/reports/revenue/export-log', {
      method: 'POST',
      body: payload
    });
    return res?.data;
  }
};
