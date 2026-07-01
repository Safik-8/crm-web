// src/features/company/services/companyService.js

import axiosClient from '../../../api/axiosClient';

const BASE_PATH = '/companies';

export const companyService = {
  /**
   * Fetches paginated, filtered, sorted companies list.
   * GET /api/companies/paginated
   * @param {object} params - pagination, search, status filters
   */
  getCompanies: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page);
    if (params.limit) queryParams.set('limit', params.limit);
    if (params.search) queryParams.set('search', params.search);
    if (params.status) queryParams.set('status', params.status);
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

    return axiosClient.get(`${BASE_PATH}/paginated?${queryParams.toString()}`);
  },

  /**
   * Fetches a single company by database ID.
   * GET /api/companies/:id
   */
  getCompanyById: (id) => {
    return axiosClient.get(`${BASE_PATH}/${id}`);
  },

  /**
   * Onboards a new company and registers its Company Admin user.
   * POST /api/companies
   * @param {object} companyData - Company master + Admin user fields
   */
  createCompany: (companyData) => {
    return axiosClient.post(BASE_PATH, companyData);
  },

  /**
   * Updates an existing company's master fields.
   * PUT /api/companies/:id
   */
  updateCompany: (id, companyData) => {
    return axiosClient.put(`${BASE_PATH}/${id}`, companyData);
  },

  /**
   * Toggles the operational status of a company.
   * PUT /api/companies/:id
   */
  toggleCompanyStatus: (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return axiosClient.put(`${BASE_PATH}/${id}`, { status: nextStatus });
  }
};
