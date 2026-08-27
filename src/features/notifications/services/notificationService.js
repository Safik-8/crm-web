/**
 * notificationService
 *
 * All notification API calls are isolated here.
 * Uses apiClient with `silent: true` so the global full-screen loader
 * is NEVER triggered — notifications load inside their own panel/page cleanly.
 */

import { apiClient } from '../../../lib/api/api';

/**
 * Fetch paginated notifications for the current user.
 * @param {{ page?: number, limit?: number, daysLimit?: number, signal?: AbortSignal }} options
 */
export const fetchNotifications = async ({ page = 1, limit = 50, daysLimit = 3, signal } = {}) => {
  return apiClient(`/notifications?page=${page}&limit=${limit}&daysLimit=${daysLimit}`, {
    method: 'GET',
    silent: true,
    signal,
  });
};

/**
 * Fetch older notifications beyond the 3-day default window.
 */
export const fetchOlderNotifications = async ({ page, limit = 50, signal } = {}) => {
  return apiClient(`/notifications?page=${page}&limit=${limit}&daysLimit=0`, {
    method: 'GET',
    silent: true,
    signal,
  });
};

/**
 * Fetch full notification history with filters & search for /notifications page.
 */
export const fetchNotificationHistory = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.priority) query.append('priority', params.priority);
  if (params.moduleName) query.append('moduleName', params.moduleName);
  if (params.search) query.append('search', params.search);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.scope) query.append('scope', params.scope);

  return apiClient(`/notifications?${query.toString()}`, {
    method: 'GET',
    silent: true,
  });
};

/**
 * Mark a single notification as read.
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
 */
export const fetchReminderSummary = async ({ signal } = {}) => {
  return apiClient('/notifications/reminder-summary', {
    method: 'GET',
    silent: true,
    signal,
  });
};

/**
 * Admin: Fetch notification event configurations.
 */
export const fetchNotificationConfigs = async () => {
  return apiClient('/notifications/configs', {
    method: 'GET',
    silent: true,
  });
};

/**
 * Admin: Update notification event configuration channel rules.
 */
export const updateNotificationConfig = async (id, data) => {
  return apiClient(`/notifications/configs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    silent: true,
  });
};
