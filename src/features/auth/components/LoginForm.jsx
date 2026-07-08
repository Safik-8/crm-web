import { useLoginForm } from '../hooks/useLoginForm';
import { toast } from '../../../shared/utils/toast';
import { Mail, Lock, Key } from 'lucide-react';

// Material-UI components (Restricted strictly to form fields, interactive button controls, or overlays)
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import TextField from '../../../shared/components/elements/TextField';
import Button from '../../../shared/components/elements/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

// Material-UI icons
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';

/**
 * LoginForm Component
 * Handles the login view and the password reset overlays.
 * Consumes the `useLoginForm` hook for state, validation, and API flow control,
 * and utilizes the custom reusable `TextField` shared component for inputs.
 */
const LoginForm = () => {
  const {
    // Login States
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    fieldErrors,
    isSubmitting,

    // Forgot Password States
    forgotOpen,
    forgotStep,
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
    forgotIsSubmitting,

    // Action Handlers
    handleOpenForgot,
    handleCloseForgot,
    handleLoginSubmit,
    handleForgotEmailSubmit,
    handleForgotOtpSubmit,
    handleForgotPasswordResetSubmit,
  } = useLoginForm();

  return (
    <>
    {/* Card Layout refactored to HTML div with Tailwind CSS */}
    <div className="relative w-full max-w-sm overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-xl p-7 sm:p-9 animate-fade-in-zoom">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600" />

      <div className="flex flex-col items-center text-center mb-8">
        <div className="-mt-3 -mb-6 flex justify-center w-full">
          <img
            src="/logos/logo-official.png"
            alt="StackCode Training Institute"
            className="w-full max-w-[200px] sm:max-w-[230px] h-auto object-contain transition-opacity duration-300 hover:opacity-90"
          />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 font-sora mt-4">
          Welcome back
        </h2>
        <span className="mt-1 text-[10px] text-gray-500 font-bold uppercase tracking-widest block">
          Sign in to your dashboard
        </span>
      </div>

      <form noValidate onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
        {/* Email Field */}
        <TextField
          id="login-email"
          label="Email Address"
          placeholder="name@example.com"
          value={email}
          onChange={setEmail}
          errorText={fieldErrors.email}
          startIcon={Mail}
        />

        {/* Password Field */}
        <TextField
          id="login-password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="Your password"
          value={password}
          onChange={setPassword}
          errorText={fieldErrors.password}
          startIcon={Lock}
          endIcon={
            <InputAdornment position="end" sx={{ pr: 0.5 }}>
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
          }
        />

        {/* Forgot password */}
        <div className="flex items-center justify-end -mt-1">
          <button
            type="button"
            onClick={handleOpenForgot}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors duration-150 cursor-pointer bg-none border-none p-0"
          >
            Forgot password?
          </button>
        </div>

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
          }}
        >
          Sign in
        </Button>
      </form>
    </div>

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
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600" />

      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="text-lg font-bold text-gray-900 font-sora">
          {forgotStep === 1 ? 'Reset Password' : 'Verify OTP & Reset'}
        </h3>
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
          <form noValidate onSubmit={handleForgotEmailSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-gray-500 leading-relaxed">
              Enter your registered email address. We will send you a 6-digit One-Time Password (OTP) to reset your password.
            </p>
            <TextField
              id="forgot-email"
              type="email"
              label="Email Address"
              placeholder="name@example.com"
              value={forgotEmail}
              onChange={setForgotEmail}
              errorText={forgotErrors.email}
              startIcon={Mail}
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
          </form>
        )}

        {forgotStep === 2 && (
          <form noValidate onSubmit={handleForgotOtpSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-gray-500 leading-relaxed">
              An OTP has been sent to <strong>{forgotEmail}</strong>. Please enter the 6-digit verification code.
            </p>
            
            <TextField
              id="forgot-otp"
              type="text"
              label="6-Digit OTP"
              placeholder="123456"
              value={forgotOtp}
              onChange={(val) => setForgotOtp(val.replace(/\D/g, '').slice(0, 6))}
              errorText={forgotErrors.otp}
              startIcon={Key}
            />

            <div className="flex gap-4 mt-2">
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
            </div>
          </form>
        )}

        {forgotStep === 3 && (
          <form noValidate onSubmit={handleForgotPasswordResetSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-gray-500 leading-relaxed">
              Your OTP is verified. Please enter your new secure password below.
            </p>

            <TextField
              id="forgot-new-password"
              type={showForgotNewPassword ? 'text' : 'password'}
              label="New Password"
              placeholder="Min 6 characters"
              value={forgotNewPassword}
              onChange={setForgotNewPassword}
              errorText={forgotErrors.password}
              startIcon={Lock}
              endIcon={
                <InputAdornment position="end" sx={{ pr: 0.5 }}>
                  <IconButton
                    type="button"
                    onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                    edge="end"
                    sx={{ color: 'text.secondary', p: 1 }}
                  >
                    {showForgotNewPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                  </IconButton>
                </InputAdornment>
              }
            />

            <TextField
              id="forgot-confirm-password"
              type={showForgotConfirmPassword ? 'text' : 'password'}
              label="Confirm Password"
              placeholder="Re-enter new password"
              value={forgotConfirmPassword}
              onChange={setForgotConfirmPassword}
              errorText={forgotErrors.confirmPassword}
              startIcon={Lock}
              endIcon={
                <InputAdornment position="end" sx={{ pr: 0.5 }}>
                  <IconButton
                    type="button"
                    onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                    edge="end"
                    sx={{ color: 'text.secondary', p: 1 }}
                  >
                    {showForgotConfirmPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                  </IconButton>
                </InputAdornment>
              }
            />

            <div className="flex gap-4 mt-2">
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
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};

export default LoginForm;
