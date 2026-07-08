// src/api/axiosClient.js

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create central Axios instance
const axiosClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Crucial for sending httpOnly session cookies cross-origin
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshingAxios = false;
let failedQueueAxios = [];

const processQueueAxios = (error, token = null) => {
  failedQueueAxios.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueueAxios = [];
};

// Response interceptor for centralized error handling
axiosClient.interceptors.response.use(
  (response) => {
    // Return the custom unified response envelope (e.g. response.data)
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error response exists
    if (error.response) {
      const { status, data } = error.response;
      
      const isLoginRequest = originalRequest.url.includes('/auth/login');
      const isLoginPage = window.location.pathname === '/login';
      const isRefreshRequest = originalRequest.url.includes('/auth/refresh');

      // ── 1. UN-AUTHENTICATED SESSION TIMEOUT (401) ──
      if (status === 401 && !isLoginRequest && !isLoginPage && !isRefreshRequest) {
        if (originalRequest._retry) {
          // Clear window context and redirect to login
          window.location.href = '/login?session=expired';
          return Promise.reject(data || new Error('Session expired'));
        }

        originalRequest._retry = true;

        if (isRefreshingAxios) {
          return new Promise((resolve, reject) => {
            failedQueueAxios.push({ resolve, reject });
          })
            .then(() => {
              return axiosClient(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        isRefreshingAxios = true;

        try {
          await axiosClient.post('/auth/refresh');
          isRefreshingAxios = false;
          processQueueAxios(null);
          return axiosClient(originalRequest);
        } catch (refreshError) {
          isRefreshingAxios = false;
          processQueueAxios(refreshError);
          window.location.href = '/login?session=expired';
          return Promise.reject(refreshError);
        }
      }

      // ── 2. ACCESS FORBIDDEN (403) ──
      if (status === 403 && originalRequest.method && originalRequest.method.toUpperCase() !== 'GET') {
        try {
          const { enhancedToast } = await import('../shared/utils/toast');
          enhancedToast.permissionDenied();
        } catch (e) {
          console.error('[API] Failed to trigger permission alert:', e);
        }
      }

      // Reject with backend error object if formatted
      return Promise.reject(data || error.response);
    }

    // Network / server connection error
    return Promise.reject(error);
  }
);

export default axiosClient;
