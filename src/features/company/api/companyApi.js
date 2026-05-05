import { apiClient } from '../../../lib/api/api';

const BASE_PATH = '/companies';

/**
 * Company API Layer
 * Integrates with http://localhost:5000/api/companies
 */
export const companyApi = {
  /**
   * Fetch all companies (legacy – kept for backward compatibility)
   * GET /api/companies
   */
  getCompanies: () => {
    return apiClient(BASE_PATH, { method: 'GET' });
  },

  /**
   * Fetch paginated companies
   * GET /api/companies/paginated?page=1&limit=10&search=&status=&sortBy=createdAt&sortOrder=desc
   * @param {Object} params - Query parameters
   * @param {number} params.page
   * @param {number} params.limit
   * @param {string} params.search
   * @param {string} params.status  - '' | 'ACTIVE' | 'INACTIVE'
   * @param {string} params.sortBy  - 'createdAt' | 'name'
   * @param {string} params.sortOrder - 'asc' | 'desc'
   */
  getPaginatedCompanies: ({ page = 1, limit = 10, search = '', status = '', sortBy = 'createdAt', sortOrder = 'desc' } = {}) => {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (search)    params.set('search', search);
    if (status)    params.set('status', status);
    if (sortBy)    params.set('sortBy', sortBy);
    if (sortOrder) params.set('sortOrder', sortOrder);
    return apiClient(`${BASE_PATH}/paginated?${params.toString()}`, { method: 'GET' });
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
