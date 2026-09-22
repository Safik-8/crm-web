// FrontEnd/src/features/kpi/components/KpiEditModal.jsx

import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { Target, X, AlertCircle } from 'lucide-react';
import { useUpdateKpiTarget } from '../hooks/useKpi';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import Button from '../../../shared/components/elements/Button';
import { toast } from '../../../shared/utils/toast';

export default function KpiEditModal({ target, isOpen, onClose, onSuccess }) {
  const updateMutation = useUpdateKpiTarget();

  const [targetValue, setTargetValue] = useState('');
  const [duration, setDuration] = useState('MONTHLY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (target && isOpen) {
      setTargetValue(String(target.targetValue || ''));
      setDuration(target.duration || 'MONTHLY');
      setStartDate(target.startDate ? target.startDate.split('T')[0] : '');
      setEndDate(target.endDate ? target.endDate.split('T')[0] : '');
      setErrorMsg('');
    }
  }, [target, isOpen]);

  const durationOptions = [
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'YEARLY', label: 'Yearly' },
    { value: 'CUSTOM_RANGE', label: 'Custom Range' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const val = Number(targetValue);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Target value must be a positive number greater than 0.');
      return;
    }

    if (!startDate || !endDate) {
      setErrorMsg('Start Date and End Date are required.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg('Start Date cannot be after End Date.');
      return;
    }

    const payload = {
      targetValue: val,
      duration,
      startDate,
      endDate,
    };

    const toastId = toast.loading('Updating target...');
    try {
      await updateMutation.mutateAsync({ id: target.id, data: payload });
      toast.success('Target updated successfully', { id: toastId });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update target';
      setErrorMsg(msg);
      toast.error(msg, { id: toastId });
    }
  };

  if (!isOpen || !target) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
        },
      }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/90">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-2xs">
            <Target size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Edit Target</h2>
            <p className="text-xs text-slate-500 font-medium capitalize">
              {target.kpiType} Target &bull; {target.employee?.name || target.team?.name || 'Assigned Target'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <DialogContent className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Target Value</label>
            <TextField
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="e.g. 50"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Duration</label>
            <SelectField
              value={duration}
              onChange={(val) => setDuration(val)}
              options={durationOptions}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Start Date</label>
              <TextField
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">End Date</label>
              <TextField
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
        </DialogContent>

        <DialogActions className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose} type="button" disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button variant="contained" type="submit" loading={updateMutation.isPending}>
            Save Changes
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
