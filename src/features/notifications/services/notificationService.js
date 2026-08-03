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
 * @param {{ page?: number, limit?: number, daysLimit?: number, signal?: AbortSignal }} options
 *   daysLimit=3   → past 3 days  (DEFAULT — keeps panel fast and relevant)
 *   daysLimit=0   → all time     (used by "Load Older" infinite scroll)
 */
export const fetchNotifications = async ({ page = 1, limit = 50, daysLimit = 3, signal } = {}) => {
  return apiClient(`/notifications?page=${page}&limit=${limit}&daysLimit=${daysLimit}`, {
    method: 'GET',
    silent: true,   // never touch the global loader
    signal,
  });
};

/**
 * Fetch older notifications beyond the 3-day default window.
 * Passes daysLimit=0 so the backend returns all-time records.
 * @param {{ page: number, limit?: number, signal?: AbortSignal }} options
 */
export const fetchOlderNotifications = async ({ page, limit = 50, signal } = {}) => {
  return apiClient(`/notifications?page=${page}&limit=${limit}&daysLimit=0`, {
    method: 'GET',
    silent: true,
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

/**
 * Delete / clear ALL notifications for the current user.
 */
export const deleteAllNotifications = async () => {
  return apiClient('/notifications/clear-all', {
    method: 'DELETE',
    silent: true,
  });
};

/**
 * Fetch lightweight unread count for the bell badge.
 * Uses no-pagination endpoint — ultra fast.
 */
export const fetchUnreadCount = async ({ signal } = {}) => {
  return apiClient('/notifications/unread-count', {
    method: 'GET',
    silent: true,
    signal,
  });
};

/**
 * Fetch reminder summary counts for dashboard widget.
 * Returns: { todayCount, upcomingCount, overdueCount, total }
 */
export const fetchReminderSummary = async ({ signal } = {}) => {
  return apiClient('/notifications/reminder-summary', {
    method: 'GET',
    silent: true,
    signal,
  });
};

