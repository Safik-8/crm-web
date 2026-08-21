// FrontEnd/src/features/kpi/pages/KpiSetupPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Target, ArrowLeft, AlertCircle, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '../../../api/axiosClient';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useCreateKpiTarget } from '../hooks/useKpi';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import Button from '../../../shared/components/elements/Button';
import Alert from '../../../shared/components/elements/Alert';

export default function KpiSetupPage() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const createMutation = useCreateKpiTarget();

  const primaryRole = user?.primaryRole || '';
  const rank = user?.primaryRoleRank ?? 0;

  const isSuperAdmin = primaryRole === 'SUPER_ADMIN' || rank >= 100;
  const isCompanyAdmin = primaryRole === 'COMPANY_ADMIN' || rank === 80;
  const isBranchManager = primaryRole === 'BRANCH_MANAGER' || rank === 60;
  
  // Custom permission check
  const canCreate = hasPermission('KPI', 'canCreate') || hasPermission('create:kpi') || isSuperAdmin || isCompanyAdmin || isBranchManager;

  const [assignmentType, setAssignmentType] = useState('INDIVIDUAL'); // 'INDIVIDUAL' | 'TEAM'

  // Helper to format YYYY-MM-DD cleanly without timezone offset bugs
  const formatYMD = (year, monthIndex, dayNum) => {
    const y = String(year);
    const m = String(monthIndex + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDateObjToYMD = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Calculate default start/end dates for a given duration
  const calculateDefaultKpiDates = (duration, baseDate = new Date()) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth(); // 0 - 11

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
        startDate: formatDateObjToYMD(today),
        endDate: formatDateObjToYMD(nextMonth),
      };
    }

    const lastDayNum = new Date(year, month + 1, 0).getDate();
    return {
      startDate: formatYMD(year, month, 1),
      endDate: formatYMD(year, month, lastDayNum),
    };
  };

  const initialDates = calculateDefaultKpiDates('MONTHLY');

  const [formData, setFormData] = useState({
    employeeId: '',
    teamId: '',
    kpiType: 'LEAD',
    targetValue: '',
    duration: 'MONTHLY',
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
  });

  const [formError, setFormError] = useState('');

  // Validate Start Date & End Date against Duration rules
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
    const startMonth = start.getUTCMonth(); // 0-11
    const startDateNum = start.getUTCDate();

    const endYear = end.getUTCFullYear();
    const endMonth = end.getUTCMonth(); // 0-11
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

  // Auto-scoped Fetch Employees Options
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['usersOptionsKpiScoped', user?.companyId, user?.branchId],
    enabled: assignmentType === 'INDIVIDUAL',
    queryFn: async () => {
      const params = new URLSearchParams();
      if (!isSuperAdmin && user?.companyId) params.set('companyId', user.companyId);
      if (isBranchManager && user?.branchId) params.set('branchId', user.branchId);

      const res = await axiosClient.get(`/users?${params.toString()}`);
      const list = Array.isArray(res)
        ? res
        : res.users || res.data?.users || (Array.isArray(res.data) ? res.data : []);
      return list.map((u) => ({
        value: String(u.id),
        label: `${u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email} (${u.employeeId || u.employeeCode || 'User'})`,
      }));
    },
  });

  // Auto-scoped Fetch Teams Options
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery({
    queryKey: ['teamsOptionsKpiScoped', user?.companyId, user?.branchId],
    enabled: assignmentType === 'TEAM',
    queryFn: async () => {
      const params = new URLSearchParams();
      if (!isSuperAdmin && user?.companyId) params.set('companyId', user.companyId);
      if (isBranchManager && user?.branchId) params.set('branchId', user.branchId);

      const res = await axiosClient.get(`/teams?${params.toString()}`);
      const list = Array.isArray(res)
        ? res
        : res.teams || res.data?.teams || (Array.isArray(res.data) ? res.data : []);
      return list.map((t) => ({
        value: String(t.id),
        label: `${t.name} (${t.teamCode || 'Team'})`,
      }));
    },
  });

  // Assignment Type dropdown options
  const assignmentTypeOptions = [
    { value: 'INDIVIDUAL', label: 'Individual Employee' },
    { value: 'TEAM', label: 'Sales Team' },
  ];

  // KPI Type dropdown options
  const kpiTypeOptions = [
    { value: 'LEAD', label: 'Lead Target' },
    { value: 'REVENUE', label: 'Revenue Target (INR)' },
    { value: 'SALES', label: 'Sales Target (INR)' },
    { value: 'OPPORTUNITY', label: 'Opportunity Target' },
    { value: 'CONVERSION', label: 'Conversion Target (%)' },
    { value: 'CUSTOMER', label: 'Customer Acquisition Target' },
  ];

  // Month, Quarter, and Year dropdown options
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

  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth()));
  const [selectedQuarter, setSelectedQuarter] = useState(String(Math.floor(new Date().getMonth() / 3)));
  const [selectedYear, setSelectedYear] = useState(String(currentYearNum));

  const handlePeriodChange = (type, val) => {
    let m = type === 'month' ? Number(val) : Number(selectedMonth);
    let q = type === 'quarter' ? Number(val) : Number(selectedQuarter);
    let y = type === 'year' ? Number(val) : Number(selectedYear);

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
  };

  // Duration dropdown options
  const durationOptions = [
    { value: 'MONTHLY', label: 'Monthly (Full Month)' },
    { value: 'QUARTERLY', label: 'Quarterly (Fixed Quarter)' },
    { value: 'YEARLY', label: 'Yearly (Full Year)' },
    { value: 'CUSTOM_RANGE', label: 'Custom Range (Flexible)' },
  ];

  // KPI Metric configurations
  const metricConfigs = {
    LEAD: { label: 'Target Lead Count', placeholder: 'e.g. 50 (Count)' },
    REVENUE: { label: 'Target Revenue Amount (INR ₹)', placeholder: 'e.g. 500000 (₹)' },
    SALES: { label: 'Target Sales Amount (INR ₹)', placeholder: 'e.g. 1000000 (₹)' },
    OPPORTUNITY: { label: 'Target Opportunity Count', placeholder: 'e.g. 25 (Count)' },
    CONVERSION: { label: 'Target Conversion Rate (%)', placeholder: 'e.g. 30 (%)' },
    CUSTOMER: { label: 'Target Customer Count', placeholder: 'e.g. 10 (Count)' },
  };

  const currentMetric = metricConfigs[formData.kpiType] || metricConfigs.LEAD;

  const handleSelectChange = (field, eOrVal) => {
    const rawVal = eOrVal && typeof eOrVal === 'object' && eOrVal.target ? eOrVal.target.value : eOrVal;

    if (field === 'duration') {
      const newDates = calculateDefaultKpiDates(rawVal);
      setFormData((prev) => ({
        ...prev,
        duration: rawVal,
        startDate: newDates.startDate,
        endDate: newDates.endDate,
      }));
    } else if (field === 'startDate' && rawVal) {
      const dateObj = new Date(rawVal);
      if (!isNaN(dateObj.getTime())) {
        const newDates = calculateDefaultKpiDates(formData.duration, dateObj);
        setFormData((prev) => ({
          ...prev,
          startDate: newDates.startDate,
          endDate: newDates.endDate,
        }));
      } else {
        setFormData((prev) => ({ ...prev, startDate: rawVal }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: rawVal }));
    }

    if (formError) setFormError('');
  };

  const handleAssignmentTypeChange = (eOrVal) => {
    const type = eOrVal && typeof eOrVal === 'object' && eOrVal.target ? eOrVal.target.value : eOrVal;
    setAssignmentType(type);
    setFormData((prev) => ({
      ...prev,
      employeeId: '',
      teamId: '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (assignmentType === 'INDIVIDUAL' && !formData.employeeId) {
      setFormError('Please select an Employee for Individual assignment.');
      return;
    }

    if (assignmentType === 'TEAM' && !formData.teamId) {
      setFormError('Please select a Sales Team for Team assignment.');
      return;
    }

    if (!formData.kpiType || !formData.targetValue || !formData.startDate || !formData.endDate) {
      setFormError('Please fill in all required fields (KPI Type, Target Value, Start Date, End Date).');
      return;
    }

    if (Number(formData.targetValue) <= 0) {
      setFormError('Target Value must be greater than 0.');
      return;
    }

    // Strict Date Validation according to Duration rules
    const dateError = validateKpiDates(formData.duration, formData.startDate, formData.endDate);
    if (dateError) {
      setFormError(dateError);
      return;
    }

    try {
      await createMutation.mutateAsync({
        ...formData,
        assignmentType,
      });
      navigate('/kpi-analytics');
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save KPI target.');
    }
  };

  if (!canCreate) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-8 rounded-none text-center max-w-lg mx-auto my-12 space-y-3">
        <AlertCircle size={36} className="mx-auto text-rose-600" />
        <h3 className="text-lg font-bold">Access Restricted</h3>
        <p className="text-xs text-rose-600">
          You do not have permission (`KPI.canCreate`) to define KPI targets.
        </p>
        <Link to="/my-performance" className="inline-block pt-2 text-xs font-bold text-rose-700 underline">
          Back to My Performance
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Enterprise Page Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Target className="text-orange-500" size={24} />
            <span>KPI Target Management Setup</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Assign individual or team performance targets (auto-scoped to your organization branch).
          </p>
        </div>
      </div>

      {formError && <Alert variant="danger" title="Validation Error" message={formError} />}

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-none p-6 shadow-2xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Assignment Type Selector Dropdown */}
          <SelectField
            label="Assignment Type"
            options={assignmentTypeOptions}
            value={assignmentType}
            onChange={handleAssignmentTypeChange}
            searchable={true}
            required
          />

          {/* Dynamic Selector based on Assignment Type */}
          {assignmentType === 'INDIVIDUAL' ? (
            <SelectField
              label="Select Employee"
              options={users}
              value={formData.employeeId}
              onChange={(val) => handleSelectChange('employeeId', val)}
              searchable={true}
              isLoading={isLoadingUsers}
              placeholder="Search employee by name/code..."
              required
            />
          ) : (
            <SelectField
              label="Select Sales Team"
              options={teams}
              value={formData.teamId}
              onChange={(val) => handleSelectChange('teamId', val)}
              searchable={true}
              isLoading={isLoadingTeams}
              placeholder="Search sales team..."
              required
            />
          )}

          {/* KPI Metric Type */}
          <SelectField
            label="KPI Type"
            options={kpiTypeOptions}
            value={formData.kpiType}
            onChange={(val) => handleSelectChange('kpiType', val)}
            searchable={true}
            required
          />

          {/* Target Value */}
          <TextField
            label={currentMetric.label}
            type="number"
            min="1"
            step="any"
            placeholder={currentMetric.placeholder}
            value={formData.targetValue}
            onChange={(val) => handleSelectChange('targetValue', val)}
            required
          />

          {/* Duration */}
          <SelectField
            label="Duration"
            options={durationOptions}
            value={formData.duration}
            onChange={(val) => handleSelectChange('duration', val)}
            searchable={true}
            required
          />

          {/* Dynamic Period Selectors based on Duration */}
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
                onChange={(val) => handleSelectChange('startDate', val)}
                required
              />
              <TextField
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(val) => handleSelectChange('endDate', val)}
                required
              />
            </div>
          )}

          {/* Auto-Generated Effective Target Timeframe Pill */}
          <div className="md:col-span-2 p-3 bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="text-slate-400">Effective Date Range:</span>
              <span className="bg-orange-100 text-orange-800 px-2.5 py-0.5 font-bold">
                {formData.startDate} &nbsp;—&nbsp; {formData.endDate}
              </span>
              <span className="text-slate-500 font-normal">
                ({formData.duration === 'MONTHLY'
                  ? 'Full Month'
                  : formData.duration === 'QUARTERLY'
                  ? 'Full Quarter'
                  : formData.duration === 'YEARLY'
                  ? 'Full Year'
                  : 'Custom Range'})
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              ✓ {formData.duration === 'CUSTOM_RANGE' ? 'Flexible User Range' : 'Auto-Validated Range'}
            </span>
          </div>
        </div>

        {/* Action Buttons using shared Button component */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link to="/kpi-analytics">
            <Button variant="outlined" color="inherit" type="button" size="medium">
              Cancel
            </Button>
          </Link>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            size="medium"
            isLoading={createMutation.isPending}
            startIcon={<Plus size={16} />}
          >
            Assign KPI Target
          </Button>
        </div>
      </form>
    </div>
  );
}
