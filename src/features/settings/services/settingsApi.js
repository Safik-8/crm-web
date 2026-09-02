// crm-web/src/features/settings/services/settingsApi.js

import { apiClient } from "../../../lib/api/api"

export const settingsApi = {
  /**
   * Fetch company system settings
   * @param {number|string} [companyId] 
   */
  getSettings: async (companyId) => {
    const query = companyId ? `?companyId=${companyId}` : ""
    const response = await apiClient(`/v1/settings${query}`, { method: "GET" })
    return response?.data?.settings || response?.settings
  },

  /**
   * Update category settings
   * @param {string} category 
   * @param {Object} data 
   * @param {number|string} [companyId]
   */
  updateCategorySettings: async (category, data, companyId) => {
    const query = companyId ? `?companyId=${companyId}` : ""
    const response = await apiClient(`/v1/settings/${category}${query}`, {
      method: "PUT",
      body: data,
    })
    return response?.data?.settings || response?.settings
  },

  /**
   * Reset category settings to defaults
   * @param {string} category 
   * @param {number|string} [companyId]
   */
  resetCategorySettings: async (category, companyId) => {
    const query = companyId ? `?companyId=${companyId}` : ""
    const response = await apiClient(`/v1/settings/reset/${category}${query}`, {
      method: "POST",
      body: {},
    })
    return response?.data?.settings || response?.settings
  },

  /**
   * Send test email using active SMTP settings
   * @param {string} recipient 
   * @param {number|string} [companyId]
   */
  sendTestEmail: async (recipient, companyId) => {
    const payload = { recipient, ...(companyId ? { companyId } : {}) }
    const response = await apiClient("/v1/settings/test-email", {
      method: "POST",
      body: payload,
    })
    return response?.data || response
  },
}
