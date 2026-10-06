import React, { useState, useEffect } from 'react';
import { Dialog } from '@mui/material';
import { CheckCircle, X, DollarSign, Calendar, BookOpen } from 'lucide-react';

const ClosurePopupModal = ({ isOpen, lead, courses = [], onClose, onConfirm, isLoading }) => {
  const [expectedRevenue, setExpectedRevenue] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [productId, setProductId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setExpectedRevenue(lead?.budget ? String(lead.budget) : '');
      setClosingDate('');
      setProductId(lead?.courseId ? String(lead.courseId) : '');
    }
  }, [isOpen, lead]);

  const isServiceFixed = Boolean(lead?.courseId);
  const isValid =
    Number(expectedRevenue) > 0 &&
    closingDate &&
    !isNaN(Date.parse(closingDate));

  const handleSubmit = () => {
    if (!isValid || isLoading) return;
    onConfirm({
      expectedRevenue: Number(expectedRevenue),
      closingDate,
      productId: productId ? Number(productId) : null,
    });
  };

  // Do NOT add `if (!isOpen) return null` here.
  // MUI Dialog handles mounting/unmounting via `open` prop with proper animation lifecycle.
  // An early return here would break useEffect cleanup and MUI's transition system.

  return (
    <Dialog
      open={isOpen}
      onClose={isLoading ? undefined : onClose}
      PaperProps={{
        sx: { borderRadius: '20px', maxWidth: '480px', width: '100%', overflow: 'hidden', margin: '16px' }
      }}
    >
      <div className="bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Close Lead</h2>
                <p className="text-emerald-100 text-xs mt-0.5 truncate max-w-[240px]">
                  {lead?.name || 'Lead'}
                </p>
              </div>
            </div>
            {!isLoading && (
              <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <p className="text-sm text-slate-500">
            Fill in the opportunity details before closing this lead. An opportunity will be
            automatically created and assigned.
          </p>

          {/* Expected Revenue */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Expected Revenue (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                min="1"
                value={expectedRevenue}
                onChange={(e) => setExpectedRevenue(e.target.value)}
                placeholder="e.g. 50000"
                disabled={isLoading}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700
                  focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400
                  disabled:opacity-60 bg-slate-50"
              />
            </div>
          </div>

          {/* Target Closing Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Closing Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={isLoading}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700
                  focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400
                  disabled:opacity-60 bg-slate-50"
              />
            </div>
          </div>

          {/* Service */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Service {isServiceFixed && <span className="text-emerald-600 font-normal normal-case">(pre-filled from lead)</span>}
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={isLoading || isServiceFixed}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700
                  focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400
                  disabled:opacity-60 bg-slate-50 appearance-none"
              >
                <option value="">Select Service (optional)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600
              hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white
              text-sm font-bold hover:from-emerald-600 hover:to-teal-700 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Close Lead & Create Opportunity
              </>
            )}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default ClosurePopupModal;
