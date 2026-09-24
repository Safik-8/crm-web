import { apiClient } from '../../../lib/api/api'

export const feedbackService = {
  submitFeedback: (data) =>
    apiClient('/feedback', { method: 'POST', body: data }),

  getFeedbacks: () =>
    apiClient('/feedback', { method: 'GET' }),

  getFeedbackById: (id) =>
    apiClient(`/feedback/${id}`, { method: 'GET' }),

  updateFeedbackStatus: (id, status) =>
    apiClient(`/feedback/${id}/status`, { method: 'PATCH', body: { status } }),

  deleteFeedback: (id) =>
    apiClient(`/feedback/${id}`, { method: 'DELETE' }),
}
