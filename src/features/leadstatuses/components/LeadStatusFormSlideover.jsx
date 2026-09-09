// src/features/leadstatuses/components/LeadStatusFormSlideover.jsx

import React, { useState, useEffect } from 'react';
import {
  Tags,
  Sparkles,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
  Star,
  Pipette,
  Layers
} from 'lucide-react';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import {
  useCreateLeadStatusMutation,
  useUpdateLeadStatusMutation
} from '../hooks/useLeadStatuses';

// Popular pipeline stage presets with their recommended theme colors
const PRESET_STATUSES = [
  { name: 'New Lead', color: '#3B82F6', icon: '✨' },
  { name: 'Contacted', color: '#8B5CF6', icon: '📞' },
  { name: 'Meeting Scheduled', color: '#06B6D4', icon: '📅' },
  { name: 'Proposal Sent', color: '#F59E0B', icon: '📑' },
  { name: 'In Negotiation', color: '#F97316', icon: '🤝' },
  { name: 'Closed Won', color: '#10B981', icon: '🏆' },
  { name: 'Closed Lost', color: '#EF4444', icon: '❌' },
  { name: 'Disqualified', color: '#64748B', icon: '🚫' },
];

// Curated modern SaaS color swatches
const COLOR_PALETTE = [
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Rose', hex: '#EF4444' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Slate', hex: '#64748B' },
];

