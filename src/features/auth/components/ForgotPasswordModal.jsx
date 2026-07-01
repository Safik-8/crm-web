import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  MailOutlined as MailIcon,
  LockOutlined as LockIcon,
  Visibility,
  VisibilityOff,
  Close as CloseIcon,
  VpnKeyOutlined as KeyIcon,
} from '@mui/icons-material';
import Button from '../../../shared/components/elements/Button';
import { authApi } from '../api/authApi';
import { toast } from '../../../shared/utils/toast';

/**
 * ForgotPasswordModal
 * Handles the 3-step OTP-based password reset flow:
 *   1. Send OTP: User enters email, server sends a 6-digit code.
 *   2. Verify OTP: User enters the code, server checks it.
 *   3. Reset Password: User enters and confirms their new password.
 */
const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP, 3: Reset Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Mutations
  const forgotPasswordMutation = useMutation({
    mutationFn: (emailVal) => authApi.forgotPassword(emailVal),
    onSuccess: (response) => {
      if (response && response.success) {
        toast.success(response.message || 'OTP code sent to your email.');
        setStep(2);
      } else {
        toast.error(response?.message || 'Failed to send OTP code.');
        setErrors({ email: response?.message || 'Failed to send OTP.' });
      }
    },
    onError: (err) => {
      const msg = err?.message || 'Account not found or server error.';
      toast.error(msg);
      setErrors({ email: msg });
    }
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ emailVal, otpVal }) => authApi.verifyOtp(emailVal, otpVal),
    onSuccess: (response) => {
      if (response && response.success) {
        toast.success(response.message || 'OTP verified successfully.');
        setStep(3);
      } else {
        toast.error(response?.message || 'Invalid OTP code.');
        setErrors({ otp: response?.message || 'Invalid verification code.' });
      }
    },
    onError: (err) => {
      const msg = err?.message || 'Verification failed. Please check the code.';
      toast.error(msg);
      setErrors({ otp: msg });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ emailVal, otpVal, passwordVal }) => authApi.resetPassword(emailVal, otpVal, passwordVal),
    onSuccess: (response) => {
      if (response && response.success) {
        toast.success(response.message || 'Password reset successfully.');
        handleClose();
      } else {
        toast.error(response?.message || 'Password reset failed.');
      }
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to reset password.');
    }
  });

  const loading = forgotPasswordMutation.isPending || verifyOtpMutation.isPending || resetPasswordMutation.isPending;

  const handleClose = () => {
    // Reset all states on close
    setStep(1);
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    onClose();
  };

  const validateEmail = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(email)) {
      errs.email = 'Enter a valid email address.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateOtp = () => {
    const errs = {};
    if (!otp) {
      errs.otp = 'Verification code is required.';
    } else if (otp.trim().length !== 6) {
      errs.otp = 'Verification code must be 6 digits.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validatePassword = () => {
    const errs = {};
    if (!newPassword) {
      errs.newPassword = 'Password is required.';
    } else if (newPassword.length < 6) {
      errs.newPassword = 'Password must be at least 6 characters.';
    }

    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 1: Request OTP Code
  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!validateEmail()) return;
    forgotPasswordMutation.mutate(email.trim());
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!validateOtp()) return;
    verifyOtpMutation.mutate({ emailVal: email.trim(), otpVal: otp.trim() });
  };

  // Step 3: Reset Password
  const handleResetPassword = (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    resetPasswordMutation.mutate({ emailVal: email.trim(), otpVal: otp.trim(), passwordVal: newPassword });
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          p: 1.5,
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Sora", "DM Sans", sans-serif', color: 'text.primary' }}>
          Reset Password
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            color: 'text.secondary',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
          }}
        >
          <CloseIcon size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2, pb: 1 }}>
        {/* Step Indicators */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Box sx={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: step >= 1 ? 'primary.main' : '#E2E8F0' }} />
          <Box sx={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: step >= 2 ? 'primary.main' : '#E2E8F0' }} />
          <Box sx={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: step >= 3 ? 'primary.main' : '#E2E8F0' }} />
        </Box>

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <Box component="form" onSubmit={handleSendOtp} noValidate>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontWeight: 500 }}>
              Enter your email address and we'll send you a 6-digit verification code to reset your password.
            </Typography>
            <TextField
              fullWidth
              autoFocus
              id="reset-email"
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({});
              }}
              error={!!errors.email}
              helperText={errors.email}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailIcon sx={{ fontSize: 18, color: errors.email ? 'error.main' : 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        )}

        {/* STEP 2: Verify OTP Code */}
        {step === 2 && (
          <Box component="form" onSubmit={handleVerifyOtp} noValidate>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontWeight: 500 }}>
              We've sent a 6-digit code to <strong style={{ color: '#1E293B' }}>{email}</strong>. Please enter it below.
            </Typography>
            <TextField
              fullWidth
              autoFocus
              id="reset-otp"
              label="Verification Code"
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                if (errors.otp) setErrors({});
              }}
              error={!!errors.otp}
              helperText={errors.otp}
              slotProps={{
                htmlInput: { maxLength: 6, style: { textAlign: 'center', letterSpacing: '8px', fontSize: '18px', fontWeight: 700 } },
                input: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mr: -1 }}>
                      <KeyIcon sx={{ fontSize: 18, color: errors.otp ? 'error.main' : 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Typography
                variant="body2"
                onClick={handleSendOtp}
                sx={{
                  color: 'primary.main',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Resend code
              </Typography>
            </Box>
          </Box>
        )}

        {/* STEP 3: Enter New Password */}
        {step === 3 && (
          <Box component="form" onSubmit={handleResetPassword} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
              OTP verified! Please set a secure new password for your account.
            </Typography>
            <TextField
              fullWidth
              autoFocus
              id="reset-new-password"
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: null }));
              }}
              error={!!errors.newPassword}
              helperText={errors.newPassword}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ fontSize: 18, color: errors.newPassword ? 'error.main' : 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              fullWidth
              id="reset-confirm-password"
              label="Confirm New Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
              }}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ fontSize: 18, color: errors.confirmPassword ? 'error.main' : 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button variant="outlined" onClick={handleClose} disabled={loading} sx={{ mr: 1, px: 3 }}>
          Cancel
        </Button>
        
        {step === 1 && (
          <Button variant="contained" onClick={handleSendOtp} isLoading={loading} sx={{ px: 4 }}>
            Send OTP
          </Button>
        )}
        
        {step === 2 && (
          <Button variant="contained" onClick={handleVerifyOtp} isLoading={loading} sx={{ px: 4 }}>
            Verify Code
          </Button>
        )}
        
        {step === 3 && (
          <Button variant="contained" onClick={handleResetPassword} isLoading={loading} sx={{ px: 4 }}>
            Reset Password
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ForgotPasswordModal;
