import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../app/providers/AuthProvider';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
           const { code, message, details, statusCode } = result.error;
           
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
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-2xl sm:rounded-3xl bg-white p-7 sm:p-9 shadow-[0_8px_40px_rgba(0,0,0,0.10)] ring-1 ring-zinc-200/60 animate-in fade-in zoom-in-95 duration-500">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-orange-400 via-primary to-orange-500 rounded-t-3xl" />

      <div className="flex flex-col items-center text-center">
        <div className="-mt-1 -mb-3 sm:-mb-5 flex justify-center w-full">
          <img
            src="/logos/logo-official.png"
            alt="StackCode Training Institute"
            className="w-full max-w-[200px] sm:max-w-[230px] h-auto object-contain hover:opacity-90 transition-opacity duration-300"
          />
        </div>
        <h2 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-zinc-800 leading-tight font-heading mt-2">
          Welcome back
        </h2>
        <p className="mt-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.16em]">
          Sign in to your dashboard
        </p>
      </div>

      <form className="mt-7 space-y-4" noValidate onSubmit={handleSubmit}>
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.12em]">Email</label>
          <div className="relative">
            <Mail
              size={15}
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                fieldErrors.email ? 'text-red-400' : 'text-zinc-400'
              }`}
            />
            <input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null }));
              }}
              className={`block w-full rounded-xl border py-2.5 pl-9 pr-3 text-[13px] font-medium outline-none transition-all duration-150 ${
                fieldErrors.email
                  ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-400 focus:ring-4 focus:ring-red-500/10 focus:border-red-400'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-orange-100'
              }`}
              placeholder="name@example.com"
            />
          </div>
          {fieldErrors.email && (
            <p className="text-[11px] font-semibold text-red-500 animate-in fade-in slide-in-from-top-1 duration-150">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.12em]">Password</label>
          <div className="relative">
            <Lock
              size={15}
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                fieldErrors.password ? 'text-red-400' : 'text-zinc-400'
              }`}
            />
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
              }}
              className={`block w-full rounded-xl border py-2.5 pl-9 pr-10 text-[13px] font-medium outline-none transition-all duration-150 ${
                fieldErrors.password
                  ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-400 focus:ring-4 focus:ring-red-500/10 focus:border-red-400'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-orange-100'
              }`}
              placeholder="Your password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-[11px] font-semibold text-red-500 animate-in fade-in slide-in-from-top-1 duration-150">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id="remember-me"
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-zinc-300 text-primary focus:ring-primary"
            />
            <span className="text-[12px] font-medium text-zinc-600">Remember me</span>
          </label>
          <a href="#" className="text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors">
            Forgot password?
          </a>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative flex w-full justify-center items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-white shadow-sm shadow-primary/20 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:bg-primary/40 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98] mt-1"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={17} />
          ) : (
            <>
              Sign in
              <ArrowRight size={15} className="translate-x-0 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
