import React, { useState, useEffect } from 'react';
import { Filter, Calendar, RotateCcw, Play, Check, Eye } from 'lucide-react';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import Button from '../../../shared/components/elements/Button';
import { useAuth } from '../../../app/providers/AuthProvider';
import { apiClient } from '../../../lib/api/api';
import { toast } from '../../../shared/utils/toast';
const ReportBuilder = ({ reportType, onGenerate, currentFilters = {}, onChangeFilters, onOptionsLoaded, loading }) => {
  const { user, hasPermission } = useAuth();
  const rank = user?.primaryRoleRank ? Number(user.primaryRoleRank) : 0;
  const canCreate = hasPermission('REPORT', 'canCreate');
  // Loader and dynamic options states
  const [loadingFields, setLoadingFields] = useState({
    companies: false,
    branches: false,
    teams: false,
    employees: false,
    metadata: false
  });

  const [options, setOptions] = useState({
    companies: [],
    branches: [],
    teams: [],
    employees: [],
    courses: [],
    leadStatuses: [],
    opportunityStages: [],
    leadSources: []
  });

  const [errorFields, setErrorFields] = useState({});
  const [userTeam, setUserTeam] = useState(null);
  const [hasTeamChecked, setHasTeamChecked] = useState(false);

  // Fetch active team membership of logged-in user
  useEffect(() => {
    const checkTeamMembership = async () => {
      if (rank > 0 && rank < 60 && user?.id) {
        try {
          const res = await apiClient('/teams/membership/active', { silent: true });
          if (res?.success && res.data?.team) {
            setUserTeam(res.data.team);
          }
        } catch (err) {
          console.error('Failed to fetch team membership', err);
        } finally {
          setHasTeamChecked(true);
        }
      } else {
        setHasTeamChecked(true);
      }
    };
    checkTeamMembership();
  }, [rank, user?.id]);

  // Share option mapping details with parent components
  useEffect(() => {
    if (onOptionsLoaded) {
      onOptionsLoaded(options);
    }
  }, [options, onOptionsLoaded]);

  // Role permissions mappings
  const isSuper = rank >= 100;
  const isAdmin = rank >= 80 && rank < 100;
  const isManager = rank >= 60 && rank < 80;
  const isSales = rank > 0 && rank < 60;

  // Default viewMode based on user roles (Admin = Org, Manager = Team, Sales = Individual)
  const defaultMode = isSales ? 'INDIVIDUAL' : (isManager ? 'TEAM' : 'ORGANIZATION');

  // Reactively initialize viewMode when component mounts or filters are cleared
  useEffect(() => {
    if (!currentFilters.viewMode) {
      onChangeFilters({
        ...currentFilters,
        viewMode: defaultMode,
        startDate: currentFilters.startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: currentFilters.endDate || new Date().toISOString().split('T')[0],
        companyId: currentFilters.companyId || user?.companyId || '',
        branchId: currentFilters.branchId || ((!isSuper && !isAdmin) ? (user?.branchId || '') : ''),
        employeeId: isSales ? (user?.id || '') : (currentFilters.employeeId || ''),
        teamId: userTeam ? String(userTeam.id) : (currentFilters.teamId || '')
      });
    }
  }, [currentFilters.viewMode, defaultMode, userTeam]);

  // Auto-assign teamId filter if user belongs to a team and is sales agent
  useEffect(() => {
    if (isSales && userTeam && currentFilters.teamId !== String(userTeam.id)) {
      onChangeFilters(prev => ({ ...prev, teamId: String(userTeam.id) }));
    }
  }, [userTeam, isSales, currentFilters.teamId]);

  // Format Helper
  const formatOptions = (arr, labelKey = 'name', valKey = 'id') => {
    if (!Array.isArray(arr)) return [];
    return arr.map(item => ({
      id: String(item[valKey]),
      name: item[labelKey] || item.name || item.label || String(item[valKey])
    }));
  };

  // Load company-scoped configuration data (Courses, Lead Statuses, Opportunity Stages, Lead Sources)
  const loadCompanyScopedData = async (companyId) => {
    setLoadingFields(prev => ({ ...prev, metadata: true }));
    try {
      const companyQuery = companyId ? `?companyId=${companyId}` : '';
      const fetches = [
        apiClient(`/courses${companyQuery}`, { silent: true }).then(res => ({ type: 'courses', res })),
        apiClient(`/lead-statuses${companyQuery}`, { silent: true }).then(res => ({ type: 'leadStatuses', res })),
        apiClient(`/opportunities/stages${companyQuery}`, { silent: true }).then(res => ({ type: 'opportunityStages', res })),
        apiClient(`/lead-sources${companyQuery}`, { silent: true }).then(res => ({ type: 'leadSources', res }))
      ];

      const results = await Promise.allSettled(fetches);
      const dataMap = {};

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const { type, res } = result.value;
          dataMap[type] = res?.data || [];
        }
      });

      const courses = dataMap.courses?.courses || dataMap.courses?.items || (Array.isArray(dataMap.courses) ? dataMap.courses : []);
      const leadStatuses = dataMap.leadStatuses?.statuses || dataMap.leadStatuses?.leadStatuses || dataMap.leadStatuses?.items || (Array.isArray(dataMap.leadStatuses) ? dataMap.leadStatuses : []);
      const opportunityStages = dataMap.opportunityStages?.stages || dataMap.opportunityStages?.items || (Array.isArray(dataMap.opportunityStages) ? dataMap.opportunityStages : []);
      const leadSources = dataMap.leadSources?.sources || dataMap.leadSources?.leadSources || dataMap.leadSources?.items || (Array.isArray(dataMap.leadSources) ? dataMap.leadSources : []);

      setOptions(prev => ({
        ...prev,
        courses: formatOptions(courses),
        leadStatuses: formatOptions(leadStatuses),
        opportunityStages: formatOptions(opportunityStages),
        leadSources: formatOptions(leadSources)
      }));
    } catch (err) {
      console.error('Failed to load company scoped metadata', err);
    } finally {
      setLoadingFields(prev => ({ ...prev, metadata: false }));
    }
  };



  // Reactively fetch company-scoped configuration data and branches
  useEffect(() => {
    const activeCompanyId = currentFilters.companyId || user?.companyId || '';
    loadCompanyScopedData(activeCompanyId);

    if (isSuper || isAdmin) {
      loadBranches(activeCompanyId);
    }
  }, [currentFilters.companyId, user?.companyId, isSuper, isAdmin]);

  // Reactively load branch-scoped data (teams and branch employees)
  useEffect(() => {
    const activeBranchId = currentFilters.branchId || ((!isSuper && !isAdmin) ? (user?.branchId || '') : '');
    const activeCompanyId = currentFilters.companyId || user?.companyId || '';
    
    loadTeams(activeBranchId, activeCompanyId);
    if (!currentFilters.teamId) {
      loadBranchEmployees(activeBranchId, activeCompanyId);
    }
  }, [currentFilters.branchId, currentFilters.companyId, user?.branchId, user?.companyId, isSuper, isAdmin]);

  // Reactively load team-scoped employees
  useEffect(() => {
    if (currentFilters.teamId) {
      loadTeamEmployees(currentFilters.teamId);
    } else {
      const activeBranchId = currentFilters.branchId || ((!isSuper && !isAdmin) ? (user?.branchId || '') : '');
      const activeCompanyId = currentFilters.companyId || user?.companyId || '';
      loadBranchEmployees(activeBranchId, activeCompanyId);
    }
  }, [currentFilters.teamId, currentFilters.branchId, currentFilters.companyId, user?.branchId, user?.companyId, isSuper, isAdmin]);

  // Mount fetch: Load base static tables (e.g. companies list for Super Admin)
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        if (isSuper) {
          setLoadingFields(prev => ({ ...prev, companies: true }));
          const res = await apiClient('/companies', { silent: true });
          const companies = res?.data?.companies || res?.data?.items || res?.data || [];
          setOptions(prev => ({ ...prev, companies: formatOptions(companies) }));
        }
      } catch (err) {
        console.error('Failed to load base companies table', err);
      } finally {
        setLoadingFields(prev => ({ ...prev, companies: false }));
      }
    };

    fetchBaseData();
  }, [isSuper]);

  // Load branches of selected company
  const loadBranches = async (companyId) => {
    setLoadingFields(prev => ({ ...prev, branches: true }));
    try {
      const res = await apiClient(`/branches?company_id=${companyId}`, { silent: true });
      const branchItems = res?.data?.branches || res?.data?.items || [];
      setOptions(prev => ({ ...prev, branches: formatOptions(branchItems) }));
    } catch {
      setOptions(prev => ({ ...prev, branches: [] }));
    } finally {
      setLoadingFields(prev => ({ ...prev, branches: false }));
    }
  };

  // Load teams of selected branch
  const loadTeams = async (branchId, companyId = '') => {
    setLoadingFields(prev => ({ ...prev, teams: true }));
    try {
      const companyQuery = companyId ? `&companyId=${companyId}` : '';
      const res = await apiClient(`/teams?branchId=${branchId}${companyQuery}`, { silent: true });
      const teamItems = res?.data?.teams || res?.data?.items || [];
      setOptions(prev => ({ ...prev, teams: formatOptions(teamItems) }));
    } catch {
      setOptions(prev => ({ ...prev, teams: [] }));
    } finally {
      setLoadingFields(prev => ({ ...prev, teams: false }));
    }
  };

  // Load ALL allowed branch employees
  const loadBranchEmployees = async (branchId, companyId = '') => {
    setLoadingFields(prev => ({ ...prev, employees: true }));
    try {
      const companyQuery = companyId ? `&companyId=${companyId}` : '';
      const res = await apiClient(`/users?branchId=${branchId}${companyQuery}`, { silent: true });
      const userList = res?.data?.users || res?.data?.items || res?.data || [];
      setOptions(prev => ({ ...prev, employees: formatOptions(userList) }));
    } catch {
      setOptions(prev => ({ ...prev, employees: [] }));
    } finally {
      setLoadingFields(prev => ({ ...prev, employees: false }));
    }
  };

  // Load and filter by team members
  const loadTeamEmployees = async (teamId) => {
    setLoadingFields(prev => ({ ...prev, employees: true }));
    try {
      const res = await apiClient(`/teams/${teamId}`, { silent: true });
      const members = res?.data?.team?.members || [];
      const userList = members.map(m => m.user).filter(Boolean);
      setOptions(prev => ({ ...prev, employees: formatOptions(userList) }));
    } catch {
      setOptions(prev => ({ ...prev, employees: [] }));
    } finally {
      setLoadingFields(prev => ({ ...prev, employees: false }));
    }
  };

  // Dynamic progressive overrides & resets
  const handleFieldChange = (name, val) => {
    const nextFilters = { ...currentFilters, [name]: val };

    if (name === 'companyId') {
      nextFilters.branchId = '';
      nextFilters.teamId = '';
      nextFilters.employeeId = '';
      // Clear report-specific company-scoped metadata filters
      nextFilters.statusId = '';
      nextFilters.courseId = '';
      nextFilters.productId = '';
      nextFilters.purchasedProductId = '';
      nextFilters.sourceId = '';
      nextFilters.stageId = '';
      nextFilters.status = '';
      nextFilters.outcome = '';
      nextFilters.paymentStatus = '';
    }

    if (name === 'branchId') {
      nextFilters.teamId = '';
      nextFilters.employeeId = '';
    }

    if (name === 'teamId') {
      nextFilters.employeeId = '';
    }

    if (name === 'viewMode') {
      if (val === 'TEAM' || val === 'ORGANIZATION') {
        nextFilters.employeeId = '';
      }
      if (val === 'INDIVIDUAL') {
        nextFilters.employeeId = isSales ? user?.id : '';
        nextFilters.teamId = isSales && userTeam ? String(userTeam.id) : '';
      }
    }

    onChangeFilters(nextFilters);
    setErrorFields(prev => ({ ...prev, [name]: '' }));
  };

  const handleReset = () => {
    const defaultFilters = {
      viewMode: defaultMode,
      companyId: user?.companyId || '',
      branchId: (!isSuper && !isAdmin) ? (user?.branchId || '') : '',
      teamId: isSales && userTeam ? String(userTeam.id) : '',
      employeeId: isSales ? (user?.id || '') : '',
      startDate: '',
      endDate: '',
      status: '',
      statusId: '',
      courseId: '',
      productId: '',
      purchasedProductId: '',
      sourceId: '',
      stageId: '',
      outcome: '',
      paymentStatus: ''
    };

    onChangeFilters(defaultFilters);
    setErrorFields({});

    if (isSuper) {
      setOptions(prev => ({ ...prev, branches: [], teams: [], employees: [] }));
    } else if (isAdmin) {
      setOptions(prev => ({ ...prev, teams: [], employees: [] }));
    } else if (isManager) {
      setOptions(prev => ({ ...prev, employees: [] }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!currentFilters.startDate) {
      errors.startDate = 'Start Date is required';
    }
    if (!currentFilters.endDate) {
      errors.endDate = 'End Date is required';
    }
    if (currentFilters.startDate && currentFilters.endDate && new Date(currentFilters.startDate) > new Date(currentFilters.endDate)) {
      errors.endDate = 'End Date cannot be before Start Date';
    }

    if (Object.keys(errors).length > 0) {
      setErrorFields(errors);
      toast.error('Please resolve validation errors');
      return;
    }

    setErrorFields({});
    onGenerate(currentFilters);
  };

  // Form validations for disabling the trigger button
  const activeMode = currentFilters.viewMode || defaultMode;
  const isDateValid = !!currentFilters.startDate && !!currentFilters.endDate;
  const isHierarchyValid = true;

  const isFormValid = isDateValid && isHierarchyValid;

  // Compile real-time filter preview sentence
  const compilePreviewText = () => {
    const isCompSelected = !!currentFilters.companyId;
    const isBrSelected = !!currentFilters.branchId;
    const isTeamSelected = !!currentFilters.teamId;
    const isEmpSelected = !!currentFilters.employeeId;

    const companyName = isSuper 
      ? (options.companies.find(c => c.id === String(currentFilters.companyId))?.name || '') 
      : (user?.company?.name || '');
      
    const branchName = (isSuper || isAdmin) 
      ? (options.branches.find(b => b.id === String(currentFilters.branchId))?.name || '') 
      : (user?.branch?.name || '');

    const teamName = isSales && userTeam ? userTeam.name : (options.teams.find(t => t.id === String(currentFilters.teamId))?.name || '');
    const employeeName = isSales ? user?.name : (options.employees.find(e => e.id === String(currentFilters.employeeId))?.name || '');

    const start = currentFilters.startDate || 'Start Date';
    const end = currentFilters.endDate || 'End Date';
    const dateRangeStr = `between ${start} and ${end}`;

    const mode = currentFilters.viewMode || defaultMode;

    if (isSales) {
      if (mode === 'TEAM') {
        return `Viewing: My Team — ${teamName || 'Your Team'} ${dateRangeStr}`;
      } else {
        return `Viewing: My Data — ${employeeName || 'Your Data'} ${dateRangeStr}`;
      }
    }

    if (mode === 'ORGANIZATION') {
      if (!isCompSelected && isSuper) {
        return `Viewing all data across All Companies and All Branches ${dateRangeStr}`;
      }
      if (isCompSelected && !isBrSelected) {
        return `Viewing all branches under company "${companyName}" ${dateRangeStr}`;
      }
      return `Viewing branch "${branchName}" under company "${companyName || 'Your Company'}" ${dateRangeStr}`;
    } else if (mode === 'TEAM') {
      const scopeStr = isBrSelected 
        ? `in branch "${branchName}" (${companyName || 'Your Company'})` 
        : `across all branches of "${companyName || 'Your Company'}"`;
        
      if (isTeamSelected) {
        return `Viewing team "${teamName}" ${scopeStr} ${dateRangeStr}`;
      }
      return `Viewing all teams ${scopeStr} ${dateRangeStr}`;
    } else {
      // Individual mode
      const scopeStr = isBrSelected 
        ? `in branch "${branchName}" (${companyName || 'Your Company'})` 
        : `across all branches of "${companyName || 'Your Company'}"`;

      if (isEmpSelected) {
        const teamInfo = teamName ? ` (Team: ${teamName})` : '';
        return `Viewing performance of employee "${employeeName}"${teamInfo} ${scopeStr} ${dateRangeStr}`;
      }
      if (isTeamSelected) {
        return `Viewing all employees in team "${teamName}" ${scopeStr} ${dateRangeStr}`;
      }
      return `Viewing all employees ${scopeStr} ${dateRangeStr}`;
    }
  };

  const teamPlaceholder = options.teams.length === 0 && !loadingFields.teams
    ? "No teams available for this branch"
    : "All Teams";

  const employeePlaceholder = options.employees.length === 0 && !loadingFields.employees
    ? "No employees available for this selection"
    : "All Employees";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-slate-50/50 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-sm">
      {/* 1. View Mode Section */}
      {(!isSales || (isSales && userTeam)) && (
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Select Analysis Type</h4>
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200/40">
            {!isManager && !isSales && (
              <button
                type="button"
                onClick={() => handleFieldChange('viewMode', 'ORGANIZATION')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${(currentFilters.viewMode || defaultMode) === 'ORGANIZATION'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Organization View
              </button>
            )}
            <button
              type="button"
              onClick={() => handleFieldChange('viewMode', 'TEAM')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${(currentFilters.viewMode || defaultMode) === 'TEAM'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Team View
            </button>
            <button
              type="button"
              onClick={() => handleFieldChange('viewMode', 'INDIVIDUAL')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${(currentFilters.viewMode || defaultMode) === 'INDIVIDUAL'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Individual View
            </button>
          </div>
        </div>
      )}

      {/* 2. Organization Scope Section (Progressive Hierarchy Filters) */}
      {!isSales && (
        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Organization Scope</h4>
          <div className="grid grid-cols-2 gap-4">
            {isSuper && (
              <SelectField
                label="Company"
                value={currentFilters.companyId || ''}
                onChange={(val) => handleFieldChange('companyId', val)}
                options={options.companies}
                isLoading={loadingFields.companies}
                placeholder="All Companies"
                allowEmptyOption
                searchable={true}
              />
            )}

            {(isSuper || isAdmin) ? (
              <SelectField
                label={`Branch ${activeMode !== 'ORGANIZATION' ? '' : '(Optional)'}`}
                required={activeMode !== 'ORGANIZATION'}
                value={currentFilters.branchId || ''}
                onChange={(val) => handleFieldChange('branchId', val)}
                options={options.branches}
                isLoading={loadingFields.branches}
                placeholder={activeMode === 'ORGANIZATION' ? 'All Branches' : 'Select Branch'}
                allowEmptyOption={activeMode === 'ORGANIZATION'}
                errorText={errorFields.branchId}
                searchable={true}
              />
            ) : (
              <div className="flex flex-col justify-center bg-white border border-slate-200/60 rounded-xl px-4 py-2 text-xs font-semibold text-slate-600">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Assigned Branch</span>
                <span className="text-slate-800 font-bold mt-0.5">{user?.branch?.name || 'Auto Assigned'}</span>
              </div>
            )}

            {/* Team Selector: shown only in Team view */}
            {activeMode === 'TEAM' && (
              <SelectField
                label="Team"
                required={false}
                value={currentFilters.teamId || ''}
                onChange={(val) => handleFieldChange('teamId', val)}
                options={options.teams}
                isLoading={loadingFields.teams}
                placeholder={teamPlaceholder}
                allowEmptyOption={true}
                errorText={errorFields.teamId}
                searchable={true}
              />
            )}

            {/* Employee Selector: shown only in Individual view */}
            {activeMode === 'INDIVIDUAL' && (
              <SelectField
                label="Employee"
                required={false}
                value={currentFilters.employeeId || ''}
                onChange={(val) => handleFieldChange('employeeId', val)}
                options={options.employees}
                isLoading={loadingFields.employees}
                placeholder={employeePlaceholder}
                allowEmptyOption={true}
                errorText={errorFields.employeeId}
                searchable={true}
              />
            )}
          </div>
        </div>
      )}

      {/* Sales Agent banner */}
      {isSales && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700">
            <Check className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>You are viewing your assigned data</span>
          </div>
          {userTeam && (
            <div className="flex items-center gap-2 p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-700">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Showing data for your team only ({userTeam.name})</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Time Parameters Section */}
      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Time Parameters</h4>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            type="date"
            label="Start Date"
            required
            value={currentFilters.startDate || ''}
            onChange={(val) => handleFieldChange('startDate', val)}
            errorText={errorFields.startDate}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            label="End Date"
            required
            value={currentFilters.endDate || ''}
            onChange={(val) => handleFieldChange('endDate', val)}
            errorText={errorFields.endDate}
            InputLabelProps={{ shrink: true }}
          />
        </div>
      </div>

      {/* 4. Report Specific Filters Section */}
      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Report Filters</h4>
        <div className="grid grid-cols-2 gap-4">
          {reportType === 'LEAD_REPORT' && (
            <>
              <SelectField
                label="Status"
                value={currentFilters.statusId || ''}
                onChange={(val) => handleFieldChange('statusId', val)}
                options={options.leadStatuses}
                isLoading={loadingFields.metadata}
                allowEmptyOption
                placeholder="All Statuses (Optional)"
                searchable={true}
              />
              <SelectField
                label="Course"
                value={currentFilters.courseId || ''}
                onChange={(val) => handleFieldChange('courseId', val)}
                options={options.courses}
                isLoading={loadingFields.metadata}
                allowEmptyOption
                placeholder="All Courses (Optional)"
                searchable={true}
              />
              <SelectField
                label="Source"
                value={currentFilters.sourceId || ''}
                onChange={(val) => handleFieldChange('sourceId', val)}
                options={options.leadSources}
                isLoading={loadingFields.metadata}
                allowEmptyOption
                placeholder="All Sources (Optional)"
                searchable={true}
              />
            </>
          )}

          {reportType === 'OPPORTUNITY_REPORT' && (
            <>
              <SelectField
                label="Stage"
                value={currentFilters.stageId || ''}
                onChange={(val) => handleFieldChange('stageId', val)}
                options={options.opportunityStages}
                isLoading={loadingFields.metadata}
                allowEmptyOption
                placeholder="All Stages (Optional)"
                searchable={true}
              />
              <SelectField
                label="Course"
                value={currentFilters.productId || ''}
                onChange={(val) => handleFieldChange('productId', val)}
                options={options.courses}
                isLoading={loadingFields.metadata}
                allowEmptyOption
                placeholder="All Courses (Optional)"
                searchable={true}
              />
              <SelectField
                label="Opportunity Status"
                value={currentFilters.status || ''}
                onChange={(val) => handleFieldChange('status', val)}
                options={[
                  { id: 'OPEN', name: 'Open' },
                  { id: 'WON', name: 'Won' },
                  { id: 'LOST', name: 'Lost' }
                ]}
                allowEmptyOption
                placeholder="All Statuses (Optional)"
                searchable={true}
              />
            </>
          )}

          {reportType === 'DEAL_REPORT' && (
            <SelectField
              label="Deal Outcome"
              value={currentFilters.outcome || ''}
              onChange={(val) => handleFieldChange('outcome', val)}
              options={[
                { id: 'WON', name: 'Won' },
                { id: 'LOST', name: 'Lost' },
                { id: 'CANCELLED', name: 'Cancelled' }
              ]}
              allowEmptyOption
              placeholder="All Outcomes (Optional)"
              searchable={true}
            />
          )}

          {reportType === 'REVENUE_REPORT' && (
            <>
              <SelectField
                label="Payment Status"
                value={currentFilters.paymentStatus || ''}
                onChange={(val) => handleFieldChange('paymentStatus', val)}
                options={[
                  { id: 'COMPLETED', name: 'Completed' },
                  { id: 'PENDING', name: 'Pending' }
                ]}
                allowEmptyOption
                placeholder="All Statuses (Optional)"
                searchable={true}
              />
              <SelectField
                label="Course"
                value={currentFilters.productId || ''}
                onChange={(val) => handleFieldChange('productId', val)}
                options={options.courses}
                isLoading={loadingFields.metadata}
                allowEmptyOption
                placeholder="All Courses (Optional)"
                searchable={true}
              />
            </>
          )}

          {reportType === 'CUSTOMER_REPORT' && (
            <>
              <SelectField
                label="Customer Status"
                value={currentFilters.status || ''}
                onChange={(val) => handleFieldChange('status', val)}
                options={[
                  { id: 'ACTIVE', name: 'Active' },
                  { id: 'INACTIVE', name: 'Inactive' }
                ]}
                allowEmptyOption
                placeholder="All Statuses (Optional)"
                searchable={true}
              />
              <SelectField
                label="Course Purchased"
                value={currentFilters.purchasedProductId || ''}
                onChange={(val) => handleFieldChange('purchasedProductId', val)}
                options={options.courses}
                isLoading={loadingFields.metadata}
                allowEmptyOption
                placeholder="All Courses (Optional)"
                searchable={true}
              />
            </>
          )}

        </div>
      </div>

      {/* 5. Live Preview Panel */}
      <div className="flex items-start gap-2 p-3 bg-slate-100 border border-slate-200/80 rounded-xl">
        <Eye className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-slate-600 text-xs font-semibold leading-normal">{compilePreviewText()}</p>
      </div>

      {/* 6. Footer Submission Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Filters
        </button>
        <Button
          type="submit"
          disabled={!isFormValid || !canCreate || loading}
          isLoading={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!loading && <Play className="w-4 h-4" />}
          {loading ? 'Generating...' : 'Generate Report'}
        </Button>
      </div>
    </form>
  );
};

export default ReportBuilder;
