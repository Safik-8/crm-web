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
    <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white backdrop-blur-xl p-8 sm:p-10 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200 border border-slate-100 animate-in fade-in zoom-in duration-700">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary/80 via-primary to-orange-500"></div>
      
      <div className="flex flex-col items-center text-center">
        {/* Using negative bottom margin (-mb-6) specifically to eliminate the massive empty whitespace built into the bottom of the provided PNG image file */}
        <div className="-mt-2 -mb-4 sm:-mb-6 flex justify-center w-full relative group">
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
          <img 
            src="/logos/logo-official.png" 
            alt="StackCode Training Institute" 
            className="relative w-full max-w-[220px] sm:max-w-[250px] h-auto object-contain hover:scale-[1.03] transition-all duration-500 drop-shadow-sm" 
          />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800 leading-tight font-heading mt-2">Welcome Back</h2>
        <p className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-widest">Login to your dashboard</p>
      </div>

      <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit}>
        <div className="space-y-4 rounded-md">
          {/* Email Field */}
          <div className="space-y-1">
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.email ? 'text-red-400' : 'text-slate-400'}`} size={20} />
              <input
                id="login-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null }));
                }}
                className={`block w-full rounded-xl border py-3 pl-10 pr-3 transition-all sm:text-sm font-medium outline-none ${
                  fieldErrors.email 
                    ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-400 focus:ring-4 focus:ring-red-500/10 focus:border-red-500' 
                    : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10'
                }`}
                placeholder="Email address"
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs font-semibold text-red-500 pl-1 animate-in fade-in slide-in-from-top-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.password ? 'text-red-400' : 'text-slate-400'}`} size={20} />
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
                }}
                className={`block w-full rounded-xl border py-3 pl-10 pr-12 transition-all sm:text-sm font-medium outline-none ${
                  fieldErrors.password 
                    ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-400 focus:ring-4 focus:ring-red-500/10 focus:border-red-500' 
                    : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10'
                }`}
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs font-semibold text-red-500 pl-1 animate-in fade-in slide-in-from-top-1">{fieldErrors.password}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-slate-600 cursor-pointer">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Forgot password?
            </a>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative flex w-full justify-center items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:bg-primary/40 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              Sign in <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
