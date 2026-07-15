// src/features/teams/services/teamService.js

import axiosClient from '../../../api/axiosClient';

const BASE_PATH = '/teams';

export const teamService = {
  /**
   * Fetches paginated, filtered, and searched teams list.
   */
  getTeams: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page);
    if (params.limit) queryParams.set('limit', params.limit);
    if (params.search) queryParams.set('search', params.search);
    if (params.status) queryParams.set('status', params.status);
    if (params.branchId) queryParams.set('branchId', params.branchId);
    if (params.companyId) queryParams.set('companyId', params.companyId);
    if (params.view) queryParams.set('view', params.view);

    return axiosClient.get(`${BASE_PATH}?${queryParams.toString()}`);
  },

  /**
   * Fetches details of a single team by ID.
   */
  getTeamById: (id) => {
    return axiosClient.get(`${BASE_PATH}/${id}`);
  },

  /**
   * Registers a new team.
   */
  createTeam: (teamData) => {
    return axiosClient.post(BASE_PATH, teamData);
  },

  /**
   * Updates an existing team's parameters.
   */
  updateTeam: (id, teamData) => {
    return axiosClient.put(`${BASE_PATH}/${id}`, teamData);
  },

  /**
   * Toggles the active/inactive status of a team.
   */
  toggleTeamStatus: (id, status) => {
    return axiosClient.patch(`${BASE_PATH}/${id}/status`, { status });
  },

  /**
   * Soft-deletes a team.
   */
  deleteTeam: (id) => {
    return axiosClient.delete(`${BASE_PATH}/${id}`);
  },

  /**
   * Removes an ISE member from a team.
   */
  removeTeamMember: (id, userId) => {
    return axiosClient.delete(`${BASE_PATH}/${id}/members/${userId}`);
  },

  /**
   * Reassigns/replaces the team BDE owner.
   */
  replaceTeamOwner: (id, bdeId) => {
    return axiosClient.put(`${BASE_PATH}/${id}/owner`, { bdeId });
  }
};

