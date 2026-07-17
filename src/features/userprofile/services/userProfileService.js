// src/features/userprofile/services/userProfileService.js

import axiosClient from '../../../api/axiosClient';

const BASE_PATH = '/user-profile';

export const userProfileService = {
  /**
   * Fetches logged in user's profile details.
   * GET /api/user-profile
   */
  getUserProfile: () => {
    return axiosClient.get(BASE_PATH);
  },

  /**
   * Updates logged in user's profile details.
   * PUT /api/user-profile
   */
  updateUserProfile: (profileData) => {
    return axiosClient.put(BASE_PATH, profileData);
  },

  /**
   * Updates user's password.
   * PUT /api/user-profile/change-password
   */
  changePassword: (passwordData) => {
    return axiosClient.put(`${BASE_PATH}/change-password`, passwordData);
  },

  /**
   * Fetches user's active sessions.
   * GET /api/user-profile/sessions
   */
  getActiveSessions: () => {
    return axiosClient.get(`${BASE_PATH}/sessions`);
  },

  /**
   * Revokes a specific session.
   * DELETE /api/user-profile/sessions/:id
   */
  revokeSession: (id) => {
    return axiosClient.delete(`${BASE_PATH}/sessions/${id}`);
  },

  /**
   * Deactivates the user's account.
   * POST /api/user-profile/deactivate
   */
  deactivateAccount: () => {
    return axiosClient.post(`${BASE_PATH}/deactivate`);
  },

  /**
   * Fetches logged in user's preferences.
   * GET /api/user-profile/preferences
   */
  getUserPreferences: () => {
    return axiosClient.get(`${BASE_PATH}/preferences`);
  },

  /**
   * Updates logged in user's sessionPreferences.
   * PUT /api/user-profile/preferences
   */
  updateUserPreferences: (sessionPreferences) => {
    return axiosClient.put(`${BASE_PATH}/preferences`, { sessionPreferences });
  }
};
