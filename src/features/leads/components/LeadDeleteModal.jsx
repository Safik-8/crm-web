import { useState, useEffect } from 'react';
import { X, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { deleteLead } from '../services/leadService';
import { toast } from '../../../shared/utils/toast';

/**
 * LeadDeleteModal — Confirmation dialog before deleting a lead.
 *
 * Permission gate: caller must only render this when user has LEAD.canCreate === true.
 *
 * On success: calls onDeleted(leadId) so parent can remove the card from local state
 *             without resetting board filters/search/sort.
 * On 404: treats as already deleted — removes card and shows a soft warning.
 */
const LeadDeleteModal = ({ lead, onClose, onDeleted }) => {
  const [busy, setBusy] = useState(false);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Keyboard: Escape to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteLead(lead.id);
      toast.success(`"${lead.name}" has been removed from the pipeline`);
      onDeleted(lead.id);
      onClose();
    } catch (err) {
      // 404 → lead already gone; remove from UI gracefully
      if (err?.statusCode === 404 || err?.status === 404) {
        toast.warning('Lead was already removed');
        onDeleted(lead.id);
        onClose();
        return;
      }
      toast.error(err?.message || 'Failed to delete lead. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[3px] p-3 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] w-full max-w-sm animate-in fade-in zoom-in-95 duration-250 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-lead-title"
        aria-describedby="delete-lead-desc"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 border border-red-100 shrink-0">
              <Trash2 size={15} className="text-red-500" />
            </div>
            <h2
              id="delete-lead-title"
              className="text-[15px] sm:text-[16px] font-semibold font-heading text-zinc-900 tracking-tight"
            >
              Delete lead?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex items-center justify-center w-8 h-8 rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors disabled:opacity-40 shrink-0"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-5">
          {/* Warning banner */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100 mb-5">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p
              id="delete-lead-desc"
              className="text-[12px] font-medium text-red-700 leading-relaxed"
            >
              Lead{' '}
              <span className="font-bold">"{lead.name}"</span>{' '}
              will be removed from the pipeline. This action cannot be undone.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-[13px] font-semibold text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-bold shadow-sm shadow-red-500/20 hover:bg-red-600 disabled:opacity-60 transition-all duration-150 active:scale-[0.98]"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={13} />}
              {busy ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDeleteModal;
