// src/features/users/services/userService.js

import axiosClient from '../../../api/axiosClient';

const BASE_PATH = '/users';
const PROFILE_PATH = '/profile';

export const userService = {
  /**
   * Fetches paginated, filtered, and searched users list.
   */
  getUsers: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page);
    if (params.limit) queryParams.set('limit', params.limit);
    if (params.search) queryParams.set('search', params.search);
    if (params.status) queryParams.set('status', params.status);
    if (params.companyId) queryParams.set('companyId', params.companyId);
    if (params.branchId) queryParams.set('branchId', params.branchId);
    if (params.roleId) queryParams.set('roleId', params.roleId);
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

    return axiosClient.get(`${BASE_PATH}?${queryParams.toString()}`);
  },

  /**
   * Fetches details of a single user by ID.
   */
  getUserById: (id) => {
    return axiosClient.get(`${BASE_PATH}/${id}`);
  },

  /**
   * Registers a new user.
   */
  createUser: (userData) => {
    return axiosClient.post(BASE_PATH, userData);
  },

  /**
   * Updates an existing user's parameters.
   */
  updateUser: (id, userData) => {
    return axiosClient.put(`${BASE_PATH}/${id}`, userData);
  },

  /**
   * Toggles active/inactive operational status of a user.
   */
  toggleUserStatus: (id, nextStatus) => {
    return axiosClient.patch(`${BASE_PATH}/${id}/status`, { status: nextStatus });
  },

  /**
   * Administratively resets a user's password.
   */
  resetUserPassword: (id) => {
    return axiosClient.post(`${BASE_PATH}/${id}/reset-password`);
  },

  /**
   * Fetches roles this actor is allowed to assign when creating a new user.
   * Requires USER:canCreate — accessible to Branch Managers without ROLE_PERMISSION.
   */
  getAssignableRoles: () => {
    return axiosClient.get(`${BASE_PATH}/assignable-roles`);
  },

};
