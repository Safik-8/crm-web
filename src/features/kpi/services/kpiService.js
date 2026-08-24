// FrontEnd/src/features/kpi/services/kpiService.js

import axiosClient from '../../../api/axiosClient';

const BASE_PATH = '/kpi';

export const kpiService = {
  getDashboard: async (tab = 'my', filters = {}) => {
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== undefined && v !== null && v !== '' && v !== 'ALL')
    );
    const params = new URLSearchParams({ tab, ...cleanFilters });
    const res = await axiosClient.get(`${BASE_PATH}/dashboard?${params.toString()}`);
    return res.data || res;
  },

  createTarget: async (targetData) => {
    const res = await axiosClient.post(`${BASE_PATH}/targets`, targetData);
    return res.data || res;
  },

  getDetail: async (id) => {
    const res = await axiosClient.get(`${BASE_PATH}/targets/${id}`);
    return res.data || res;
  },

  updateTarget: async (id, targetData) => {
    const res = await axiosClient.put(`${BASE_PATH}/targets/${id}`, targetData);
    return res.data || res;
  },
};
