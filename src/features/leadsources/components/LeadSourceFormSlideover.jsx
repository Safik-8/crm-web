// src/features/leadsources/components/LeadSourceFormSlideover.jsx

import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Globe, 
  Share2, 
  Megaphone, 
  Users, 
  PhoneCall, 
  Mail, 
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Loader2
} from 'lucide-react';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import {
  useCreateLeadSourceMutation,
  useUpdateLeadSourceMutation
} from '../hooks/useLeadSources';

// Common SaaS / CRM presets to speed up source entry
const PRESET_SOURCES = [
  { name: 'Website / Organic', desc: 'Inbound visitors arriving via search engine optimization or direct traffic.', icon: Globe },
  { name: 'Google Ads (PPC)', desc: 'Paid search engine marketing campaigns on Google Search & Display.', icon: Megaphone },
  { name: 'Social Media / Meta Ads', desc: 'Campaign leads from Facebook, Instagram, and paid social targeting.', icon: Share2 },
  { name: 'LinkedIn Outreach', desc: 'B2B outreach campaigns and Sponsored InMail on LinkedIn.', icon: Users },
  { name: 'Customer Referral', desc: 'High-intent prospects referred by existing satisfied clients.', icon: Users },
  { name: 'Cold Calling', desc: 'Outbound sales prospecting and direct tele-calling campaigns.', icon: PhoneCall },
  { name: 'Email Campaign', desc: 'Leads responding to newsletter broadcasts and automated drip sequences.', icon: Mail },
];

export const LeadSourceFormSlideover = ({ isOpen, mode, source, onClose }) => {
  const createMutation = useCreateLeadSourceMutation();
  const updateMutation = useUpdateLeadSourceMutation();

  const isEdit = mode === 'edit';

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState({});

  // Sync state on open / source change
  useEffect(() => {
    if (isOpen) {
      if (isEdit && source) {
        setName(source.name || '');
        setDescription(source.description || '');
        setIsActive(source.isActive ?? true);
      } else {
        setName('');
        setDescription('');
        setIsActive(true);
      }
      setErrors({});
    }
  }, [isOpen, isEdit, source]);

  const handleApplyPreset = (preset) => {
    setName(preset.name);
    setDescription(preset.desc);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Source Name is required';
    } else if (name.trim().length > 100) {
      errs.name = 'Source Name cannot exceed 100 characters';
    }

    if (description && description.length > 500) {
      errs.description = 'Description cannot exceed 500 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validate()) return;

    try {
      if (!isEdit) {
        await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim()
        });
      } else {
        await updateMutation.mutateAsync({
          id: source.id,
          data: {
            name: name.trim(),
            description: description.trim(),
            isActive: Boolean(isActive)
          }
        });
      }
      onClose();
    } catch (err) {
      if (err?.errors && Array.isArray(err.errors)) {
        const fieldErrors = {};
        err.errors.forEach((e) => {
          if (e.field) fieldErrors[e.field] = e.message;
        });
        setErrors(fieldErrors);
        return;
      }
      if (err?.code === 'CONFLICT' || err?.statusCode === 409) {
        setErrors({ name: err.message || 'Lead source name already exists in this company.' });
        return;
      }
      setErrors({ form: err?.message || 'Something went wrong. Please try again.' });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <DynamicFormSlideover
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Lead Source' : 'Add Lead Source'}
      subtitle={isEdit ? 'Update acquisition channel details and settings' : 'Define an acquisition channel to track where your leads originate.'}
      icon={Compass}
      isLoading={isPending}
      showFooter={false}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Global form error message */}
        {errors.form && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Presets / Fast Suggestions Bar (Only in Add Mode) */}
        {!isEdit && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles size={13} className="text-orange-500" />
                Popular Channel Presets
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Click to auto-fill</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_SOURCES.map((preset) => {
                const IconComponent = preset.icon;
                const isSelected = name === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-orange-50 border-orange-300 text-orange-800 font-semibold shadow-2xs'
                        : 'bg-white border-slate-200/90 text-slate-700 hover:border-orange-300 hover:bg-orange-50/40 hover:text-orange-700'
                    }`}
                  >
                    <IconComponent size={12} className={isSelected ? 'text-orange-600' : 'text-slate-400'} />
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Source Name Input Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="source-name" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              Source Name <span className="text-red-500 font-bold">*</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {name.length}/100
            </span>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Compass size={16} />
            </div>
            <input
              id="source-name"
              type="text"
              placeholder="e.g. Website, Facebook Ads, Events, LinkedIn..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
              }}
              maxLength={100}
              className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-white rounded-[10px] border outline-none transition-all placeholder:text-slate-400 ${
                errors.name
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
              }`}
            />
          </div>

          {errors.name && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle size={13} />
              {errors.name}
            </p>
          )}
        </div>

        {/* Description Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="source-desc" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {description.length}/500
            </span>
          </div>

          <textarea
            id="source-desc"
            rows={3}
            placeholder="Describe this acquisition channel, campaign context, or attribution rules..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
            }}
            maxLength={500}
            className={`w-full p-3 text-sm bg-white rounded-[10px] border outline-none transition-all placeholder:text-slate-400 resize-none ${
              errors.description
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
            }`}
          />

          {errors.description && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle size={13} />
              {errors.description}
            </p>
          )}
        </div>

        {/* Status Selection (Active / Inactive) */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Channel Status
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsActive(true)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-500/20 text-emerald-900 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 size={18} className={isActive ? 'text-emerald-600 shrink-0' : 'text-slate-400 shrink-0'} />
              <div>
                <div className="text-xs font-bold">Active</div>
                <div className="text-[10px] text-slate-500">Available for all leads</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsActive(false)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                !isActive
                  ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-500/20 text-amber-900 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <XCircle size={18} className={!isActive ? 'text-amber-600 shrink-0' : 'text-slate-400 shrink-0'} />
              <div>
                <div className="text-xs font-bold">Inactive</div>
                <div className="text-[10px] text-slate-500">Hidden from entry forms</div>
              </div>
            </button>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200/90 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye size={13} className="text-slate-400" />
              Live Preview
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Lead Badge View
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600 shrink-0">
                <Compass size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {name.trim() || 'Untitled Source'}
                </div>
                <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                  {description.trim() || 'No description provided'}
                </div>
              </div>
            </div>

            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Sticky Form Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2.5 rounded-[10px] text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-[10px] shadow-sm hover:shadow transition-all duration-150 active:scale-[0.98] cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>{isEdit ? 'Saving...' : 'Creating...'}</span>
              </>
            ) : (
              <span>{isEdit ? 'Save Changes' : 'Create Source'}</span>
            )}
          </button>
        </div>
      </form>
    </DynamicFormSlideover>
  );
};

export default LeadSourceFormSlideover;
