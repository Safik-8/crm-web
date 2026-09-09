import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Global singleton promise to ensure only ONE refresh request
 * is made at a time across all HTTP clients (fetch / axios / concurrent components).
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
      if (newAccessToken && typeof window !== 'undefined') {
        localStorage.setItem('accessToken', newAccessToken);
      }
      return newAccessToken;
    } catch (error) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};
