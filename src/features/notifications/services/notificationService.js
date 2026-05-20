/**
 * notificationService
 *
 * All notification API calls are isolated here.
 * Uses apiClient with `silent: true` so the global full-screen loader
 * is NEVER triggered — notifications load inside their own panel only.
 */

import { apiClient } from '../../../lib/api/api';

/**
 * Fetch paginated notifications for the current user.
 * @param {{ page?: number, limit?: number, signal?: AbortSignal }} options
 */
export const fetchNotifications = async ({ page = 1, limit = 20, signal } = {}) => {
  return apiClient(`/notifications?page=${page}&limit=${limit}`, {
    method: 'GET',
    silent: true,   // never touch the global loader
    signal,
  });
};

/**
 * Mark a single notification as read.
 * @param {string} id
 */
export const markNotificationRead = async (id) => {
  return apiClient(`/notifications/${id}/read`, {
    method: 'PATCH',
    silent: true,
  });
};

/**
 * Mark ALL notifications as read.
 */
export const markAllNotificationsRead = async () => {
  return apiClient('/notifications/read-all', {
    method: 'PATCH',
    silent: true,
  });
};

/**
 * Delete / dismiss a single notification.
 * @param {string} id
 */
export const deleteNotification = async (id) => {
  return apiClient(`/notifications/${id}`, {
    method: 'DELETE',
    silent: true,
  });
};
