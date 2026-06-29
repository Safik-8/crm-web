import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../../shared/utils/toast';
import { useAuth } from '../../../app/providers/AuthProvider';

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

// Material-UI icons
import {
  MailOutlined as MailOutlineIcon,
  LockOutlined as LockOutlinedIcon,
  Visibility,
  VisibilityOff,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
          InputProps={{
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
          InputProps={{
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
          }}
        />

        {/* Remember me + Forgot password */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: -0.5,
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                id="remember-me"
                size="small"
                sx={{
                  color: '#CBD5E1',
                  '&.Mui-checked': {
                    color: 'primary.main',
                  },
                }}
              />
            }
            label={
              <Typography
                variant="body2"
                sx={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'text.secondary',
                  userSelect: 'none',
                }}
              >
                Remember me
              </Typography>
            }
            sx={{ m: 0 }}
          />
          <Link
            href="#"
            sx={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'primary.main',
              textDecoration: 'none',
              transition: 'color 0.15s ease-in-out',
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
  );
};

export default LoginForm;

