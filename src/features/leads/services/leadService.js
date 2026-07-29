import { apiClient } from '../../../lib/api/api';

/**
 * Fetch all dropdown options needed for Lead creation/edit forms.
 * Returns: sources, courses, statuses, and branch users.
 * 
 * @returns {Promise<object>}
 */
export const getLeadFormData = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      qs.set(k, v);
    }
  });
  return apiClient(`/leads/form-data${qs.toString() ? `?${qs.toString()}` : ''}`, { method: 'GET' });
};

/**
 * Fetch active users in the branch (kept for backward compatibility with Kanban).
 * 
 * @returns {Promise<object>}
 */
export const getBranchUsers = () =>
  apiClient('/leads/branch-users', { method: 'GET' });

/**
 * Fetch leads list with query filters, search, sorting, and pagination.
 * 
 * @param {object} params - query options
 * @returns {Promise<object>}
 */
export const getLeads = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      qs.set(k, v);
    }
  });
  return apiClient(`/leads?${qs.toString()}`, { method: 'GET' });
};

/**
 * Fetch detailed view of a single lead by ID (includes comments and notes).
 * 
 * @param {number|string} leadId
 * @returns {Promise<object>}
 */
export const getLeadById = (leadId) =>
  apiClient(`/leads/${leadId}`, { method: 'GET' });

/**
 * Create a new lead record manually.
 * 
 * @param {object} data
 * @returns {Promise<object>}
 */
export const createLead = (data) =>
  apiClient('/leads', { method: 'POST', body: data });

/**
 * Update an existing lead record.
 * 
 * @param {number|string} leadId
 * @param {object} data
 * @returns {Promise<object>}
 */
export const updateLead = (leadId, data) =>
  apiClient(`/leads/${leadId}`, { method: 'PUT', body: data });

/**
 * Soft delete a lead record.
 * 
 * @param {number|string} leadId
 * @returns {Promise<object>}
 */
export const deleteLead = (leadId) =>
  apiClient(`/leads/${leadId}`, { method: 'DELETE' });

export const deleteAllLeads = () =>
  apiClient('/leads/temp-delete-all', { method: 'DELETE' });

/**
 * Update the Kanban pipeline stage of a lead (drag-and-drop).
 * Optionally pass reason (required when moving to LOST stage).
 * 
 * @param {number|string} leadId
 * @param {number|string} stageId
 * @param {string|null} reason - required for LOST stage
 * @returns {Promise<object>}
 */
export const updateLeadStage = (leadId, stageId, reason = null) =>
  apiClient(`/leads/${leadId}/stage`, {
    method: 'PATCH',
    body: { stageId, ...(reason ? { reason } : {}) },
    silent: true,
  });


/**
 * Get comment thread for a specific lead.
 * 
 * @param {number|string} leadId
 * @returns {Promise<object>}
 */
export const getLeadComments = (leadId) =>
  apiClient(`/leads/${leadId}/comments`, { method: 'GET' });

/**
 * Add a new comment to a lead's comment thread.
 * 
 * @param {number|string} leadId
 * @param {string} comment
 * @returns {Promise<object>}
 */
export const addLeadComment = (leadId, comment) =>
  apiClient(`/leads/${leadId}/comments`, { method: 'POST', body: { comment } });

/**
 * Bulk import leads from an uploaded Excel/CSV file (Preview mode).
 * 
 * @param {FormData} formData
 * @returns {Promise<object>}
 */
export const importLeadsPreview = (formData) =>
  apiClient('/leads/import-excel?preview=true', {
    method: 'POST',
    body: formData,
  });

/**
 * Bulk import leads from an uploaded Excel/CSV file (Commit mode).
 * 
 * @param {FormData} formData
 * @returns {Promise<object>}
 */
export const importLeadsCommit = (formData) =>
  apiClient('/leads/import-excel?preview=false', {
    method: 'POST',
    body: formData,
  });

/**
 * Restore a soft-deleted lead.
 * 
 * @param {number|string} leadId
 * @returns {Promise<object>}
 */
export const restoreLead = (leadId) =>
  apiClient(`/leads/${leadId}/restore`, { method: 'PATCH' });

/**
 * Fetch lead activity timeline.
 * 
 * @param {number|string} leadId
 * @returns {Promise<object>}
 */
export const getLeadTimeline = (leadId) =>
  apiClient(`/leads/${leadId}/timeline`, { method: 'GET' });

/**
 * Fetch notes list for a specific lead.
 * 
 * @param {number|string} leadId
 * @returns {Promise<object>}
 */
export const getLeadNotes = (leadId) =>
  apiClient(`/leads/${leadId}/notes`, { method: 'GET' });

/**
 * Create a new note on a lead.
 * 
 * @param {number|string} leadId
 * @param {object} data
 * @returns {Promise<object>}
 */
export const createLeadNote = (leadId, data) =>
  apiClient(`/leads/${leadId}/notes`, { method: 'POST', body: data });

/**
 * Update an existing note on a lead.
 * 
 * @param {number|string} leadId
 * @param {number|string} noteId
 * @param {object} data
 * @returns {Promise<object>}
 */
export const updateLeadNote = (leadId, noteId, data) =>
  apiClient(`/leads/${leadId}/notes/${noteId}`, { method: 'PUT', body: data });

/**
 * Delete a note on a lead.
 * 
 * @param {number|string} leadId
 * @param {number|string} noteId
 * @returns {Promise<object>}
 */
export const deleteLeadNote = (leadId, noteId) =>
  apiClient(`/leads/${leadId}/notes/${noteId}`, { method: 'DELETE' });

/**
 * Assign leads (manual or bulk) to a team and/or user.
 * 
 * @param {object} data - { leadIds: number[], teamId?: number, assignedToId?: number, notes?: string, reason?: string }
 * @returns {Promise<object>}
 */
export const assignLeads = (data) =>
  apiClient('/leads/assign', { method: 'POST', body: data });


/**
 * Fetch the full pipeline stage movement history for a lead.
 * 
 * @param {number|string} leadId
 * @returns {Promise<object>}
 */
export const getLeadPipelineHistory = (leadId) =>
  apiClient(`/leads/${leadId}/pipeline-history`, { method: 'GET' });
