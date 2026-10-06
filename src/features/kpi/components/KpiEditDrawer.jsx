// FrontEnd/src/features/kpi/components/KpiEditDrawer.jsx

import React, { useState, useEffect } from 'react';
import { Target, Calendar, AlertCircle, CheckCircle2, User, Users, Building2, HelpCircle, Calculator, Sparkles } from 'lucide-react';
import Drawer from '../../../shared/components/elements/Drawer';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import Button from '../../../shared/components/elements/Button';
import Alert from '../../../shared/components/elements/Alert';
import { useUpdateKpiTarget } from '../hooks/useKpi';
import { toast } from '../../../shared/utils/toast';

export default function KpiEditDrawer({ target, isOpen, onClose, onSuccess }) {
  const updateMutation = useUpdateKpiTarget();

  // Helper to format YYYY-MM-DD cleanly without timezone offset bugs
  const formatYMD = (year, monthIndex, dayNum) => {
    const y = String(year);
    const m = String(monthIndex + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const calculateDefaultKpiDates = (duration, baseDate = new Date()) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    if (duration === 'MONTHLY') {
      const lastDayNum = new Date(year, month + 1, 0).getDate();
      return {
        startDate: formatYMD(year, month, 1),
        endDate: formatYMD(year, month, lastDayNum),
      };
    }

    if (duration === 'QUARTERLY') {
      const quarterIndex = Math.floor(month / 3);
      const quarterRanges = [
        { start: formatYMD(year, 0, 1), end: formatYMD(year, 2, 31) },
        { start: formatYMD(year, 3, 1), end: formatYMD(year, 5, 30) },
        { start: formatYMD(year, 6, 1), end: formatYMD(year, 8, 30) },
        { start: formatYMD(year, 9, 1), end: formatYMD(year, 11, 31) },
      ];
      return {
        startDate: quarterRanges[quarterIndex].start,
        endDate: quarterRanges[quarterIndex].end,
      };
    }

    if (duration === 'YEARLY') {
      return {
        startDate: formatYMD(year, 0, 1),
        endDate: formatYMD(year, 11, 31),
      };
    }

    if (duration === 'CUSTOM_RANGE') {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setDate(today.getDate() + 30);
      return {
        startDate: formatYMD(today.getFullYear(), today.getMonth(), today.getDate()),
        endDate: formatYMD(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonth.getDate()),
      };
    }

    const lastDayNum = new Date(year, month + 1, 0).getDate();
    return {
      startDate: formatYMD(year, month, 1),
      endDate: formatYMD(year, month, lastDayNum),
    };
  };

  const validateKpiDates = (duration, startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) {
      return 'Start Date and End Date are required.';
    }

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Invalid Date format.';
    }

    if (start > end) {
      return 'Start Date cannot be after End Date.';
    }

    const startYear = start.getUTCFullYear();
    const startMonth = start.getUTCMonth();
    const startDateNum = start.getUTCDate();

    const endYear = end.getUTCFullYear();
    const endMonth = end.getUTCMonth();
    const endDateNum = end.getUTCDate();

    if (duration === 'MONTHLY') {
      if (startDateNum !== 1) {
        return 'For Monthly duration, Start Date must be the 1st day of the month.';
      }
      const lastDayOfMonth = new Date(Date.UTC(startYear, startMonth + 1, 0)).getUTCDate();
      if (startYear !== endYear || startMonth !== endMonth || endDateNum !== lastDayOfMonth) {
        return `For Monthly duration, End Date must be the last day of the same month (${startYear}-${String(startMonth + 1).padStart(2, '0')}-${lastDayOfMonth}).`;
      }
    }

    if (duration === 'QUARTERLY') {
      const validQuarters = [
        { startM: 0, startD: 1, endM: 2, endD: 31 },
        { startM: 3, startD: 1, endM: 5, endD: 30 },
        { startM: 6, startD: 1, endM: 8, endD: 30 },
        { startM: 9, startD: 1, endM: 11, endD: 31 },
      ];

      const match = validQuarters.find(
        (q) =>
          startMonth === q.startM &&
          startDateNum === q.startD &&
          endMonth === q.endM &&
          endDateNum === q.endD &&
          startYear === endYear
      );

      if (!match) {
        return 'For Quarterly duration, date range must be a full calendar quarter (Q1: Jan 1-Mar 31, Q2: Apr 1-Jun 30, Q3: Jul 1-Sep 30, Q4: Oct 1-Dec 31).';
      }
    }

    if (duration === 'YEARLY') {
      if (startMonth !== 0 || startDateNum !== 1 || endMonth !== 11 || endDateNum !== 31 || startYear !== endYear) {
        return `For Yearly duration, Start Date must be Jan 1 and End Date must be Dec 31 of the same year.`;
      }
    }

    if (duration === 'CUSTOM_RANGE') {
      if (start > end) {
        return 'For Custom Range, Start Date cannot be after End Date.';
      }
    }

    return null;
  };

  const monthOptions = [
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  const quarterOptions = [
    { value: '0', label: 'Q1 (Jan 1 - Mar 31)' },
    { value: '1', label: 'Q2 (Apr 1 - Jun 30)' },
    { value: '2', label: 'Q3 (Jul 1 - Sep 30)' },
    { value: '3', label: 'Q4 (Oct 1 - Dec 31)' },
  ];

  const currentYearNum = new Date().getFullYear();
  const yearOptions = [
    { value: String(currentYearNum - 1), label: String(currentYearNum - 1) },
    { value: String(currentYearNum), label: String(currentYearNum) },
    { value: String(currentYearNum + 1), label: String(currentYearNum + 1) },
    { value: String(currentYearNum + 2), label: String(currentYearNum + 2) },
  ];

  const durationOptions = [
    { value: 'MONTHLY', label: 'Monthly (Full Month)' },
    { value: 'QUARTERLY', label: 'Quarterly (Fixed Quarter)' },
    { value: 'YEARLY', label: 'Yearly (Full Year)' },
    { value: 'CUSTOM_RANGE', label: 'Custom Range (Flexible)' },
  ];

  const metricConfigs = {
    LEAD: { label: 'Target Lead Count', placeholder: 'e.g. 50 (Count)' },
    REVENUE: { label: 'Target Revenue Amount (INR ₹)', placeholder: 'e.g. 500000 (₹)' },
    SALES: { label: 'Target Sales Amount (INR ₹)', placeholder: 'e.g. 1000000 (₹)' },
    OPPORTUNITY: { label: 'Target Opportunity Count', placeholder: 'e.g. 25 (Count)' },
    CONVERSION: { label: 'Target Conversion Rate (%)', placeholder: 'e.g. 30 (%)' },
    CUSTOMER: { label: 'Target Customer Count', placeholder: 'e.g. 10 (Count)' },
  };

  // Simple user-friendly KPI Type descriptions & examples
  const kpiTypeExplanations = {
    LEAD: {
      title: 'Lead Target',
      description: 'Sets a goal for how many new sales leads should be brought in or assigned during this time period.',
      example: 'If set to 50, the goal is to receive or create 50 leads.',
    },
    REVENUE: {
      title: 'Revenue Target',
      description: 'Sets a financial revenue goal based on the total money made from won deals and closed contracts.',
      example: 'If set to ₹5,00,000, the goal is to close ₹5 Lakhs in won deals.',
    },
    SALES: {
      title: 'Sales Target',
      description: 'Sets an overall sales amount goal to be achieved across all sales deals and bookings.',
      example: 'If set to ₹10,00,000, the goal is to generate ₹10 Lakhs in sales.',
    },
    OPPORTUNITY: {
      title: 'Opportunity Target',
      description: 'Sets a goal for the number of qualified sales opportunities nurtured and managed in the sales pipeline.',
      example: 'If set to 25, the goal is to build and manage 25 sales opportunities.',
    },
    CONVERSION: {
      title: 'Conversion Target',
      description: 'Sets an efficiency percentage goal for how many assigned leads are successfully converted into won deals.',
      example: 'If set to 30%, the goal is to convert at least 30 out of every 100 leads into won deals.',
    },
    CUSTOMER: {
      title: 'Customer Acquisition Target',
      description: 'Sets a goal for how many new paying customer accounts should be acquired and onboarded.',
      example: 'If set to 10, the goal is to bring in 10 brand new paying customers.',
    },
  };

  const [formData, setFormData] = useState({
    targetValue: '',
    duration: 'MONTHLY',
    startDate: '',
    endDate: '',
  });

  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth()));
  const [selectedQuarter, setSelectedQuarter] = useState(String(Math.floor(new Date().getMonth() / 3)));
  const [selectedYear, setSelectedYear] = useState(String(currentYearNum));
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');

  // Synchronize state when target or drawer open changes
  useEffect(() => {
    if (target && isOpen) {
      const dur = target.duration || 'MONTHLY';
      const start = target.startDate ? target.startDate.split('T')[0] : '';
      const end = target.endDate ? target.endDate.split('T')[0] : '';

      setFormData({
        targetValue: String(target.targetValue || ''),
        duration: dur,
        startDate: start,
        endDate: end,
      });

      if (start) {
        const d = new Date(start);
        if (!isNaN(d.getTime())) {
          setSelectedMonth(String(d.getUTCMonth()));
          setSelectedQuarter(String(Math.floor(d.getUTCMonth() / 3)));
          setSelectedYear(String(d.getUTCFullYear()));
        }
      }

      setFieldErrors({});
      setFormError('');
    }
  }, [target, isOpen]);

  const handlePeriodChange = (type, val) => {
    const m = type === 'month' ? Number(val) : Number(selectedMonth);
    const q = type === 'quarter' ? Number(val) : Number(selectedQuarter);
    const y = type === 'year' ? Number(val) : Number(selectedYear);

    if (type === 'month') setSelectedMonth(val);
    if (type === 'quarter') setSelectedQuarter(val);
    if (type === 'year') setSelectedYear(val);

    let start = '';
    let end = '';

    if (formData.duration === 'MONTHLY') {
      const lastDayNum = new Date(y, m + 1, 0).getDate();
      start = formatYMD(y, m, 1);
      end = formatYMD(y, m, lastDayNum);
    } else if (formData.duration === 'QUARTERLY') {
      const quarterRanges = [
        { start: formatYMD(y, 0, 1), end: formatYMD(y, 2, 31) },
        { start: formatYMD(y, 3, 1), end: formatYMD(y, 5, 30) },
        { start: formatYMD(y, 6, 1), end: formatYMD(y, 8, 30) },
        { start: formatYMD(y, 9, 1), end: formatYMD(y, 11, 31) },
      ];
      start = quarterRanges[q].start;
      end = quarterRanges[q].end;
    } else if (formData.duration === 'YEARLY') {
      start = formatYMD(y, 0, 1);
      end = formatYMD(y, 11, 31);
    }

    setFormData((prev) => ({
      ...prev,
      startDate: start,
      endDate: end,
    }));

    setFieldErrors((prev) => {
      const updated = { ...prev };
      delete updated.duration;
      delete updated.startDate;
      delete updated.endDate;
      return updated;
    });
    if (formError) setFormError('');
  };

  const handleDurationChange = (val) => {
    const dur = val;
    let newDates;

    if (dur === 'MONTHLY') {
      const m = Number(selectedMonth);
      const y = Number(selectedYear);
      const lastDay = new Date(y, m + 1, 0).getDate();
      newDates = { startDate: formatYMD(y, m, 1), endDate: formatYMD(y, m, lastDay) };
    } else if (dur === 'QUARTERLY') {
      const q = Number(selectedQuarter);
      const y = Number(selectedYear);
      const quarterRanges = [
        { start: formatYMD(y, 0, 1), end: formatYMD(y, 2, 31) },
        { start: formatYMD(y, 3, 1), end: formatYMD(y, 5, 30) },
        { start: formatYMD(y, 6, 1), end: formatYMD(y, 8, 30) },
        { start: formatYMD(y, 9, 1), end: formatYMD(y, 11, 31) },
      ];
      newDates = { startDate: quarterRanges[q].start, endDate: quarterRanges[q].end };
    } else if (dur === 'YEARLY') {
      const y = Number(selectedYear);
      newDates = { startDate: formatYMD(y, 0, 1), endDate: formatYMD(y, 11, 31) };
    } else {
      newDates = calculateDefaultKpiDates('CUSTOM_RANGE');
    }

    setFormData((prev) => ({
      ...prev,
      duration: dur,
      startDate: newDates.startDate,
      endDate: newDates.endDate,
    }));

    setFieldErrors((prev) => {
      const updated = { ...prev };
      delete updated.duration;
      return updated;
    });
  };

  const handleDateChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setFieldErrors((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const val = Number(formData.targetValue);
    const errors = {};

    if (!formData.targetValue || isNaN(val) || val <= 0) {
      errors.targetValue = 'Target value must be greater than 0.';
    }

    if (formData.startDate && formData.endDate) {
      const dateError = validateKpiDates(formData.duration, formData.startDate, formData.endDate);
      if (dateError) {
        if (formData.duration === 'CUSTOM_RANGE') {
          errors.endDate = dateError;
        } else {
          errors.duration = dateError;
        }
      }
    } else {
      errors.startDate = 'Start Date and End Date are required.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstMsg = Object.values(errors)[0];
      toast.error(firstMsg || 'Please correct validation errors.');
      return;
    }

    const payload = {
      targetValue: val,
      duration: formData.duration,
      startDate: formData.startDate,
      endDate: formData.endDate,
    };

    const toastId = toast.loading('Updating target...');
    try {
      await updateMutation.mutateAsync({ id: target.id, data: payload });
      toast.success('KPI target updated successfully.', { id: toastId });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update KPI target.';
      setFormError(msg);
      toast.error(msg, { id: toastId });
    }
  };

  if (!target) return null;

  const currentMetric = metricConfigs[target.kpiType] || metricConfigs.LEAD;
  const currentExplanation = kpiTypeExplanations[target.kpiType] || kpiTypeExplanations.LEAD;
  const entityName = target.employee?.name || target.team?.name || target.branch?.name || 'General Target';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Edit KPI Target"
      subtitle={`Update parameters & duration for ${target.kpiType} Target`}
      width={{ xs: '100%', sm: 540, md: 580 }}
    >
      <form onSubmit={handleSubmit} className="space-y-6 pb-6">
        {formError && (
          <Alert severity="error" title="Update Error" onClose={() => setFormError('')}>
            {formError}
          </Alert>
        )}

        {/* Target Assignment Overview Card */}
        {(() => {
          const isTeam = target.scopeType === 'TEAM' || Boolean((target.teamId || target.team) && !target.employeeId);
          return (
            <div className="p-4 bg-slate-50 border border-slate-200/80 space-y-2.5 rounded-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-slate-100 text-slate-700 rounded-none">
                    <Target size={16} />
                  </span>
                  <span className="font-bold text-slate-900 text-sm capitalize">
                    {target.kpiType} Target
                  </span>
                </div>
                {isTeam ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-none">
                    <Users size={12} className="text-orange-600" />
                    <span>Team Target</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-none">
                    <User size={12} className="text-slate-500" />
                    <span>Individual</span>
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                {isTeam ? <Users size={14} className="text-slate-400" /> : <User size={14} className="text-slate-400" />}
                <span className="font-semibold text-slate-700">{isTeam ? 'Assigned Team:' : 'Assigned Employee:'}</span>
                <span className="font-bold text-slate-900">{entityName}</span>
              </div>
            </div>
          );
        })()}

        {/* Target Value Field */}
        <div className="space-y-1">
          <TextField
            label={currentMetric.label}
            type="number"
            min="1"
            step="any"
            placeholder={currentMetric.placeholder}
            value={formData.targetValue}
            onChange={(val) => {
              setFormData((prev) => ({ ...prev, targetValue: val }));
              if (fieldErrors.targetValue) {
                setFieldErrors((prev) => {
                  const updated = { ...prev };
                  delete updated.targetValue;
                  return updated;
                });
              }
            }}
            required
            errorText={fieldErrors.targetValue}
          />
        </div>

        {/* Duration Selector */}
        <div className="space-y-1">
          <SelectField
            label="Duration"
            options={durationOptions}
            value={formData.duration}
            onChange={handleDurationChange}
            searchable={true}
            required
            errorText={fieldErrors.duration}
          />
        </div>

        {/* Dynamic Period Selectors matching KPI Setup */}
        {formData.duration === 'MONTHLY' && (
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Target Month"
              options={monthOptions}
              value={selectedMonth}
              onChange={(val) => handlePeriodChange('month', val)}
              searchable={true}
              required
            />
            <SelectField
              label="Target Year"
              options={yearOptions}
              value={selectedYear}
              onChange={(val) => handlePeriodChange('year', val)}
              searchable={true}
              required
            />
          </div>
        )}

        {formData.duration === 'QUARTERLY' && (
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Target Quarter"
              options={quarterOptions}
              value={selectedQuarter}
              onChange={(val) => handlePeriodChange('quarter', val)}
              searchable={true}
              required
            />
            <SelectField
              label="Target Year"
              options={yearOptions}
              value={selectedYear}
              onChange={(val) => handlePeriodChange('year', val)}
              searchable={true}
              required
            />
          </div>
        )}

        {formData.duration === 'YEARLY' && (
          <SelectField
            label="Target Year"
            options={yearOptions}
            value={selectedYear}
            onChange={(val) => handlePeriodChange('year', val)}
            searchable={true}
            required
          />
        )}

        {formData.duration === 'CUSTOM_RANGE' && (
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(val) => handleDateChange('startDate', val)}
              required
              errorText={fieldErrors.startDate}
            />
            <TextField
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(val) => handleDateChange('endDate', val)}
              required
              errorText={fieldErrors.endDate}
            />
          </div>
        )}

        {/* Auto-Generated Effective Target Timeframe Pill */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span className="text-slate-400">Effective Date Range:</span>
            <span className="bg-orange-100 text-orange-800 px-2.5 py-0.5 font-bold inline-block">
              {formData.startDate || 'YYYY-MM-DD'} &nbsp;—&nbsp; {formData.endDate || 'YYYY-MM-DD'}
            </span>
          </div>
          {(() => {
            const hasDateErrors = Boolean(fieldErrors.startDate || fieldErrors.endDate || fieldErrors.duration);
            return hasDateErrors ? (
              <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 shrink-0">
                ⚠ Check Dates
              </span>
            ) : (
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 shrink-0">
                ✓ Validated
              </span>
            );
          })()}
        </div>

        {/* Simple Dynamic KPI Type Explanation Guide Card */}
        <div className="border border-slate-200 bg-slate-50/70 p-4 rounded-none space-y-3">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-orange-100 text-orange-700 rounded-none">
              <Target size={15} />
            </span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {currentExplanation.title} Overview
            </h4>
          </div>

          <div className="space-y-2 text-xs">
            {/* Simple Description */}
            <div className="bg-white border border-slate-200/80 p-3 space-y-1">
              <span className="font-bold text-slate-700 block text-[11.5px]">
                What is this Target?
              </span>
              <p className="text-slate-600 leading-relaxed text-[11.5px]">
                {currentExplanation.description}
              </p>
            </div>

            {/* Simple Example */}
            <div className="bg-white border border-slate-200/80 p-3 space-y-1">
              <span className="font-bold text-slate-700 block text-[11.5px]">
                Example:
              </span>
              <p className="text-slate-600 leading-relaxed text-[11.5px]">
                {currentExplanation.example}
              </p>
            </div>
          </div>
        </div>

        {/* Form Action Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <Button variant="outlined" color="inherit" type="button" onClick={onClose} disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            isLoading={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
