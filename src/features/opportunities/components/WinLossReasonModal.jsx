import React, { useState, useEffect } from 'react';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import SelectField from '../../../shared/components/elements/SelectField';

/**
 * WinLossReasonModal — Presents a selectable list of active reasons when
 * closing an opportunity as LOST. Falls back to a textarea if no reasons.
 *
 * Props:
 *  - isOpen
 *  - isLoading
 *  - reasons: [{ id, label }]
 *  - onConfirm: (reasonId, remarks) => void
 *  - onCancel
 *  - leadName
 */
const WinLossReasonModal = ({ isOpen, isLoading = false, reasons = [], onConfirm, onCancel, leadName = 'this opportunity' }) => {
  const [selected, setSelected] = useState('');
  const [remarks, setRemarks] = useState('');
  const [customReason, setCustomReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelected('');
      setRemarks('');
      setCustomReason('');
    }
  }, [isOpen]);

  const hasReasons = Array.isArray(reasons) && reasons.length > 0;
  const canSubmit = !isLoading && (hasReasons ? !!selected : customReason.trim().length > 0);

  const handleConfirm = () => {
    if (!canSubmit) return;
    const reasonId = hasReasons ? Number(selected) : null;
    const finalRemarks = hasReasons
      ? remarks.trim()
      : remarks.trim()
      ? `${customReason.trim()}\nNotes: ${remarks.trim()}`
      : customReason.trim();
    onConfirm?.(reasonId, finalRemarks);
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onCancel}
      title="Mark as Lost"
      message={`Mark ${leadName} as Lost. Please select a reason.`}
      type="error"
      confirmText="Mark as Lost"
      cancelText="Cancel"
      isLoading={isLoading}
      onConfirm={handleConfirm}
    >
      <div className="flex flex-col gap-3 pt-1">
        {hasReasons ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Select Reason</label>
            <SelectField
              value={selected}
              onChange={(v) => setSelected(v === undefined ? '' : v)}
              options={reasons.map((r) => ({ value: String(r.id), label: r.name || r.label || r.title || r.reason }))}
              placeholder="Select reason"
              allowEmptyOption={false}
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Reason (required)</label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter reason for loss"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm"
              rows={4}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Optional Notes</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Additional notes (optional)"
            className="w-full rounded-xl border border-slate-200 p-3 text-sm"
            rows={3}
          />
        </div>
      </div>
    </ConfirmModal>
  );
};

export default WinLossReasonModal;
