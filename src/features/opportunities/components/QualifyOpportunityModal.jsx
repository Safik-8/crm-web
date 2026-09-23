// src/features/opportunities/components/QualifyOpportunityModal.jsx
import { useState, useEffect } from 'react';
import { useQualifyOpportunityMutation } from '../hooks/useOpportunities';
import { getQualificationCriteria, getQualificationSettings } from '../../leads/services/qualificationService';
import DynamicFormModal from '../../../shared/components/elements/DynamicFormModal';
import { Target, Calculator, ListChecks, BarChart3, Sparkles } from 'lucide-react';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import Checkbox from '../../../shared/components/elements/Checkbox';
import { toast } from '../../../shared/utils/toast';

const QualifyOpportunityModal = ({ opportunity, isOpen, onClose, onQualified }) => {
  const qualifyMutation = useQualifyOpportunityMutation();

  const [isSyncingData, setIsSyncingData] = useState(true);
  const [criteria, setCriteria] = useState([]);
  const [settings, setSettings] = useState({ passThreshold: 60 });
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;
    if (isOpen && opportunity) {
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
            if (!uniqueMap.has(c.key)) uniqueMap.set(c.key, c);
          });
          const uniqueList = Array.from(uniqueMap.values());
          setCriteria(uniqueList);
          if (fetchedSettings) setSettings(fetchedSettings);
          const initialForm = {};
          (uniqueList || []).forEach((c) => {
            if (c.fieldType === 'boolean') initialForm[c.key] = c.defaultValue === 'true';
            else if (c.fieldType === 'select') initialForm[c.key] = c.defaultValue || '';
            else initialForm[c.key] = c.defaultValue || '';
          });

          // Prefill previously saved answers from qualificationData if present
          const prevAnswers = opportunity.qualificationData?.answers;
          if (prevAnswers && typeof prevAnswers === 'object') {
            Object.keys(prevAnswers).forEach((k) => {
              if (prevAnswers[k] !== undefined && prevAnswers[k] !== null) {
                initialForm[k] = prevAnswers[k];
              }
            });
          }

          setFormData(initialForm);
          setErrors({});
        } catch (err) {
          console.error('Failed to load qualification criteria:', err);
          toast.error('Failed to load qualification criteria settings');
        } finally {
          if (isMounted) setIsSyncingData(false);
        }
      };
      fetchData();
    } else {
      setIsSyncingData(true);
    }
    return () => { isMounted = false; };
  }, [isOpen, opportunity]);

  const computeScore = () => {
    let score = 0;
    criteria.forEach((c) => {
      const val = formData[c.key];
      if (c.fieldType === 'boolean' && Boolean(val)) {
        score += Number(c.maxPoints) || 0;
      } else if (c.fieldType === 'select' && Array.isArray(c.options)) {
        const matchedOpt = c.options.find((opt) => opt.value === val);
        if (matchedOpt) score += Number(matchedOpt.points) || 0;
      } else if (c.fieldType === 'number' && val !== undefined && val !== null && !isNaN(val)) {
        score += Math.min(Number(c.maxPoints) || 0, Math.max(0, Number(val)));
      }
    });
    return Math.min(100, Math.max(0, score));
  };

  const currentScore = computeScore();
  const passThreshold = settings?.passThreshold ?? 60;
  const isPassing = currentScore >= passThreshold;

  const handleCustomChange = (name, value) => {
    if (isSyncingData) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    criteria.forEach((c) => {
      if (c.isRequired) {
        const val = formData[c.key];
        if (val === undefined || val === null || val === '') {
          newErrors[c.key] = `${c.label} is required`;
        }
      }
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error(Object.values(newErrors)[0]);
      setTimeout(() => {
        const firstErrorEl = document.querySelector('.Mui-error, [aria-invalid="true"]');
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof firstErrorEl.focus === 'function') firstErrorEl.focus();
        }
      }, 50);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await qualifyMutation.mutateAsync({ opportunityId: opportunity.id, data: formData });
      if (onQualified) onQualified();
      onClose();
    } catch {
      // Error handled by mutation toast
    }
  };

  if (!isOpen) return null;

  const booleanCriteria = criteria.filter((c) => c.fieldType === 'boolean');
  const selectOrNumberCriteria = criteria.filter((c) => c.fieldType === 'select' || c.fieldType === 'number');
  const isAlreadyQualified = opportunity?.qualificationScore != null;
  const isFormDisabled = isSyncingData || qualifyMutation.isPending;

  return (
    <DynamicFormModal
      isOpen={isOpen}
      onClose={onClose}
      title={isAlreadyQualified ? 'Re-evaluate Opportunity' : 'Qualify Opportunity'}
      icon={Target}
      onSubmit={handleSubmit}
      submitText="Save Score"
      cancelText="Cancel"
      loading={qualifyMutation.isPending || isSyncingData}
      size="md"
    >
      <div className="relative flex flex-col gap-4 max-h-[calc(100vh-220px)] overflow-y-auto overflow-x-hidden p-2 -m-2 scroll-smooth">
        {isSyncingData && (
          <div className="absolute inset-0 z-30 bg-white/85 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 rounded-xl transition-all duration-300">
            <div className="w-9 h-9 border-3 border-orange-500 border-t-transparent rounded-full animate-spin shadow-sm" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-extrabold text-slate-700 tracking-wide">Fetching Company Qualification Matrix...</span>
              <span className="text-[11px] text-slate-400 font-medium">Fields lock until dynamic form finishes loading</span>
            </div>
          </div>
        )}

        {/* Opportunity context banner */}
        <div className="bg-gradient-to-r from-indigo-50 to-orange-50/40 rounded-xl p-3 border border-indigo-100/80 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 shrink-0"><Sparkles size={14} /></div>
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Qualifying Opportunity</div>
            <div className="text-xs font-bold text-slate-800 truncate mt-0.5">{opportunity?.opportunityName || opportunity?.title || `OPP-${opportunity?.id}`}</div>
          </div>
          {isAlreadyQualified && (
            <div className="ml-auto shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black border border-indigo-200">
                🏆 Current: {opportunity.qualificationScore}%
              </span>
            </div>
          )}
        </div>

        {/* Live Score Card */}
        <div className="mt-1 bg-gradient-to-r from-slate-50 to-orange-50/30 rounded-xl p-3.5 border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
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
            <div className="flex-1 max-w-[150px] hidden sm:block">
              <div className="flex justify-between items-center text-[9px] font-extrabold text-slate-400 mb-1">
                <span>PASS: {passThreshold} PTS</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300/40">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${isPassing ? 'bg-emerald-500' : 'bg-orange-400'}`}
                  style={{ width: `${Math.min(Math.max(currentScore, 0), 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end">
            <h3 className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Priority Level</h3>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${currentScore >= 80 ? 'bg-emerald-50 border-emerald-200/80 text-emerald-700' : currentScore >= passThreshold ? 'bg-blue-50 border-blue-200/80 text-blue-700' : currentScore >= 30 ? 'bg-amber-50 border-amber-200/80 text-amber-700' : 'bg-slate-50 border-slate-200/80 text-slate-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${currentScore >= 80 ? 'bg-emerald-500' : currentScore >= passThreshold ? 'bg-blue-500' : currentScore >= 30 ? 'bg-amber-500' : 'bg-slate-400'}`} />
              {currentScore >= 80 ? 'HIGH PRIORITY' : currentScore >= passThreshold ? 'MEDIUM' : currentScore >= 30 ? 'LOW' : 'NOT EVALUATED'}
            </span>
          </div>
        </div>

        {/* Criteria grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Boolean checklist */}
          <div className="md:col-span-7 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md text-orange-500 bg-orange-50"><ListChecks size={14} /></div>
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Checklist</h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400">{booleanCriteria.length} Factors</span>
            </div>
            <div className="flex flex-col gap-2">
              {booleanCriteria.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">No checkbox criteria configured.</div>
              ) : (
                booleanCriteria.map((item) => (
                  <label key={item.key} className={`group relative flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${errors[item.key] ? 'border-rose-300 bg-rose-50/30' : ''} ${formData[item.key] ? 'bg-orange-50/50 border-orange-200 shadow-2xs' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <Checkbox
                      id={`opp-criteria-${item.key}`}
                      checked={Boolean(formData[item.key])}
                      onChange={(checked) => {
                        if (!isFormDisabled) {
                          setFormData((prev) => ({ ...prev, [item.key]: checked }));
                          if (errors[item.key]) setErrors((prev) => ({ ...prev, [item.key]: null }));
                        }
                      }}
                      disabled={isFormDisabled}
                      sx={{ p: 0, width: 'auto' }}
                    />
                    <div className="flex-1 flex justify-between items-center z-10">
                      <div>
                        <div className={`text-xs font-bold transition-colors leading-none flex items-center gap-1 ${formData[item.key] ? 'text-orange-900' : 'text-slate-700'}`}>
                          {item.label}
                          {item.isRequired && <span className="text-rose-500 font-extrabold">*</span>}
                        </div>
                        {item.description && (
                          <div className={`text-[10px] font-medium mt-1 transition-colors leading-none ${formData[item.key] ? 'text-orange-700/70' : 'text-slate-400'}`}>{item.description}</div>
                        )}
                      </div>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md transition-all duration-200 ${formData[item.key] ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>+{item.maxPoints}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Metrics column */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md text-orange-500 bg-orange-50"><BarChart3 size={14} /></div>
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Metrics</h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400">{selectOrNumberCriteria.length} Factors</span>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-200 flex flex-col gap-3 shadow-xs">
              {selectOrNumberCriteria.length === 0 ? (
                <div className="p-3 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-lg border border-dashed border-slate-200">No metric criteria configured.</div>
              ) : (
                selectOrNumberCriteria.map((item) => {
                  if (item.fieldType === 'select') {
                    const opts = (item.options || []).map((opt) => {
                      const cleanLabel = (opt.label || '').replace(/\s*\(\+?\d+.*?\)/g, '').trim();
                      return { value: opt.value, label: `${cleanLabel} (+${opt.points} pts)` };
                    });
                    return (
                      <SelectField
                        key={item.key}
                        label={<span>{item.label} {item.isRequired && <span className="text-rose-500 font-extrabold">*</span>}</span>}
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
                        label={<span>{item.label} (Max +{item.maxPoints} pts) {item.isRequired && <span className="text-rose-500 font-extrabold">*</span>}</span>}
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
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </DynamicFormModal>
  );
};

export default QualifyOpportunityModal;
