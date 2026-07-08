import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../../shared/utils/toast';
import { useAuth } from '../../../app/providers/AuthProvider';
import axiosClient from '../../../api/axiosClient';

// Material-UI components
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Button from '../../../shared/components/elements/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

// Material-UI icons
import MailOutlineIcon from '@mui/icons-material/MailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import VpnKeyIcon from '@mui/icons-material/VpnKeyOutlined';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password modal states
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP & New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotErrors, setForgotErrors] = useState({});
  const [forgotIsSubmitting, setForgotIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Check for expired session on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session') === 'expired') {
      toast.error('Unauthorized user, please login again', {
        id: 'session-expired', // Prevent duplicate toasts
      });
      // Clean up the URL without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Always redirect to dashboard after login — avoids cross-user URL leakage
  const redirectTo = '/dashboard';                                  

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

  const validate = () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);

    try {
      const result = await login(email.trim(), password);
      
      if (result.success) {
        toast.success('Successfully logged in');
        navigate(redirectTo, { replace: true });
      } else {
        // Handle explicit backend errors passed through context
        if (result.error) {
           const { message, details, statusCode } = result.error;
           
           if (statusCode === 400 && details && Array.isArray(details)) {
              // It's a field validation error
              const newFieldErrors = {};
              details.forEach(err => {
                 newFieldErrors[err.field] = err.message;
              });
              setFieldErrors(newFieldErrors);
              toast.error(message || 'Validation failed');
           } else if (statusCode === 401) {
              // Unauthorized credentials
              toast.error(message || 'Invalid email or password');
           } else {
              // Other server error types mapped by the API
              toast.error(message || 'Login failed from server.');
           }
        } else {
           // Generic fallback if standard message is provided
           toast.error(result.message || 'Invalid credentials. Please try again.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Card
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 384, // max-w-sm (384px)
        overflow: 'hidden',
        animation: 'fadeInZoom 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        '@keyframes fadeInZoom': {
          '0%': {
            opacity: 0,
            transform: 'scale(0.95) translateY(10px)',
          },
          '100%': {
            opacity: 1,
            transform: 'scale(1) translateY(0)',
          },
        },
        p: { xs: 3.5, sm: 4.5 },
      }}
    >
      {/* Top accent bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #FB923C, #F86F03, #F97316)',
        }}
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          mb: 4,
        }}
      >
        <Box
          sx={{
            mt: -1,
            mb: { xs: -1.5, sm: -2.5 },
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <Box
            component="img"
            src="/logos/logo-official.png"
            alt="StackCode Training Institute"
            sx={{
              width: '100%',
              maxWidth: { xs: 200, sm: 230 },
              height: 'auto',
              objectFit: 'contain',
              transition: 'opacity 0.3s ease',
              '&:hover': {
                opacity: 0.9,
              },
            }}
          />
        </Box>
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'text.primary',
            fontFamily: '"Sora", "DM Sans", sans-serif',
            mt: 2,
          }}
        >
          Welcome back
        </Typography>
        <Typography
          variant="overline"
          sx={{
            mt: 1,
            color: 'text.secondary',
            fontWeight: 700,
            letterSpacing: '0.16em',
            fontSize: '10px',
            display: 'block',
          }}
        >
          Sign in to your dashboard
        </Typography>
      </Box>

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3.5,
        }}
      >
        {/* Email Field */}
        <TextField
          fullWidth
          id="login-email"
          name="email"
          type="email"
          label="Email Address"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
          }}
          error={!!fieldErrors.email}
          helperText={fieldErrors.email}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <MailOutlineIcon
                    sx={{
                      fontSize: 18,
                      color: fieldErrors.email ? 'error.main' : 'text.secondary',
                      transition: 'color 0.15s ease',
                    }}
                  />
                </InputAdornment>
              ),
            }
          }}
        />

        {/* Password Field */}
        <TextField
          fullWidth
          id="login-password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="Your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
          }}
          error={!!fieldErrors.password}
          helperText={fieldErrors.password}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon
                    sx={{
                      fontSize: 18,
                      color: fieldErrors.password ? 'error.main' : 'text.secondary',
                      transition: 'color 0.15s ease',
                    }}
                  />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    sx={{
                      color: 'text.secondary',
                      p: 1.5,
                      '&:hover': {
                        backgroundColor: 'rgba(248, 111, 3, 0.08)',
                      },
                    }}
                  >
                    {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            }
          }}
        />

        {/* Forgot password */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            mt: -0.5,
          }}
        >
          <Link
            component="button"
            type="button"
            onClick={handleOpenForgot}
            sx={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'primary.main',
              textDecoration: 'none',
              transition: 'color 0.15s ease-in-out',
              border: 'none',
              background: 'none',
              padding: 0,
              cursor: 'pointer',
              '&:hover': {
                color: 'primary.dark',
              },
            }}
          >
            Forgot password?
          </Link>
        </Box>

        {/* Submit Button */}
        <Button
          type="submit"
          isLoading={isSubmitting}
          variant="contained"
          fullWidth
          size="large"
          endIcon={
            isSubmitting ? null : (
              <ArrowForwardIcon
                sx={{
                  fontSize: 16,
                  transition: 'transform 0.2s ease',
                  '.MuiButton-root:hover &': {
                    transform: 'translateX(4px)',
                  },
                }}
              />
            )
          }
          sx={{
            mt: 1,
            py: 2.5,
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          Sign in
        </Button>
      </Box>
    </Card>

    {/* Forgot Password Dialog */}
    <Dialog
      open={forgotOpen}
      onClose={handleCloseForgot}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1.5,
          position: 'relative',
          overflow: 'hidden'
        }
      }}
    >
      {/* Top accent bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #FB923C, #F86F03, #F97316)',
        }}
      />

      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Sora", "DM Sans", sans-serif' }}>
          {forgotStep === 1 ? 'Reset Password' : 'Verify OTP & Reset'}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleCloseForgot}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ borderTop: '1px solid #F1F5F9', borderBottom: 'none', py: 3 }}>
        {forgotStep === 1 && (
          <Box component="form" noValidate onSubmit={handleForgotEmailSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Enter your registered email address. We will send you a 6-digit One-Time Password (OTP) to reset your password.
            </Typography>
            <TextField
              fullWidth
              id="forgot-email"
              name="forgotEmail"
              type="email"
              label="Email Address"
              placeholder="name@example.com"
              value={forgotEmail}
              onChange={(e) => {
                setForgotEmail(e.target.value);
                if (forgotErrors.email) setForgotErrors((prev) => ({ ...prev, email: null }));
              }}
              error={!!forgotErrors.email}
              helperText={forgotErrors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlineIcon sx={{ fontSize: 18, color: forgotErrors.email ? 'error.main' : 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              isLoading={forgotIsSubmitting}
              variant="contained"
              fullWidth
              size="large"
              sx={{ py: 2 }}
            >
              Send OTP
            </Button>
          </Box>
        )}

        {forgotStep === 2 && (
          <Box component="form" noValidate onSubmit={handleForgotOtpSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="body2" color="text.secondary">
              An OTP has been sent to <strong>{forgotEmail}</strong>. Please enter the 6-digit verification code.
            </Typography>
            
            <TextField
              fullWidth
              id="forgot-otp"
              name="forgotOtp"
              type="text"
              label="6-Digit OTP"
              placeholder="123456"
              value={forgotOtp}
              onChange={(e) => {
                setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                if (forgotErrors.otp) setForgotErrors((prev) => ({ ...prev, otp: null }));
              }}
              error={!!forgotErrors.otp}
              helperText={forgotErrors.otp}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKeyIcon sx={{ fontSize: 18, color: forgotErrors.otp ? 'error.main' : 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button
                type="button"
                variant="outlined"
                fullWidth
                onClick={() => setForgotStep(1)}
                sx={{ py: 2 }}
              >
                Back
              </Button>
              <Button
                type="submit"
                isLoading={forgotIsSubmitting}
                variant="contained"
                fullWidth
                sx={{ py: 2 }}
              >
                Verify OTP
              </Button>
            </Box>
          </Box>
        )}

        {forgotStep === 3 && (
          <Box component="form" noValidate onSubmit={handleForgotPasswordResetSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Your OTP is verified. Please enter your new secure password below.
            </Typography>

            <TextField
              fullWidth
              id="forgot-new-password"
              name="forgotNewPassword"
              type={showForgotNewPassword ? 'text' : 'password'}
              label="New Password"
              placeholder="Min 6 characters"
              value={forgotNewPassword}
              onChange={(e) => {
                setForgotNewPassword(e.target.value);
                if (forgotErrors.password) setForgotErrors((prev) => ({ ...prev, password: null }));
              }}
              error={!!forgotErrors.password}
              helperText={forgotErrors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ fontSize: 18, color: forgotErrors.password ? 'error.main' : 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      edge="end"
                      sx={{ color: 'text.secondary', p: 1 }}
                    >
                      {showForgotNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              id="forgot-confirm-password"
              name="forgotConfirmPassword"
              type={showForgotConfirmPassword ? 'text' : 'password'}
              label="Confirm Password"
              placeholder="Re-enter new password"
              value={forgotConfirmPassword}
              onChange={(e) => {
                setForgotConfirmPassword(e.target.value);
                if (forgotErrors.confirmPassword) setForgotErrors((prev) => ({ ...prev, confirmPassword: null }));
              }}
              error={!!forgotErrors.confirmPassword}
              helperText={forgotErrors.confirmPassword}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ fontSize: 18, color: forgotErrors.confirmPassword ? 'error.main' : 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="button"
                      onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                      edge="end"
                      sx={{ color: 'text.secondary', p: 1 }}
                    >
                      {showForgotConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button
                type="button"
                variant="outlined"
                fullWidth
                onClick={() => setForgotStep(2)}
                sx={{ py: 2 }}
              >
                Back
              </Button>
              <Button
                type="submit"
                isLoading={forgotIsSubmitting}
                variant="contained"
                fullWidth
                sx={{ py: 2 }}
              >
                Reset Password
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};

export default LoginForm;

