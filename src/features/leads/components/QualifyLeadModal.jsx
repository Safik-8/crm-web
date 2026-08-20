import React, { useState, useEffect } from 'react';
import { useQualifyLeadMutation } from '../hooks/useQualification';
import { getQualificationCriteria, getQualificationSettings } from '../services/qualificationService';
import DynamicFormModal from '../../../shared/components/elements/DynamicFormModal';
import { Target, Calculator, Check, AlertCircle, BarChart3, ListChecks, Sparkles, AlertTriangle } from 'lucide-react';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import Checkbox from '../../../shared/components/elements/Checkbox';
import { toast } from '../../../shared/utils/toast';

const QualifyLeadModal = ({ lead, isOpen, onClose, onQualified }) => {
  const qualifyMutation = useQualifyLeadMutation();

  const [isSyncingData, setIsSyncingData] = useState(true);
  const [criteria, setCriteria] = useState([]);
  const [settings, setSettings] = useState({ passThreshold: 60, holdThreshold: 40 });
  const [formData, setFormData] = useState({
    status: '',
    notes: '',
    remarks: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;
    if (isOpen && lead) {
      setIsSyncingData(true);

      const fetchData = async () => {
        try {
          const [fetchedCriteria, fetchedSettings] = await Promise.all([
            getQualificationCriteria(),
            getQualificationSettings(),
          ]);

          if (!isMounted) return;

          const uniqueMap = new Map();
          (fetchedCriteria || []).forEach((c) => {
            if (!uniqueMap.has(c.key)) {
              uniqueMap.set(c.key, c);
            }
          });
          const uniqueList = Array.from(uniqueMap.values());

          setCriteria(uniqueList);
          if (fetchedSettings) {
            setSettings(fetchedSettings);
          }

          const q = lead.qualification || lead.leadQualification;
          const savedValues = q?.criteriaValues || {};

          // Build initial formData for all dynamic active criteria (Edge Case 4 & QA Edge Case 9)
          const initialForm = {
            status: q?.status === 'ON_HOLD' || q?.status === 'UNQUALIFIED' ? q.status : '',
            notes: q?.notes || '',
            remarks: q?.remarks || '',
          };

          (fetchedCriteria || []).forEach((c) => {
            if (savedValues[c.key] !== undefined && savedValues[c.key] !== null) {
              initialForm[c.key] = savedValues[c.key];
            } else if (c.fieldType === 'boolean') {
              initialForm[c.key] = q?.[c.key] !== undefined ? Boolean(q[c.key]) : (c.defaultValue === 'true');
            } else if (c.fieldType === 'select') {
              initialForm[c.key] = q?.[c.key] || c.defaultValue || '';
            } else {
              initialForm[c.key] = c.defaultValue || '';
            }
          });

          setFormData(initialForm);
          setErrors({});
        } catch (err) {
          console.error('Failed to load qualification criteria configuration:', err);
          toast.error('Failed to load qualification criteria settings');
        } finally {
          if (isMounted) setIsSyncingData(false);
        }
      };

      fetchData();
    } else {
      setIsSyncingData(true);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, lead]);

  // Compute live score dynamically over active criteria
  const computeScore = () => {
    let score = 0;
    criteria.forEach((c) => {
      const val = formData[c.key];
      if (c.fieldType === 'boolean' && Boolean(val)) {
        score += Number(c.maxPoints) || 0;
      } else if (c.fieldType === 'select' && Array.isArray(c.options)) {
        const matchedOpt = c.options.find((opt) => opt.value === val);
        if (matchedOpt) {
          score += Number(matchedOpt.points) || 0;
        }
      } else if (c.fieldType === 'number' && val !== undefined && val !== null && !isNaN(val)) {
        score += Math.min(Number(c.maxPoints) || 0, Math.max(0, Number(val)));
      }
    });
    return Math.min(100, Math.max(0, score));
  };

  const currentScore = computeScore();
  const passThreshold = settings?.passThreshold ?? 60;
  const autoStatus = currentScore >= passThreshold ? 'QUALIFIED' : 'NOT_QUALIFIED';

  const handleChange = (e) => {
    if (isSyncingData) return;
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      status: '', // Reset manual override on edit so score auto-computes status
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleCustomChange = (name, value) => {
    if (isSyncingData) return;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name !== 'status' && { status: '' }),
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const finalStatus = formData.status || autoStatus;

    // Validate required dynamic criteria (Edge Case 3)
    criteria.forEach((c) => {
      if (c.isRequired) {
        const val = formData[c.key];
        if (val === undefined || val === null || val === '') {
          newErrors[c.key] = `${c.label} is required`;
        }
      }
    });

    // Mandatory disqualification remarks (QA Edge Case 11)
    if (finalStatus === 'NOT_QUALIFIED' && !formData.remarks?.trim()) {
      newErrors.remarks = 'Remarks are required when marking a lead as Not Qualified';
    }
    if (finalStatus === 'ON_HOLD' && !formData.notes?.trim()) {
      newErrors.notes = 'Notes are required when marking a lead as On Hold';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrMessage = Object.values(newErrors)[0];
      toast.error(firstErrMessage);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      ...formData,
      status: formData.status || autoStatus,
      notes: formData.notes?.trim() || undefined,
      remarks: formData.remarks?.trim() || undefined,
    };

    try {
      await qualifyMutation.mutateAsync({ leadId: lead.id, data: payload });
      if (onQualified) onQualified();
      onClose();
    } catch (error) {
      // Error handled by mutation toast
    }
  };

  if (!isOpen) return null;

  const booleanCriteria = criteria.filter((c) => c.fieldType === 'boolean');
  const selectOrNumberCriteria = criteria.filter((c) => c.fieldType === 'select' || c.fieldType === 'number');

  const isFormDisabled = isSyncingData || qualifyMutation.isPending;

  return (
    <DynamicFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Qualify Lead"
      icon={Target}
      onSubmit={handleSubmit}
      submitText="Save Qualification"
      cancelText="Cancel"
      loading={qualifyMutation.isPending || isSyncingData}
      size="md"
    >
      <div className="relative flex flex-col gap-4 max-h-[calc(100vh-220px)] overflow-y-auto overflow-x-hidden p-2 -m-2 scroll-smooth">
        {/* Loading Overlay while data is pre-filled */}
        {isSyncingData && (
          <div className="absolute inset-0 z-30 bg-white/85 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 rounded-xl transition-all duration-300">
            <div className="w-9 h-9 border-3 border-orange-500 border-t-transparent rounded-full animate-spin shadow-sm" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-extrabold text-slate-700 tracking-wide">
                Fetching Company Qualification Matrix...
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Fields lock until dynamic form finishes loading
              </span>
            </div>
          </div>
        )}

        {/* Compact Enterprise Score Card */}
        <div className="mt-3 bg-gradient-to-r from-slate-50 to-orange-50/30 rounded-xl p-3.5 border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
          <div className="flex-1 flex items-center gap-6">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Calculator size={12} className="text-orange-500" />
                <h3 className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase">Live Score</h3>
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl font-black text-slate-800 tracking-tight leading-none">{currentScore}</span>
                <span className="text-sm font-bold text-slate-400">/ 100</span>
              </div>
            </div>

            {/* Score progress bar */}
            <div className="flex-1 max-w-[150px] hidden sm:block">
              <div className="flex justify-between items-center text-[9px] font-extrabold text-slate-400 mb-1">
                <span>PASS: {passThreshold} PTS</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300/40">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    currentScore >= passThreshold ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(Math.max(currentScore, 0), 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end">
            <h3 className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Computed Status</h3>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                (formData.status || autoStatus) === 'QUALIFIED'
                  ? 'bg-emerald-50 border-emerald-200/80 text-emerald-700'
                  : (formData.status || autoStatus) === 'ON_HOLD'
                  ? 'bg-amber-50 border-amber-200/80 text-amber-700'
                  : 'bg-rose-50 border-rose-200/80 text-rose-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  (formData.status || autoStatus) === 'QUALIFIED'
                    ? 'bg-emerald-500'
                    : (formData.status || autoStatus) === 'ON_HOLD'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              {formData.status || autoStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Checklist Column (Left) */}
          <div className="md:col-span-7 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md text-orange-500 bg-orange-50">
                  <ListChecks size={14} />
                </div>
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Checklist</h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400">{booleanCriteria.length} Factors</span>
            </div>

            <div className="flex flex-col gap-2">
              {booleanCriteria.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No checkbox criteria configured.
                </div>
              ) : (
                booleanCriteria.map((item) => (
                  <label
                    key={item.key}
                    className={`
                    group relative flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200
                    border ${errors[item.key] ? 'border-rose-300 bg-rose-50/30' : ''}
                    ${
                      formData[item.key]
                        ? 'bg-orange-50/50 border-orange-200 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }
                  `}
                  >
                    <Checkbox
                      id={`criteria-${item.key}`}
                      checked={Boolean(formData[item.key])}
                      onChange={(checked) => {
                        if (!isFormDisabled) {
                          setFormData((prev) => ({ ...prev, [item.key]: checked }));
                          if (errors[item.key]) {
                            setErrors((prev) => ({ ...prev, [item.key]: null }));
                          }
                        }
                      }}
                      disabled={isFormDisabled}
                      sx={{ p: 0, width: 'auto' }}
                    />

                    <div className="flex-1 flex justify-between items-center z-10">
                      <div>
                        <div
                          className={`text-xs font-bold transition-colors leading-none flex items-center gap-1 ${
                            formData[item.key] ? 'text-orange-900' : 'text-slate-700'
                          }`}
                        >
                          {item.label}
                          {item.isRequired && <span className="text-rose-500 font-extrabold">*</span>}
                        </div>
                        {item.description && (
                          <div
                            className={`text-[10px] font-medium mt-1 transition-colors leading-none ${
                              formData[item.key] ? 'text-orange-700/70' : 'text-slate-400'
                            }`}
                          >
                            {item.description}
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md transition-all duration-200 ${
                          formData[item.key] ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        +{item.maxPoints}
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Metrics Column (Right) */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md text-orange-500 bg-orange-50">
                  <BarChart3 size={14} />
                </div>
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Metrics</h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400">{selectOrNumberCriteria.length} Factors</span>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-200 flex flex-col gap-3 shadow-xs">
              {selectOrNumberCriteria.map((item) => {
                if (item.fieldType === 'select') {
                  const opts = (item.options || []).map((opt) => {
                    const cleanLabel = (opt.label || '').replace(/\s*\(\+?\d+.*?\)/g, '').trim();
                    return {
                      value: opt.value,
                      label: `${cleanLabel} (+${opt.points} pts)`,
                    };
                  });

                  return (
                    <SelectField
                      key={item.key}
                      label={
                        <span>
                          {item.label} {item.isRequired && <span className="text-rose-500 font-extrabold">*</span>}
                        </span>
                      }
                      name={item.key}
                      value={formData[item.key] || ''}
                      onChange={(val) => handleCustomChange(item.key, val)}
                      disabled={isFormDisabled}
                      options={[{ value: '', label: 'Select option...' }, ...opts]}
                      error={errors[item.key]}
                    />
                  );
                } else if (item.fieldType === 'number') {
                  return (
                    <TextField
                      key={item.key}
                      label={
                        <span>
                          {item.label} (Max +{item.maxPoints} pts){' '}
                          {item.isRequired && <span className="text-rose-500 font-extrabold">*</span>}
                        </span>
                      }
                      name={item.key}
                      type="number"
                      value={formData[item.key] || ''}
                      onChange={(val) => handleCustomChange(item.key, val)}
                      disabled={isFormDisabled}
                      placeholder={`0 - ${item.maxPoints}`}
                      error={errors[item.key]}
                    />
                  );
                }
                return null;
              })}

              <div className="pt-3 mt-1 border-t border-slate-100">
                <SelectField
                  label="Manual Status Override"
                  name="status"
                  value={formData.status}
                  onChange={(val) => handleCustomChange('status', val)}
                  disabled={isFormDisabled}
                  options={[
                    { value: '', label: `Auto-compute (${autoStatus})` },
                    { value: 'QUALIFIED', label: 'QUALIFIED' },
                    { value: 'NOT_QUALIFIED', label: 'NOT_QUALIFIED' },
                    { value: 'ON_HOLD', label: 'ON_HOLD' },
                    { value: 'UNQUALIFIED', label: 'UNQUALIFIED' },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="pt-1">
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100 mb-2.5">
            <div className="p-1 rounded-md text-slate-500 bg-slate-100">
              <AlertCircle size={14} />
            </div>
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Details & Remarks</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={(val) => handleCustomChange('notes', val)}
              disabled={isFormDisabled}
              placeholder="Context or missing info..."
              multiline
              rows={2}
              error={errors.notes}
            />

            <TextField
              label={
                <span className="flex items-center gap-1 text-slate-700">
                  Remarks
                  {(formData.status || autoStatus) === 'NOT_QUALIFIED' && (
                    <span className="text-rose-500 font-extrabold text-xs">* (Required)</span>
                  )}
                </span>
              }
              name="remarks"
              value={formData.remarks}
              onChange={(val) => handleCustomChange('remarks', val)}
              disabled={isFormDisabled}
              placeholder="Why is this lead not qualified?"
              multiline
              rows={2}
              error={errors.remarks}
            />
          </div>
        </div>
      </div>
    </DynamicFormModal>
  );
};

export default QualifyLeadModal;
