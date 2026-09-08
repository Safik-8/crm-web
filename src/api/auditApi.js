import axiosClient from './axiosClient';

/**
 * Fetches paginated audit logs with search parameters & multi-select filters.
 * GET /api/audit-logs
 */
export const getAuditLogsApi = async (params = {}) => {
  return await axiosClient.get('/audit-logs', { params });
};

/**
 * Fetches single audit log details by ID (including JSON snapshot comparison).
 * GET /api/audit-logs/:id
 */
export const getAuditLogByIdApi = async (id) => {
  return await axiosClient.get(`/audit-logs/${id}`);
};

/**
 * Downloads full audit logs dataset (Super Admin only).
 * GET /api/audit-logs/export
 */
export const exportAuditLogsApi = async (params = {}, format = 'csv') => {
  return await axiosClient.get('/audit-logs/export', {
    params: { ...params, format },
    responseType: 'blob', // Ensures binary file download stream
  });
};