export const LeadStatusFormSlideover = ({ isOpen, mode, status, onClose }) => {
  const createMutation = useCreateLeadStatusMutation();
  const updateMutation = useUpdateLeadStatusMutation();

  const isEdit = mode === 'edit';

  // Form states
  const [name, setName] = useState('');
  const [displayColor, setDisplayColor] = useState('#3B82F6');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState({});

  // Sync state on open or status change
  useEffect(() => {
    if (isOpen) {
      if (isEdit && status) {
        setName(status.name || '');
        setDisplayColor(status.displayColor || '#3B82F6');
        setIsActive(status.isActive ?? true);
        setIsDefault(status.isDefault ?? false);
      } else {
        setName('');
        setDisplayColor('#3B82F6');
        setIsActive(true);
        setIsDefault(false);
      }
      setErrors({});
    }
  }, [isOpen, isEdit, status]);

  const handleApplyPreset = (preset) => {
    setName(preset.name);
    setDisplayColor(preset.color);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: null }));
    }
    if (errors.displayColor) {
      setErrors((prev) => ({ ...prev, displayColor: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Status Name is required';
    } else if (name.trim().length > 80) {
      errs.name = 'Status Name cannot exceed 80 characters';
    }

    if (!displayColor) {
      errs.displayColor = 'Display Color is required';
    } else if (!/^#[0-9a-fA-F]{6}$/.test(displayColor)) {
      errs.displayColor = 'Please enter a valid 6-digit hex color (e.g. #3B82F6)';
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
          displayColor: displayColor.toLowerCase(),
          isDefault: Boolean(isDefault)
        });
      } else {
        await updateMutation.mutateAsync({
          id: status.id,
          data: {
            name: name.trim(),
            displayColor: displayColor.toLowerCase(),
            isActive: Boolean(isActive),
            isDefault: Boolean(isDefault)
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
        setErrors({ name: err.message || 'Status name already exists.' });
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
      title={isEdit ? 'Edit Lead Status' : 'Add Lead Status'}
      subtitle={isEdit ? 'Update stage details, display color, and rules' : 'Define a sales pipeline stage to track leads from prospect to close.'}
      icon={Tags}
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

        {/* Immutable Code Info Banner (Edit mode) */}
        {isEdit && status?.code && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">System Code:</span>
              <code className="font-mono text-xs bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700 font-semibold">
                {status.code}
              </code>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Immutable</span>
          </div>
        )}

        {/* Presets / Fast Suggestions Bar (Add Mode) */}
        {!isEdit && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles size={13} className="text-orange-500" />
                Popular Pipeline Stages
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Click to auto-fill</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_STATUSES.map((preset) => {
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
                    <span>{preset.icon}</span>
                    <span>{preset.name}</span>
                    <span
                      className="w-2 h-2 rounded-full ml-0.5"
                      style={{ backgroundColor: preset.color }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Name Input Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="status-name" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              Status Name <span className="text-red-500 font-bold">*</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {name.length}/80
            </span>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Tags size={16} />
            </div>
            <input
              id="status-name"
              type="text"
              placeholder="e.g. In Progress, Qualified Lead, Closed Won..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
              }}
              maxLength={80}
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

        {/* Display Color Picker with Curated Swatches */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Pipette size={13} className="text-slate-400" />
              Pipeline Display Color <span className="text-red-500 font-bold">*</span>
            </label>
            <span className="text-[11px] font-mono font-semibold text-slate-600 uppercase">
              {displayColor}
            </span>
          </div>

          {/* Preset Swatches */}
          <div className="flex flex-wrap items-center gap-2">
            {COLOR_PALETTE.map((color) => {
              const isSelected = displayColor.toLowerCase() === color.hex.toLowerCase();
              return (
                <button
                  key={color.hex}
                  type="button"
                  title={color.name}
                  onClick={() => {
                    setDisplayColor(color.hex);
                    if (errors.displayColor) setErrors((prev) => ({ ...prev, displayColor: null }));
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-slate-800 scale-110 shadow-sm'
                      : 'hover:scale-105 border border-black/10'
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  {isSelected && <Check size={13} className="text-white drop-shadow-xs" strokeWidth={3} />}
                </button>
              );
            })}
          </div>

          {/* Custom Color Picker & Hex Input Box */}
          <div className="flex items-center gap-3 pt-1">
            <div className="relative flex items-center">
              <input
                type="color"
                value={displayColor.length === 7 ? displayColor : '#3B82F6'}
                onChange={(e) => {
                  setDisplayColor(e.target.value.toUpperCase());
                  if (errors.displayColor) setErrors((prev) => ({ ...prev, displayColor: null }));
                }}
                className="w-10 h-10 rounded-[10px] border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
              />
            </div>

            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="#3B82F6"
                value={displayColor}
                onChange={(e) => {
                  let val = e.target.value;
                  if (!val.startsWith('#') && val.length > 0) val = '#' + val;
                  setDisplayColor(val.toUpperCase());
                  if (errors.displayColor) setErrors((prev) => ({ ...prev, displayColor: null }));
                }}
                maxLength={7}
                className="w-full px-3 py-2 text-xs font-mono font-bold uppercase bg-white rounded-[10px] border border-slate-200 outline-none hover:border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div
              className="px-3 py-2 rounded-[10px] text-xs font-bold text-white shadow-xs shrink-0 flex items-center gap-1.5"
              style={{ backgroundColor: displayColor }}
            >
              <Layers size={13} />
              <span>Color Sample</span>
            </div>
          </div>

          {errors.displayColor && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle size={13} />
              {errors.displayColor}
            </p>
          )}
        </div>

        {/* Default Status Option Card */}
        <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Star size={14} className={isDefault ? 'text-amber-500 fill-amber-500' : 'text-slate-400'} />
              <span>Initial Default Status</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Automatically assign this stage to newly imported or created leads.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsDefault(!isDefault)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isDefault ? 'bg-orange-500' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isDefault ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Status Active / Inactive (in Edit Mode) */}
        {isEdit && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Lifecycle Stage Status
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
                  <div className="text-[10px] text-slate-500">Available in pipeline</div>
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
                  <div className="text-[10px] text-slate-500">Hidden from pipeline</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Live Preview Card */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200/90 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye size={13} className="text-slate-400" />
              Live Preview
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Pipeline Stage Badge
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                style={{ backgroundColor: displayColor }}
              >
                <Tags size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {name.trim() || 'Untitled Status'}
                  </span>
                  {isDefault && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                      <Star size={9} className="fill-amber-500" />
                      Default
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  Color code: <code className="font-mono">{displayColor}</code>
                </div>
              </div>
            </div>

            {/* Rendered Badge Pill */}
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shrink-0 border"
              style={{
                backgroundColor: `${displayColor}18`,
                color: displayColor,
                borderColor: `${displayColor}40`
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full mr-1.5"
                style={{ backgroundColor: displayColor }}
              />
              {name.trim() || 'Status Badge'}
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
              <span>{isEdit ? 'Save Changes' : 'Create Status'}</span>
            )}
          </button>
        </div>
      </form>
    </DynamicFormSlideover>
  );
};

export default LeadStatusFormSlideover;
