import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * In-memory storage for the short-lived access token.
 * Never written to localStorage to protect against XSS token theft.
 */
let inMemoryAccessToken = null;

export const getAccessToken = () => inMemoryAccessToken;

export const setAccessToken = (token) => {
  inMemoryAccessToken = token;
  // Proactively clean up any legacy tokens from localStorage to keep storage clean
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch {}
  }
};

export const clearAccessToken = () => {
  inMemoryAccessToken = null;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch {}
  }
};

/**
 * Global singleton promise to ensure only ONE refresh request
 * is made at a time across all concurrent requests.
 */
let refreshPromise = null;

export const refreshAuthToken = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      // Direct call using credentials to send the httpOnly refreshToken cookie
      const response = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newAccessToken = response.data?.data?.accessToken || response.data?.accessToken;
      if (newAccessToken) {
        setAccessToken(newAccessToken);
      }
      return newAccessToken;
    } catch (error) {
      clearAccessToken();
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};
