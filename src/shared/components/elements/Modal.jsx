import React from 'react';
import { Dialog } from '@mui/material';
import { X } from 'lucide-react';

const Modal = ({
  isOpen = false,
  onClose,
  title,
  subtitle,
  children,
  actions,
  maxWidth = 'md',
}) => {
  const widthMap = {
    sm: '480px',
    md: '720px',
    lg: '960px',
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 20px 45px -12px rgba(15, 23, 42, 0.2)',
          width: '100%',
          maxWidth: widthMap[maxWidth] || widthMap.md,
          m: 2, // Ensure it has some margin on small screens
        },
      }}
    >
      <div className="bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {actions && <div className="border-t border-slate-200 px-6 py-4">{actions}</div>}
      </div>
    </Dialog>
  );
};

export default Modal;
