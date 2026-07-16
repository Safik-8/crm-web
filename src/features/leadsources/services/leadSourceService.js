// src/features/leadsources/services/leadSourceService.js

import { apiClient } from '../../../lib/api/api'

export const getLeadSources = (params = {}) => {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      qs.set(key, val)
    }
  })
  const queryString = qs.toString()
  return apiClient(`/lead-sources${queryString ? `?${queryString}` : ''}`, { method: 'GET' })
}

export const createLeadSource = (data) => {
  return apiClient('/lead-sources', { method: 'POST', body: data })
}

export const updateLeadSource = (id, data) => {
  return apiClient(`/lead-sources/${id}`, { method: 'PUT', body: data })
}

export const toggleLeadSourceStatus = (id) => {
  return apiClient(`/lead-sources/${id}/toggle-status`, { method: 'PATCH' })
}
