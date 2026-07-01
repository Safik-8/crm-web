// src/features/branch/services/branchService.js

import axiosClient from '../../../api/axiosClient';

const BASE_PATH = '/branches';

export const branchService = {
  /**
   * Fetches paginated, filtered, and searched branches list.
   * GET /api/branches/paginated
   * @param {string|number} companyId - Scope branches list to specific company
   * @param {object} params - page, limit, search, status filters
   */
  getBranches: (companyId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (companyId) queryParams.set('company_id', companyId);
    if (params.page) queryParams.set('page', params.page);
    if (params.limit) queryParams.set('limit', params.limit);
    if (params.search) queryParams.set('search', params.search);
    if (params.status) queryParams.set('status', params.status);

    return axiosClient.get(`${BASE_PATH}/paginated?${queryParams.toString()}`);
  },

  /**
   * Fetches raw list of branches (useful for dropdown menus).
   * GET /api/branches
   */
  getBranchesRaw: (companyId) => {
    const url = companyId ? `${BASE_PATH}?company_id=${companyId}` : BASE_PATH;
    return axiosClient.get(url);
  },

  /**
   * Fetches details of a single branch by ID.
   * GET /api/branches/:id
   */
  getBranchById: (id) => {
    return axiosClient.get(`${BASE_PATH}/${id}`);
  },

  /**
   * Registers a new branch under a company scope.
   * POST /api/branches
   */
  createBranch: (branchData) => {
    return axiosClient.post(BASE_PATH, branchData);
  },

  /**
   * Updates existing branch parameters (name, address, location, status).
   * PUT /api/branches/:id
   */
  updateBranch: (id, data) => {
    return axiosClient.put(`${BASE_PATH}/${id}`, data);
  },

  /**
   * Toggles operational status of a branch.
   * PUT /api/branches/:id
   */
  toggleBranchStatus: (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return axiosClient.put(`${BASE_PATH}/${id}`, { status: nextStatus });
  },

  /**
   * Onboards a user and assigns them to a branch.
   * POST /api/branches/:id/assign-user
   */
  assignUser: (branchId, userData) => {
    return axiosClient.post(`${BASE_PATH}/${branchId}/assign-user`, userData);
  }
};
