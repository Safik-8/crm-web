import React, { useState, useEffect, useRef } from 'react';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';

/**
 * LostReasonModal — Intercepts a Kanban drag to a LOST stage and forces the
 * user to enter a reason before the move is committed.
 * Uses shared ConfirmModal element.
 *
 * Props:
 *   isOpen       - boolean
 *   isLoading    - boolean (confirm button spinner)
 *   onConfirm    - (reason: string) => void
 *   onCancel     - () => void
 *   leadName     - string (shown in subtitle)
 *   targetStage  - string (stage name shown in subtitle)
 */
const LostReasonModal = ({
  isOpen,
  isLoading = false,
  onConfirm,
  onCancel,
  leadName = 'this lead',
  targetStage = 'Lost',
}) => {
  const [reason, setReason] = useState('');
  const textareaRef = useRef(null);
  const MAX_LENGTH = 500;

  // Focus textarea when modal opens; reset reason on close
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const trimmed = reason.trim();
  const canSubmit = trimmed.length > 0 && !isLoading;

  const handleConfirm = () => {
    if (!canSubmit) return;
    onConfirm?.(trimmed);
  };

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter submits
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onCancel}
      title="Mark as Lost"
      message={`Moving ${leadName} to ${targetStage}. Please enter a reason.`}
      type="error"
      confirmText="Mark as Lost"
      cancelText="Cancel"
      isLoading={isLoading}
      onConfirm={handleConfirm}
    >
      <div className="flex flex-col gap-1.5 pt-1">
        <label
          htmlFor="lost-reason-textarea"
          className="block text-xs font-bold text-slate-600 uppercase tracking-wider"
        >
          Reason <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            id="lost-reason-textarea"
            ref={textareaRef}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MAX_LENGTH}
            disabled={isLoading}
            placeholder="e.g. Budget constraint, chose a competitor, not interested…"
            rows={4}
            className="
              w-full resize-none rounded-xl border border-slate-200
              px-3.5 py-3 text-sm text-slate-700 placeholder-slate-400
              bg-slate-50
              focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-colors
            "
          />
          {/* Character counter */}
          <span
            className={`absolute bottom-2.5 right-3 text-[10px] font-mono tabular-nums ${
              trimmed.length > MAX_LENGTH * 0.85
                ? trimmed.length >= MAX_LENGTH
                  ? 'text-red-500'
                  : 'text-amber-500'
                : 'text-slate-400'
            }`}
          >
            {reason.length}/{MAX_LENGTH}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Press <kbd className="font-mono bg-slate-100 px-1 rounded text-[9px]">Ctrl+Enter</kbd> to confirm
        </p>
      </div>
    </ConfirmModal>
  );
};

export default LostReasonModal;
