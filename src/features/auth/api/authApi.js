import { apiClient } from '../../../lib/api/api';

/**
 * Auth API Service
 * Handles password reset OTP flows:
 *   1. Send OTP (Forgot Password request)
 *   2. Verify OTP
 *   3. Reset Password with verified OTP session
 */
export const authApi = {
  /**
   * Step 1: Send OTP to the specified email address
   * POST /api/auth/forgot-password
   * @param {string} email
   */
  forgotPassword: (email) => {
    return apiClient('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  },

  /**
   * Step 2: Verify the 6-digit OTP code sent via email
   * POST /api/auth/verify-otp
   * @param {string} email
   * @param {string} otp
   */
  verifyOtp: (email, otp) => {
    return apiClient('/auth/verify-otp', {
      method: 'POST',
      body: { email, otp },
    });
  },

  /**
   * Step 3: Set a new password using the verified OTP session
   * POST /api/auth/reset-password
   * @param {string} email
   * @param {string} otp
   * @param {string} newPassword
   */
  resetPassword: (email, otp, newPassword) => {
    return apiClient('/auth/reset-password', {
      method: 'POST',
      body: { email, otp, newPassword },
    });
  },
};
