import React, { useState, useEffect } from 'react';
import { useQualifyLeadMutation } from '../hooks/useQualification';
import DynamicFormModal from '../../../shared/components/elements/DynamicFormModal';
import { Target, CheckCircle2, Calculator, Check, AlertCircle, BarChart3, ListChecks } from 'lucide-react';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import { toast } from '../../../shared/utils/toast';

const QualifyLeadModal = ({ lead, isOpen, onClose, onQualified }) => {
  const qualifyMutation = useQualifyLeadMutation();

  const [isSyncingData, setIsSyncingData] = useState(true);
  const [formData, setFormData] = useState({
    budgetAvailable: false,
    interestLevel: 'LOW',
    purchaseTimeline: '',
    decisionMakerAvailable: false,
    productFit: false,
    status: '',
    notes: '',
    remarks: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && lead) {
      setIsSyncingData(true);
      const q = lead.qualification || lead.leadQualification;
      if (q) {
        const isExplicitOverride = q.status === 'ON_HOLD' || q.status === 'UNQUALIFIED';
        setFormData({
          budgetAvailable: Boolean(q.budgetAvailable),
          interestLevel: q.interestLevel || 'LOW',
          purchaseTimeline: q.purchaseTimeline || '',
          decisionMakerAvailable: Boolean(q.decisionMakerAvailable),
          productFit: Boolean(q.productFit),
          status: isExplicitOverride ? q.status : '',
          notes: q.notes || '',
          remarks: q.remarks || ''
        });
      } else {
        setFormData({
          budgetAvailable: false,
          interestLevel: 'LOW',
          purchaseTimeline: '',
          decisionMakerAvailable: false,
          productFit: false,
          status: '',
          notes: '',
          remarks: ''
        });
      }
      setErrors({});

      const timer = setTimeout(() => {
        setIsSyncingData(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setIsSyncingData(true);
    }
  }, [isOpen, lead]);

  // Compute live score
  const computeScore = () => {
    let score = 0;
    if (formData.budgetAvailable) score += 25;
    if (formData.decisionMakerAvailable) score += 15;
    if (formData.productFit) score += 15;

    if (formData.interestLevel === 'HIGH') score += 25;
    else if (formData.interestLevel === 'MEDIUM') score += 15;
    else if (formData.interestLevel === 'LOW') score += 5;

    if (formData.purchaseTimeline === 'IMMEDIATE') score += 20;
    else if (formData.purchaseTimeline === '1_MONTH') score += 15;
    else if (formData.purchaseTimeline === '3_MONTHS') score += 10;
    else if (formData.purchaseTimeline === 'EXPLORATORY') score += 5;
    return score;
  };

  const currentScore = computeScore();
  const autoStatus = currentScore >= 60 ? 'QUALIFIED' : 'NOT_QUALIFIED';

  const handleChange = (e) => {
    if (isSyncingData) return;
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      status: '' // Reset manual override so auto-compute score dynamically updates on checklist edits
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCustomChange = (name, value) => {
    if (isSyncingData) return;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name !== 'status' && { status: '' }) // Reset manual override on metric edits
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const finalStatus = formData.status || autoStatus;

    if (finalStatus === 'NOT_QUALIFIED' && !formData.remarks?.trim()) {
      newErrors.remarks = 'Remarks are required when marking as Not Qualified';
    }
    if (finalStatus === 'ON_HOLD' && !formData.notes?.trim()) {
      newErrors.notes = 'Notes are required when marking as On Hold';
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
      budgetAvailable: Boolean(formData.budgetAvailable),
      interestLevel: formData.interestLevel || 'LOW',
      purchaseTimeline: formData.purchaseTimeline || null,
      decisionMakerAvailable: Boolean(formData.decisionMakerAvailable),
      productFit: Boolean(formData.productFit),
      status: formData.status || autoStatus,
      notes: formData.notes?.trim() || undefined,
      remarks: formData.remarks?.trim() || undefined
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

  const checklistItems = [
    { name: 'budgetAvailable', label: 'Budget Available', points: '+25', desc: 'Client has confirmed budget' },
    { name: 'decisionMakerAvailable', label: 'Decision Maker Reached', points: '+15', desc: 'Direct contact with buyer' },
    { name: 'productFit', label: 'Product Fit Verified', points: '+15', desc: 'Needs align with our offering' },
  ];

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
                Fetching Previous Evaluation Data...
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Fields are locked until pre-fill completes
              </span>
            </div>
          </div>
        )}
        
        {/* Compact Enterprise Score Card */}
        <div className="mt-3 bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 flex items-center gap-6">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Calculator size={12} className="text-slate-400" />
                <h3 className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase">Live Score</h3>
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl font-black text-slate-800 tracking-tight leading-none">{currentScore}</span>
                <span className="text-sm font-bold text-slate-400">/ 100</span>
              </div>
            </div>
            
            {/* Simple progress bar */}
            <div className="flex-1 max-w-[150px] hidden sm:block">
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                 <div 
                   className={`h-full rounded-full transition-all duration-500 ease-out ${
                     currentScore >= 80 ? 'bg-emerald-500' : 
                     currentScore >= 60 ? 'bg-teal-500' : 
                     currentScore >= 40 ? 'bg-amber-500' : 
                     'bg-rose-500'
                   }`}
                   style={{ width: `${Math.min(Math.max(currentScore, 0), 100)}%` }}
                 />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-start sm:items-end">
            <h3 className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Computed Status</h3>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                (formData.status || autoStatus) === 'QUALIFIED' 
                  ? 'bg-emerald-50 border-emerald-200/60 text-emerald-700' :
                (formData.status || autoStatus) === 'ON_HOLD' 
                  ? 'bg-amber-50 border-amber-200/60 text-amber-700' :
                  'bg-rose-50 border-rose-200/60 text-rose-700'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                  (formData.status || autoStatus) === 'QUALIFIED' ? 'bg-emerald-500' :
                  (formData.status || autoStatus) === 'ON_HOLD' ? 'bg-amber-500' : 'bg-rose-500'
              }`} />
              {formData.status || autoStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Checklist Column (Left) */}
          <div className="md:col-span-7 flex flex-col gap-3">
            <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <div className="p-1 rounded-md text-orange-500 bg-orange-50">
                <ListChecks size={14} />
              </div>
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Checklist</h4>
            </div>
            
            <div className="flex flex-col gap-2">
              {checklistItems.map(item => (
                <label key={item.name} className={`
                  group relative flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200
                  border
                  ${formData[item.name] 
                    ? 'bg-orange-50/50 border-orange-200' 
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                `}>
                  <div className={`
                    flex-shrink-0 flex items-center justify-center w-4 h-4 rounded-md border transition-all duration-200
                    ${formData[item.name]
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'border-slate-300 bg-white text-transparent group-hover:border-orange-300'
                    }
                  `}>
                    <Check size={10} strokeWidth={4} className={formData[item.name] ? 'opacity-100' : 'opacity-0'} />
                  </div>
                  <input type="checkbox" name={item.name} checked={formData[item.name]} onChange={handleChange} disabled={isFormDisabled} className="sr-only" />
                  
                  <div className="flex-1 flex justify-between items-center z-10">
                    <div>
                      <div className={`text-xs font-bold transition-colors leading-none ${
                        formData[item.name] ? 'text-orange-900' : 'text-slate-700'
                      }`}>
                        {item.label}
                      </div>
                      <div className={`text-[10px] font-medium mt-1 transition-colors leading-none ${
                        formData[item.name] ? 'text-orange-700/70' : 'text-slate-400'
                      }`}>
                        {item.desc}
                      </div>
                    </div>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md transition-all duration-200 ${
                      formData[item.name] 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {item.points}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Metrics Column (Right) */}
          <div className="md:col-span-5 flex flex-col gap-3">
             <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <div className="p-1 rounded-md text-orange-500 bg-orange-50">
                <BarChart3 size={14} />
              </div>
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Metrics</h4>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-200 flex flex-col gap-3 shadow-sm">
              <SelectField
                label="Interest Level"
                name="interestLevel"
                value={formData.interestLevel}
                onChange={(val) => handleCustomChange('interestLevel', val)}
                disabled={isFormDisabled}
                options={[
                  { value: 'HIGH', label: 'High (+25)' },
                  { value: 'MEDIUM', label: 'Medium (+15)' },
                  { value: 'LOW', label: 'Low (+5)' }
                ]}
                required
              />

              <SelectField
                label="Purchase Timeline"
                name="purchaseTimeline"
                value={formData.purchaseTimeline}
                onChange={(val) => handleCustomChange('purchaseTimeline', val)}
                disabled={isFormDisabled}
                options={[
                  { value: '', label: 'Unknown' },
                  { value: 'IMMEDIATE', label: 'Immediate (+20)' },
                  { value: '1_MONTH', label: 'Within 1 Month (+15)' },
                  { value: '3_MONTHS', label: 'Within 3 Months (+10)' },
                  { value: 'EXPLORATORY', label: 'Exploratory (+5)' }
                ]}
              />

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
                    { value: 'UNQUALIFIED', label: 'UNQUALIFIED' }
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
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Details</h4>
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
              rows={1}
              error={errors.notes}
            />

            <TextField
              label="Remarks (Disqualification)"
              name="remarks"
              value={formData.remarks}
              onChange={(val) => handleCustomChange('remarks', val)}
              disabled={isFormDisabled}
              placeholder="Why is this lead not qualified?"
              multiline
              rows={1}
              error={errors.remarks}
            />
          </div>
        </div>
      </div>
    </DynamicFormModal>
  );
};

export default QualifyLeadModal;
