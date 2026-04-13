import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { branchApi } from '../api/branchApi';
import Drawer from '../../../shared/components/elements/Drawer';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * BranchForm Component
 * Slide-over Drawer for creating / editing branches.
 * Mirrors the CompanyForm design language precisely.
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {Object|null} branch - null for create, object for edit
 * @param {number} companyId - required company context
 * @param {function} onSuccess - refetch callback
 */
const BranchForm = ({ isOpen, onClose, branch, companyId, onSuccess }) => {
  const isEdit = !!branch;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    status: 'ACTIVE'
  });
  const [errors, setErrors] = useState({});

  // Sync state when drawer opens
  useEffect(() => {
    if (isOpen) {
      if (branch) {
        setFormData({
          name: branch.name || '',
          code: branch.code || '',
          status: branch.status || 'ACTIVE'
        });
      } else {
        setFormData({ name: '', code: '', status: 'ACTIVE' });
      }
      setErrors({});
    }
  }, [isOpen, branch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value
    }));
    // Clear field error on type
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Branch name is required.';
    if (!isEdit && !formData.code.trim()) newErrors.code = 'Unique code is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      let response;
      if (isEdit) {
        // Only name and status are mutable
        response = await branchApi.updateBranch(branch.id, {
          name: formData.name,
          status: formData.status
        });
      } else {
        response = await branchApi.createBranch({
          companyId: Number(companyId),
          name: formData.name,
          code: formData.code,
          status: formData.status
        });
      }

      if (response && response.success) {
        toast.success(`Branch ${isEdit ? 'updated' : 'created'} successfully`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      // Handle 409 Conflict — code already exists
      if (error && (error.statusCode === 409 || error.status === 409)) {
        setErrors({ code: 'This branch code is already active in the system.' });
        toast.error('The provided code is already in use.');
      } else {
        toast.error(error?.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Refine Branch Details' : 'Register New Branch'}
      subtitle={isEdit ? 'Update identity for an existing branch' : 'Onboard a new geographical or functional hub'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branch Name */}
        <div className="space-y-1.5">
          <label htmlFor="branch-name" className="text-[13px] font-bold text-slate-700 ml-1 uppercase tracking-tight">Branch Name</label>
          <input
            id="branch-name"
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter branch name..."
            className={cn(
              "w-full px-4 py-3.5 rounded-2xl border transition-all outline-none font-semibold text-slate-900 placeholder:text-slate-300 placeholder:font-medium",
              errors.name ? "border-red-500 bg-red-50/20" : "border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10"
            )}
          />
          {errors.name && (
            <div className="flex items-center gap-2 text-red-500 text-[11px] font-bold mt-2 ml-1 animate-in slide-in-from-top-1 duration-300">
              <AlertCircle size={14} strokeWidth={2.5} />
              {errors.name}
            </div>
          )}
        </div>

        {/* Branch Code */}
        <div className="space-y-1.5">
          <label htmlFor="branch-code" className="text-[13px] font-bold text-slate-700 ml-1 uppercase tracking-tight">Unique Branch Code</label>
          <input
            id="branch-code"
            type="text"
            name="code"
            required={!isEdit}
            disabled={isEdit}
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g. AHM_HQ"
            className={cn(
              "w-full px-4 py-3.5 rounded-2xl border transition-all outline-none font-black tracking-[0.1em] placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-300 uppercase",
              errors.code ? "border-red-500 bg-red-50/20 text-red-600" : "border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10",
              isEdit && "bg-slate-50 text-slate-400 cursor-not-allowed opacity-75 border-slate-100"
            )}
          />
          {errors.code && (
            <div className="flex items-center gap-2 text-red-500 text-[11px] font-bold mt-2 ml-1 animate-in slide-in-from-top-1 duration-300">
              <AlertCircle size={14} strokeWidth={2.5} />
              {errors.code}
            </div>
          )}
          {!isEdit && !errors.code && (
            <p className="text-[10px] text-slate-400 font-semibold ml-1 mt-2 uppercase tracking-tight">System-wide unique identifier. Cannot be changed later.</p>
          )}
        </div>

        {/* Operational Status Toggles */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-slate-700 ml-1 uppercase tracking-tight">Operational Status</label>
          <div className="grid grid-cols-2 gap-4">
            {['ACTIVE', 'INACTIVE'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status }))}
                className={cn(
                  "py-3.5 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-2 group",
                  formData.status === status
                    ? "bg-primary text-white border-primary shadow-xl shadow-primary/20"
                    : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"
                )}
              >
                <span className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  status === 'ACTIVE'
                    ? (formData.status === status ? 'bg-white shadow-[0_0_10px_white]' : 'bg-emerald-500 group-hover:scale-110')
                    : (formData.status === status ? 'bg-white shadow-[0_0_10px_white]' : 'bg-slate-300 group-hover:scale-110')
                )} />
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-10 flex flex-col gap-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 disabled:opacity-75 disabled:cursor-not-allowed transform active:scale-95 group overflow-hidden relative"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <div className="absolute inset-0 bg-white/10 translate-y-full hover:translate-y-0 transition-transform duration-500" />
                <Save size={18} className="group-hover:scale-110 transition-transform" />
                {isEdit ? 'Commit Changes' : 'Initialize Branch'}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 hover:text-slate-600 rounded-2xl transition-all"
          >
            Cancel and Return
          </button>
        </div>
      </form>
    </Drawer>
  );
};

export default BranchForm;
