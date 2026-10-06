// src/api/axiosClient.js

import axios from 'axios';
import { enhancedToast } from '../shared/utils/toast';
import { 
  refreshAuthToken, 
  getAccessToken, 
  setAccessToken, 
  clearAccessToken 
} from '../lib/api/authSession';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create central Axios instance
const axiosClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Sends httpOnly session cookies cross-origin
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach in-memory Bearer token if available
axiosClient.interceptors.request.use(
  (config) => {
    const isRefreshRequest = config.url && config.url.includes('/auth/refresh');
    const token = getAccessToken();
    if (token && !config.headers.Authorization && !isRefreshRequest) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error handling and in-memory token capture
axiosClient.interceptors.response.use(
  (response) => {
    const tokenReceived = response.data?.data?.accessToken || response.data?.accessToken;
    if (tokenReceived) {
      setAccessToken(tokenReceived);
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error response exists
    if (error.response) {
      const { status, data } = error.response;
      
      const isLoginRequest = originalRequest.url && originalRequest.url.includes('/auth/login');
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
      const isRefreshRequest = originalRequest.url && originalRequest.url.includes('/auth/refresh');

      // ── 1. UN-AUTHENTICATED SESSION TIMEOUT (401) ──
      if (status === 401 && !isLoginRequest && !isLoginPage && !isRefreshRequest) {
        if (originalRequest._retry) {
          clearAccessToken();
          window.location.href = '/login?session=expired';
          return Promise.reject(data || new Error('Session expired'));
        }

        originalRequest._retry = true;

        try {
          const newAccessToken = await refreshAuthToken();
          if (newAccessToken) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return axiosClient(originalRequest);
        } catch (refreshError) {
          clearAccessToken();
          window.location.href = '/login?session=expired';
          return Promise.reject(refreshError);
        }
      }

      // ── 2. ACCESS FORBIDDEN (403) ──
      if (status === 403 && originalRequest.method && originalRequest.method.toUpperCase() !== 'GET') {
        enhancedToast.permissionDenied(data?.message);
      }

      return Promise.reject(data || error.response);
    }

    // Network / server connection error
    return Promise.reject(error);
  }
);

export default axiosClient;
