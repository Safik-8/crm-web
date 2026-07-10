import { apiClient } from '../../../lib/api/api';

const BASE_PATH = '/roles';

export const roleApi = {
  getRoles: ({ page = 1, limit = 100, search = '', status = '', companyId = '' } = {}, options = {}) => {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (companyId) params.set('companyId', companyId);
    return apiClient(`${BASE_PATH}?${params.toString()}`, { method: 'GET', ...options });
  },

  getRole: (id) => {
    return apiClient(`${BASE_PATH}/${id}`, { method: 'GET' });
  },

  getRoleUsers: (id) => {
    return apiClient(`${BASE_PATH}/${id}/users`, { method: 'GET' });
  },

  createRole: (roleData) => {
    return apiClient(BASE_PATH, {
      method: 'POST',
      body: roleData
    });
  },

  updateRole: (id, roleData) => {
    return apiClient(`${BASE_PATH}/${id}`, {
      method: 'PUT',
      body: roleData
    });
  },

  deleteRole: (id, reassignRoleId) => {
    const url = reassignRoleId ? `${BASE_PATH}/${id}?reassignRoleId=${reassignRoleId}` : `${BASE_PATH}/${id}`;
    return apiClient(url, {
      method: 'DELETE'
    });
  },

  toggleRoleStatus: (id) => {
    return apiClient(`${BASE_PATH}/${id}/status`, {
      method: 'PATCH'
    });
  }
};
