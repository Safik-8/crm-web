import { apiClient } from '../../../lib/api/api';

const BASE_PATH = '/branches';

/**
 * Branch API Layer
 * Integrates with http://localhost:5000/api/branches
 */
export const branchApi = {
  /**
   * Fetch all branches for a given company
   * GET /api/branches?company_id=X
   * @param {number} companyId
   */
  getBranches: (companyId) => {
    return apiClient(`${BASE_PATH}?company_id=${companyId}`, { method: 'GET' });
  },

  /**
   * Create a new branch
   * POST /api/branches
   * @param {Object} branchData - { companyId, name, code, status }
   */
  createBranch: (branchData) => {
    return apiClient(BASE_PATH, {
      method: 'POST',
      body: branchData
    });
  },

  /**
   * Update an existing branch
   * PUT /api/branches/:id
   * @param {string|number} id
   * @param {Object} branchData - { name, status } (code & companyId are immutable)
   */
  updateBranch: (id, branchData) => {
    return apiClient(`${BASE_PATH}/${id}`, {
      method: 'PUT',
      body: branchData
    });
  },

  /**
   * Assign (CREATE) a new user to a branch
   * POST /api/branches/:id/assign-user
   * @param {string|number} branchId
   * @param {Object} userData - { name, email, password, roleName }
   */
  assignUser: (branchId, userData) => {
    return apiClient(`${BASE_PATH}/${branchId}/assign-user`, {
      method: 'POST',
      body: userData
    });
  }
};
