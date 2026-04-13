import { apiClient } from '../../../lib/api/api';

const BASE_PATH = '/companies';

/**
 * Company API Layer
 * Integrates with http://localhost:5000/api/companies
 */
export const companyApi = {
  /**
   * Fetch all companies
   * GET /api/companies
   */
  getCompanies: () => {
    return apiClient(BASE_PATH, { method: 'GET' });
  },

  /**
   * Fetch a single company by ID
   * GET /api/companies/:id
   */
  getCompany: (id) => {
    return apiClient(`${BASE_PATH}/${id}`, { method: 'GET' });
  },

  /**
   * Create a new company
   * POST /api/companies
   * @param {Object} companyData - { name, code, status }
   */
  createCompany: (companyData) => {
    return apiClient(BASE_PATH, {
      method: 'POST',
      body: companyData
    });
  },

  /**
   * Update an existing company
   * PUT /api/companies/:id
   * @param {string|number} id
   * @param {Object} companyData - { name, status }
   */
  updateCompany: (id, companyData) => {
    return apiClient(`${BASE_PATH}/${id}`, {
      method: 'PUT',
      body: companyData
    });
  }
};
