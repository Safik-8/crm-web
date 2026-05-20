import { useEffect, useRef } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

/**
 * Enterprise-grade confirmation modal for global stage deletion.
 *
 * Props:
 *  stage      - { id, name } — stage to delete
 *  onConfirm  - () => void
 *  onCancel   - () => void
 *  isDeleting - bool — show spinner while API call is in-flight
 */
const DeleteStageModal = ({ stage, onConfirm, onCancel, isDeleting = false }) => {
  const cancelBtnRef = useRef(null);

  // Focus cancel by default — safe default for destructive dialogs
  useEffect(() => {
    const t = setTimeout(() => cancelBtnRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  // Escape key closes
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && !isDeleting) onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel, isDeleting]);

  if (!stage) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-stage-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => !isDeleting && onCancel()}
      />

      {/* Dialog card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
        {/* Red accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-red-400 to-red-500" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-500" strokeWidth={2.5} />
            </div>
            <div>
              <h2 id="delete-stage-title" className="text-base font-bold text-slate-900">Delete Stage</h2>
              <p className="text-sm text-slate-500 mt-0.5">This action cannot be undone</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !isDeleting && onCancel()}
            disabled={isDeleting}
            className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-40"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 space-y-4">
          <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3.5 space-y-2">
            <p className="text-sm text-slate-600 leading-relaxed">
              You are about to permanently delete{' '}
              <span className="font-bold text-slate-900">"{stage.name}"</span>.
            </p>
            <p className="text-sm text-slate-500 leading-relaxed">
              This stage will be removed globally across all pipelines — but only if no leads are currently using it.
            </p>
          </div>

          <div className="flex items-start gap-2 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              If this stage has active leads, the deletion will be blocked. Move or delete those leads first.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              ref={cancelBtnRef}
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold
                text-slate-600 hover:bg-slate-50 hover:border-slate-300
                disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                bg-red-500 hover:bg-red-600 text-white text-sm font-bold
                shadow-sm shadow-red-200 disabled:opacity-60 disabled:cursor-not-allowed
                transition-all active:scale-[0.98]"
            >
              {isDeleting ? (
                <><Loader2 size={14} className="animate-spin" /> Deleting…</>
              ) : (
                <><AlertTriangle size={14} strokeWidth={2.5} /> Delete Stage</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteStageModal;
