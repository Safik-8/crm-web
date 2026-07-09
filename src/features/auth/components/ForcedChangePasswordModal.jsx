// src/features/auth/components/ForcedChangePasswordModal.jsx

import React, { useState } from 'react';
import { Lock, LogOut } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { apiClient } from '../../../lib/api/api';
import TextField from '../../../shared/components/elements/TextField';
import Button from '../../../shared/components/elements/Button';
import { toast } from '../../../shared/utils/toast';

const ForcedChangePasswordModal = () => {
  const { user, logout, refetchUser } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Activate only if user is logged in and mustChangePassword is true
  if (!user || !user.mustChangePassword) {
    return null;
  }

  const validate = () => {
    const tempErrors = {};
    if (!currentPassword) {
      tempErrors.currentPassword = 'Current password is required';
    }
    if (!newPassword) {
      tempErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      tempErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (confirmPassword !== newPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await apiClient('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword }
      });

      if (response && response.success) {
        toast.success('Password changed successfully!', {
          description: 'Your new password is now active and verified.'
        });
        await refetchUser(); // Updates mustChangePassword to false, closing modal
      }
    } catch (err) {
      console.error('[ChangePassword] Failed:', err);
      // Map API validation errors or generic errors
      if (err?.details && Array.isArray(err.details)) {
        const fieldErrors = {};
        err.details.forEach(item => {
          fieldErrors[item.field] = item.message;
        });
        setErrors(fieldErrors);
      } else {
        toast.error(err?.message || 'Failed to change password. Please check current credentials.');
        setErrors({ currentPassword: err?.message || 'Invalid credentials' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-8 space-y-6 my-auto animate-in zoom-in-95 duration-200">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
            <Lock size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Password Change Required
            </h2>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed mt-1 px-2">
              For security, you must update your temporary password before you can access the StackCode CRM dashboard.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            id="currentPassword"
            label="Current Temporary Password"
            type="password"
            placeholder="Enter temporary password..."
            value={currentPassword}
            onChange={(val) => {
              setCurrentPassword(val);
              if (errors.currentPassword) setErrors(prev => ({ ...prev, currentPassword: null }));
            }}
            errorText={errors.currentPassword}
            required
          />

          <TextField
            id="newPassword"
            label="New Secure Password"
            type="password"
            placeholder="Min 6 characters..."
            value={newPassword}
            onChange={(val) => {
              setNewPassword(val);
              if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: null }));
            }}
            errorText={errors.newPassword}
            required
          />

          <TextField
            id="confirmPassword"
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter new password..."
            value={confirmPassword}
            onChange={(val) => {
              setConfirmPassword(val);
              if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: null }));
            }}
            errorText={errors.confirmPassword}
            required
          />

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              loading={loading}
              className="w-full h-11"
            >
              Update & Log In
            </Button>
            
            <button
              type="button"
              onClick={() => logout()}
              disabled={loading}
              className="w-full h-10 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              <LogOut size={14} />
              <span>Cancel & Log Out</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ForcedChangePasswordModal;
