// src/shared/components/elements/ConfirmModal.jsx

import React from 'react';
import { Dialog } from '@mui/material';
import { X, AlertTriangle } from 'lucide-react';

/**
 * ConfirmModal
 * A reusable, premium confirmation dialog block.
 * Wraps the MUI Dialog for transition lifecycles, but styles layout and actions using Tailwind CSS.
 * 
 * Supports:
 * - Warning highlights
 * - Color typing: 'error' (danger red), 'success' (emerald), 'info' (brand orange)
 * - Custom button actions
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  title,
  message,
  warningMessage,
  onConfirm,
  confirmText = 'Yes, Confirm',
  cancelText = 'Cancel',
  loadingText,
  type = 'info', // 'info' | 'error' | 'success'
  isLoading = false,
  children
}) => {
  const isDanger = type === 'error';
  const isSuccess = type === 'success';
  const displayLoadingText = loadingText || (confirmText !== 'Yes, Confirm' ? confirmText : 'Processing...');

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
      PaperProps={{
        sx: {
          borderRadius: '24px',
          maxWidth: '480px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          margin: '16px'
        }
      }}
    >
      <div className="bg-white p-6 flex flex-col gap-4">
        {/* Header Title with X Close Button */}
        <div className="flex justify-between items-start gap-4">
          <h3 id="confirm-modal-title" className="font-heading font-extrabold text-slate-900 text-lg leading-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            type="button"
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg p-1.5 transition-all active:scale-95 cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Message Content */}
        <div className="flex flex-col gap-3">
          <p id="confirm-modal-description" className="text-slate-500 font-medium text-sm leading-relaxed">
            {message}
          </p>

          {warningMessage && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-xs font-semibold leading-normal">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{warningMessage}</span>
            </div>
          )}

          {children}
        </div>

        {/* Footer Action Buttons */}
        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 bg-white font-bold text-[13px] px-5 py-2.5 transition-all hover:bg-slate-50 hover:border-slate-300 cursor-pointer select-none"
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 justify-center rounded-xl font-bold text-[13px] px-5 py-2.5 text-white transition-all shadow-sm cursor-pointer select-none ${
              isDanger
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-100 hover:shadow-md'
                : isSuccess
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 hover:shadow-md'
                : 'bg-primary hover:bg-[#E06202] shadow-orange-100 hover:shadow-md'
            } ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isLoading && (
              <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? displayLoadingText : confirmText}
          </button>

        </div>
      </div>
    </Dialog>
  );
};

export default ConfirmModal;
