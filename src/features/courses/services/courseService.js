// src/features/courses/services/courseService.js

import axiosClient from '../../../api/axiosClient';

const BASE_PATH = '/courses';

export const courseService = {
  /**
   * Fetches paginated, filtered, and searched courses list.
   *
   * @param {object} params - Search and filter parameters
   * @returns {Promise<object>} API response details
   */
  getCourses: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page);
    if (params.limit) queryParams.set('limit', params.limit);
    if (params.search) queryParams.set('search', params.search);
    if (params.status) queryParams.set('status', params.status);
    if (params.category) queryParams.set('category', params.category);
    if (params.companyId) queryParams.set('companyId', params.companyId);
    if (params.minPrice) queryParams.set('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.set('maxPrice', params.maxPrice);

    return axiosClient.get(`${BASE_PATH}?${queryParams.toString()}`);
  },

  /**
   * Fetches details of a single course by ID.
   *
   * @param {number|string} id - The ID of the course
   * @returns {Promise<object>} API response details
   */
  getCourseById: (id) => {
    return axiosClient.get(`${BASE_PATH}/${id}`);
  },

  /**
   * Registers a new Course.
   *
   * @param {object} courseData - Course creation payload
   * @returns {Promise<object>} API response details
   */
  createCourse: (courseData) => {
    return axiosClient.post(BASE_PATH, courseData);
  },

  /**
   * Updates an existing course's parameters.
   *
   * @param {number|string} id - Course ID
   * @param {object} courseData - Course fields to update
   * @returns {Promise<object>} API response details
   */
  updateCourse: (id, courseData) => {
    return axiosClient.put(`${BASE_PATH}/${id}`, courseData);
  },

  /**
   * Toggles the active/inactive status of a course.
   *
   * @param {number|string} id - Course ID
   * @param {string} nextStatus - 'ACTIVE' or 'INACTIVE'
   * @returns {Promise<object>} API response details
   */
  toggleStatus: (id, nextStatus) => {
    return axiosClient.patch(`${BASE_PATH}/${id}/status`, { status: nextStatus });
  },

  /**
   * Soft deletes a course catalog record.
   *
   * @param {number|string} id - Course ID
   * @returns {Promise<object>} API response details
   */
  deleteCourse: (id) => {
    return axiosClient.delete(`${BASE_PATH}/${id}`);
  },

  /**
   * Fetches unique course categories inside a company.
   *
   * @param {object} params - Contains companyId
   * @returns {Promise<object>} API response details
   */
  getCoursesCategories: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.companyId) queryParams.set('companyId', params.companyId);
    return axiosClient.get(`${BASE_PATH}/categories?${queryParams.toString()}`);
  }
};

