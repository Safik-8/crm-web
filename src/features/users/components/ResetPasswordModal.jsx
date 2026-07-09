// src/features/users/components/ResetPasswordModal.jsx

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { X, ShieldAlert, Copy, Check } from 'lucide-react';
import Button from '../../../shared/components/elements/Button';
import { toast } from '../../../shared/utils/toast';

const ResetPasswordModal = ({
  isOpen,
  onClose,
  user = null,
  onConfirm,
  isLoading = false
}) => {
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setTempPassword('');
    setCopied(false);
    onClose();
  };

  const handleConfirm = async () => {
    try {
      const response = await onConfirm(user.id);
      if (response?.tempPassword) {
        setTempPassword(response.tempPassword);
      } else {
        handleClose();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = () => {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    toast.success('Password copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={isLoading ? undefined : handleClose}
      PaperProps={{
        sx: {
          borderRadius: '24px',
          maxWidth: '440px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          margin: '16px'
        }
      }}
    >
      <div className="bg-white p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <h3 className="font-heading font-extrabold text-slate-900 text-lg leading-tight">
            {tempPassword ? 'Temporary Password Generated' : 'Reset User Password'}
          </h3>
          {!isLoading && (
            <button
              onClick={handleClose}
              type="button"
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg p-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Content */}
        {!tempPassword ? (
          <div className="flex flex-col gap-3">
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              Are you sure you want to reset the password for <strong className="text-slate-800 font-bold">{user?.name}</strong> ({user?.email})?
            </p>
            
            <div className="flex items-start gap-2.5 p-3.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-2xl text-xs font-semibold leading-normal">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>This will invalidate all current active sessions for the user and force them to set a new password on their next login.</span>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 mt-2">
              <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} loading={isLoading}>
                Confirm Reset
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              Password has been reset successfully. Please copy the temporary password below and share it securely with <strong className="text-slate-800 font-bold">{user?.name}</strong>:
            </p>

            {/* Password Display Box */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-[15px] font-bold text-slate-800 tracking-wider">
              <span>{tempPassword}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 mt-2">
              <Button onClick={handleClose} className="w-full">
                Close Dialog
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default ResetPasswordModal;
