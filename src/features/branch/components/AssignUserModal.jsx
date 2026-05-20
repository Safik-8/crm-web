import React, { useState, useEffect } from 'react';
import { UserPlus, AlertCircle, Loader2, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { branchApi } from '../api/branchApi';
import { ROLES } from '../../../lib/constants/roles';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ROLE_OPTIONS = [
  { value: ROLES.BRANCH_ADMIN, label: 'Branch Admin' },
  { value: ROLES.MANAGER, label: 'Manager' },
  { value: ROLES.SALES_TEAM, label: 'Sales Team' },
  { value: ROLES.ISE, label: 'ISE' }
];

/**
 * AssignUserModal Component
 * Centered dialog to CREATE a new user and assign to a branch.
 * ⚠️ This does NOT map an existing user — it strictly creates a new one.
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {Object} branch - The branch to assign the user to
 * @param {function} onSuccess - Refetch callback
 */
const AssignUserModal = ({ isOpen, onClose, branch, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleName: 'BRANCH_ADMIN'
  });
  const [errors, setErrors] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setFormData({ name: '', email: '', password: '', roleName: 'BRANCH_ADMIN' });
      setErrors({});
      setShowPassword(false);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted && !isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required.';
    if (!formData.email.trim()) newErrors.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Enter a valid email address.';
    if (!formData.password.trim()) newErrors.password = 'Password is required.';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (!formData.roleName) newErrors.roleName = 'Role selection is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await branchApi.assignUser(branch.id, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        roleName: formData.roleName
      });

      if (response && response.success) {
        toast.success(`User "${formData.name}" created & assigned to ${branch.name}`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(response?.message || 'Failed to assign user');
      }
    } catch (error) {
      if (error && (error.statusCode === 409 || error.status === 409)) {
        setErrors({ email: 'A user with this email already exists.' });
        toast.error('Email is already in use.');
      } else {
        toast.error(error?.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderField = (id, name, label, type = 'text', placeholder = '') => (
    <div className="space-y-3">
      <label htmlFor={id} className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-tight block">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={name === 'password' ? (showPassword ? 'text' : 'password') : type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "w-full px-4 py-4 sm:py-3.5 rounded-2xl border transition-all outline-none font-semibold text-slate-900 placeholder:text-slate-300 placeholder:font-medium text-base sm:text-sm",
            name === 'password' && "pr-12",
            errors[name] ? "border-red-500 bg-red-50/20" : "border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10"
          )}
        />
        {name === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors active:scale-95"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {errors[name] && (
        <div className="flex items-center gap-2 text-red-500 text-sm font-bold mt-3 ml-1 animate-in slide-in-from-top-1 duration-300">
          <AlertCircle size={16} strokeWidth={2.5} />
          {errors[name]}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex items-center justify-center min-h-full p-2 sm:p-4">
        <div
          className={cn(
            "relative w-full max-w-sm sm:max-w-lg bg-white rounded-3xl shadow-2xl transform transition-all duration-300 ease-in-out",
            isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
          )}
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-5 sm:py-6 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <UserPlus size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading tracking-tight leading-tight">Create & Assign User</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1 truncate">
                    Registering to <span className="font-bold text-primary">{branch?.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 flex-shrink-0 active:scale-95"
                title="Close"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-6 space-y-6">
            {renderField('assign-user-name', 'name', 'Full Name', 'text', 'Enter user full name...')}
            {renderField('assign-user-email', 'email', 'Email Address', 'email', 'user@company.com')}
            {renderField('assign-user-password', 'password', 'Password', 'password', 'Minimum 6 characters')}

            {/* Role Dropdown */}
            <div className="space-y-3">
              <label htmlFor="assign-user-role" className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-tight block">Assign Role</label>
              <select
                id="assign-user-role"
                name="roleName"
                value={formData.roleName}
                onChange={handleChange}
                className={cn(
                  "w-full px-4 py-4 sm:py-3.5 rounded-2xl border transition-all outline-none font-bold text-slate-900 bg-white appearance-none cursor-pointer text-base sm:text-sm",
                  errors.roleName ? "border-red-500 bg-red-50/20" : "border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10"
                )}
              >
                {ROLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.roleName && (
                <div className="flex items-center gap-2 text-red-500 text-sm font-bold mt-3 ml-1 animate-in slide-in-from-top-1 duration-300">
                  <AlertCircle size={16} strokeWidth={2.5} />
                  {errors.roleName}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-6 space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-5 sm:py-4 bg-emerald-600 text-white rounded-2xl font-black text-base sm:text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-600/20 disabled:opacity-75 disabled:cursor-not-allowed transform active:scale-95 group overflow-hidden relative"
              >
                {loading ? (
                  <Loader2 size={24} className="sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-white/10 translate-y-full hover:translate-y-0 transition-transform duration-500" />
                    <UserPlus size={20} className="sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    Create & Assign User
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full py-4 sm:py-3 text-slate-400 font-bold text-sm uppercase tracking-widest hover:bg-slate-50 hover:text-slate-600 rounded-2xl transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignUserModal;
