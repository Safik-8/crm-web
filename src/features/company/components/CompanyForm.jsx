import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { companyApi } from '../api/companyApi';
import Drawer from '../../../shared/components/elements/Drawer';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * CompanyForm Component
 * Handles Add/Edit logic for companies with premium styling and inline error handling.
 */
const CompanyForm = ({ isOpen, onClose, company, onSuccess }) => {
  const isEdit = !!company;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    status: 'ACTIVE'
  });
  const [errors, setErrors] = useState({});

  // Sync state with selected company when drawer opens
  useEffect(() => {
    if (isOpen) {
      if (company) {
        setFormData({
          name: company.name || '',
          code: company.code || '',
          status: company.status || 'ACTIVE'
        });
      } else {
        setFormData({ name: '', code: '', status: 'ACTIVE' });
      }
      setErrors({});
    }
  }, [isOpen, company]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value
    }));
    // Clear field error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      let response;
      if (isEdit) {
        // Only update name and status for editing
        response = await companyApi.updateCompany(company.id, {
          name: formData.name,
          status: formData.status
        });
      } else {
        response = await companyApi.createCompany(formData);
      }

      if (response && response.success) {
        toast.success(`Company ${isEdit ? 'updated' : 'created'} successfully`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      // Capture 409 Conflict and handle inline
      if (error && error.statusCode === 409) {
        setErrors({ code: 'This company code is already active in the system.' });
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
      title={isEdit ? 'Refine Entity Details' : 'Register New Company'}
      subtitle={isEdit ? 'Updating global identity for an existing entity' : 'Onboard a new organization to the CRM cloud foundation'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Name */}
        <div className="space-y-1.5">
          <label htmlFor="company-name" className="text-[13px] font-bold text-slate-700 ml-1 uppercase tracking-tight">Company Name</label>
          <input
            id="company-name"
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter legal company name..."
            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-semibold text-slate-900 placeholder:text-slate-300 placeholder:font-medium"
          />
        </div>

        {/* Company Code */}
        <div className="space-y-1.5">
          <label htmlFor="company-code" className="text-[13px] font-bold text-slate-700 ml-1 uppercase tracking-tight">Unique Entity Code</label>
          <input
            id="company-code"
            type="text"
            name="code"
            required
            disabled={isEdit}
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g. STKDT_LLC"
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
                <Save size={18} className="group-hover:translate-z-10 group-hover:scale-110 transition-transform" />
                {isEdit ? 'Commit Changes' : 'Initialize Enterprise'}
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

export default CompanyForm;
