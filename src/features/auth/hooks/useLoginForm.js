import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../../shared/utils/toast';
import { useAuth } from '../../../app/providers/AuthProvider';
import axiosClient from '../../../api/axiosClient';

/**
 * useLoginForm Hook
 * 
 * Separates concerns by managing all the state, validation logic, and API calls 
 * for the LoginForm presentation component. This keeps the rendering logic clean
 * and scales easily for any future additions to the auth experience.
 * 
 * @returns {object} Hook state and transaction handlers.
 */
export const useLoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // ── Login inputs and states ──────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Forgot password flow states ──────────────────────────────────────────────
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // Steps: 1 = Submit Email, 2 = Verify OTP, 3 = Reset Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotErrors, setForgotErrors] = useState({});
  const [forgotIsSubmitting, setForgotIsSubmitting] = useState(false);

  // Redirect target after successful authorization
  const redirectTo = '/dashboard';

  // ── Helper: Reset all modal states ───────────────────────────────────────────
  const resetForgotState = () => {
    setForgotStep(1);
    setForgotEmail('');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotErrors({});
    setForgotIsSubmitting(false);
  };

  const handleOpenForgot = () => {
    setForgotOpen(true);
    resetForgotState();
  };

  const handleCloseForgot = () => {
    setForgotOpen(false);
  };

  // ── Validation: User Login Inputs ───────────────────────────────────────────
  const validateLogin = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Invalid email format (e.g., name@example.com)';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Action: Handle Login Submission ──────────────────────────────────────────
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;
    
    setIsSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      
      if (result.success) {
        toast.success('Successfully logged in');
        navigate(redirectTo, { replace: true });
      } else {
        // Map backend validation/authorization errors to specific form fields
        if (result.error) {
           const { message, details, statusCode } = result.error;
           
           if (statusCode === 400 && details && Array.isArray(details)) {
              const newFieldErrors = {};
              details.forEach(err => {
                 newFieldErrors[err.field] = err.message;
              });
              setFieldErrors(newFieldErrors);
              toast.error(message || 'Validation failed');
           } else if (statusCode === 401) {
              toast.error(message || 'Invalid email or password');
           } else {
              toast.error(message || 'Login failed from server.');
           }
        } else {
           toast.error(result.message || 'Invalid credentials. Please try again.');
        }
      }
    } catch (err) {
      console.error('Login hook error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Action: Forgot Password - Step 1 (Send OTP to Email) ─────────────────────
  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!forgotEmail) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(forgotEmail)) {
      errors.email = 'Invalid email format';
    }

    setForgotErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setForgotIsSubmitting(true);
    try {
      const response = await axiosClient.post('/auth/forgot-password', {
        email: forgotEmail.trim().toLowerCase()
      });
      toast.success(response.message || 'OTP sent successfully');
      setForgotStep(2);
    } catch (err) {
      console.error(err);
      const msg = err.message || 'Failed to send OTP. Please try again.';
      toast.error(msg);
      if (err.details && Array.isArray(err.details)) {
        const newErrs = {};
        err.details.forEach(d => {
          newErrs[d.field] = d.message;
        });
        setForgotErrors(newErrs);
      } else {
        setForgotErrors({ email: msg });
      }
    } finally {
      setForgotIsSubmitting(false);
    }
  };

  // ── Action: Forgot Password - Step 2 (Verify Received OTP) ───────────────────
  const handleForgotOtpSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!forgotOtp) {
      errors.otp = 'OTP is required';
    } else if (forgotOtp.length !== 6) {
      errors.otp = 'OTP must be exactly 6 digits';
    }

    setForgotErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setForgotIsSubmitting(true);
    try {
      const response = await axiosClient.post('/auth/verify-otp', {
        email: forgotEmail.trim().toLowerCase(),
        otp: forgotOtp.trim()
      });
      toast.success(response.message || 'OTP verified successfully');
      setForgotStep(3);
    } catch (err) {
      console.error(err);
      const msg = err.message || 'Invalid or expired OTP code';
      toast.error(msg);
      setForgotErrors({ otp: msg });
    } finally {
      setForgotIsSubmitting(false);
    }
  };

  // ── Action: Forgot Password - Step 3 (Reset Password with verified OTP) ─────
  const handleForgotPasswordResetSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!forgotNewPassword) {
      errors.password = 'Password is required';
    } else if (forgotNewPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!forgotConfirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (forgotNewPassword !== forgotConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setForgotErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setForgotIsSubmitting(true);
    try {
      const response = await axiosClient.post('/auth/reset-password', {
        email: forgotEmail.trim().toLowerCase(),
        otp: forgotOtp.trim(),
        password: forgotNewPassword
      });
      toast.success(response.message || 'Password reset successful');
      resetForgotState();
      setForgotOpen(false);
    } catch (err) {
      console.error(err);
      const msg = err.message || 'Failed to reset password';
      toast.error(msg);
      if (err.details && Array.isArray(err.details)) {
        const newErrs = {};
        err.details.forEach(d => {
          newErrs[d.field] = d.message;
        });
        setForgotErrors(newErrs);
      } else {
        setForgotErrors({ password: msg });
      }
    } finally {
      setForgotIsSubmitting(false);
    }
  };

  return {
    // Login States
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    fieldErrors,
    setFieldErrors,
    isSubmitting,

    // Forgot Password States
    forgotOpen,
    forgotStep,
    setForgotStep,
    forgotEmail,
    setForgotEmail,
    forgotOtp,
    setForgotOtp,
    forgotNewPassword,
    setForgotNewPassword,
    forgotConfirmPassword,
    setForgotConfirmPassword,
    showForgotNewPassword,
    setShowForgotNewPassword,
    showForgotConfirmPassword,
    setShowForgotConfirmPassword,
    forgotErrors,
    setForgotErrors,
    forgotIsSubmitting,

    // Action Handlers
    handleOpenForgot,
    handleCloseForgot,
    handleLoginSubmit,
    handleForgotEmailSubmit,
    handleForgotOtpSubmit,
    handleForgotPasswordResetSubmit,
  };
};
