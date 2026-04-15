import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { companyApi } from '../api/companyApi';
import Drawer from '../../../shared/components/elements/Drawer';
import { toast, enhancedToast } from '../../../shared/utils/toast';

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
      enhancedToast.validationError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      let response;
      const loadingToastId = enhancedToast.saveProgress('Company');
      
      if (isEdit) {
        // Only update name and status for editing
        response = await companyApi.updateCompany(company.id, {
          name: formData.name,
          status: formData.status
        });
      } else {
        response = await companyApi.createCompany(formData);
      }

      toast.dismiss(loadingToastId);

      if (response && response.success) {
        enhancedToast.operationSuccess(
          isEdit ? 'Updated' : 'Created', 
          'Company'
        );
        onSuccess?.();
        onClose();
      } else {
        enhancedToast.operationError(
          isEdit ? 'update' : 'create',
          'company',
          response?.message
        );
      }
    } catch (error) {
      // Capture 409 Conflict and handle inline
      if (error && error.statusCode === 409) {
        setErrors({ code: 'This company code is already active in the system.' });
        toast.error('Code Already Exists', {
          description: 'The provided company code is already in use by another company.',
        });
      } else if (error && error.statusCode >= 500) {
        enhancedToast.networkError();
      } else {
        enhancedToast.operationError(
          isEdit ? 'update' : 'create',
          'company',
          error?.message
        );
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
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Company Name */}
        <div className="space-y-3">
          <label htmlFor="company-name" className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-tight block">Company Name</label>
          <input
            id="company-name"
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter legal company name..."
            className="w-full px-4 py-4 sm:py-3.5 rounded-2xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-semibold text-slate-900 placeholder:text-slate-300 placeholder:font-medium text-base sm:text-sm"
          />
        </div>

        {/* Company Code */}
        <div className="space-y-3">
          <label htmlFor="company-code" className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-tight block">Unique Entity Code</label>
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
              "w-full px-4 py-4 sm:py-3.5 rounded-2xl border transition-all outline-none font-black tracking-[0.1em] placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-300 uppercase text-base sm:text-sm",
              errors.code ? "border-red-500 bg-red-50/20 text-red-600" : "border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10",
              isEdit && "bg-slate-50 text-slate-400 cursor-not-allowed opacity-75 border-slate-100"
            )}
          />
          {errors.code && (
            <div className="flex items-center gap-2 text-red-500 text-sm font-bold mt-3 ml-1 animate-in slide-in-from-top-1 duration-300">
              <AlertCircle size={16} strokeWidth={2.5} />
              {errors.code}
            </div>
          )}
          {!isEdit && !errors.code && (
            <p className="text-xs text-slate-400 font-semibold ml-1 mt-2 uppercase tracking-tight">System-wide unique identifier. Cannot be changed later.</p>
          )}
        </div>

        {/* Operational Status Toggles */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-tight block">Operational Status</label>
          <div className="grid grid-cols-1 gap-3">
            {['ACTIVE', 'INACTIVE'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status }))}
                className={cn(
                  "py-4 sm:py-3.5 rounded-2xl border text-sm font-black transition-all flex items-center justify-center gap-3 group active:scale-95",
                  formData.status === status
                    ? "bg-primary text-white border-primary shadow-xl shadow-primary/20"
                    : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"
                )}
              >
                <span className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
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
        <div className="pt-8 space-y-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-5 sm:py-4 bg-primary text-white rounded-2xl font-black text-base sm:text-sm uppercase tracking-widest hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 disabled:opacity-75 disabled:cursor-not-allowed transform active:scale-95 group overflow-hidden relative"
          >
            {loading ? (
              <Loader2 size={24} className="sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <>
                <div className="absolute inset-0 bg-white/10 translate-y-full hover:translate-y-0 transition-transform duration-500" />
                <Save size={20} className="sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                {isEdit ? 'Commit Changes' : 'Initialize Enterprise'}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full py-4 sm:py-3 text-slate-400 font-bold text-sm uppercase tracking-widest hover:bg-slate-50 hover:text-slate-600 rounded-2xl transition-all active:scale-95"
          >
            Cancel and Return
          </button>
        </div>
      </form>
    </Drawer>
  );
};

export default CompanyForm;
