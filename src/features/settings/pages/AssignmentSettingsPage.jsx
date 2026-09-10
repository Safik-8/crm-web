import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../app/providers/AuthProvider';
import { branchService } from '../../branch/services/branchService';
import { companyService } from '../../company/services/companyService';
import { SearchableSelect } from '../../../shared/components/elements/SearchableSelect';
import { Toggle } from '../../../shared/components/elements/Toggle';
import Button from '../../../shared/components/elements/Button';
import { toast } from '../../../shared/utils/toast';
import {
  GitBranch,
  Building2,
  Save,
  Info,
  Settings,
  AlertCircle,
  Users,
  User,
  Gauge,
  Shuffle,
  BarChart3,
  Award,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Layers,
  Check
} from 'lucide-react';
import PageHeader from '../../../shared/components/modules/PageHeader';
import Skeleton from '../../../shared/components/elements/Skeleton';

export const AssignmentSettingsPage = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const isSuperAdmin = currentUser?.primaryRole === 'SUPER_ADMIN';
  const isCompanyAdmin = currentUser?.primaryRole === 'COMPANY_ADMIN';
  const isBranchManager = currentUser?.primaryRole === 'BRANCH_MANAGER' || (!isSuperAdmin && !isCompanyAdmin && !!currentUser?.branchId);

  // Selection states
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Form states
  const [autoAssignmentEnabled, setAutoAssignmentEnabled] = useState(false);
  const [maxDailyLeadsPerUser, setMaxDailyLeadsPerUser] = useState('');
  const [assignmentAlgorithm, setAssignmentAlgorithm] = useState('ROUND_ROBIN');
  const [assignmentResolutionLevel, setAssignmentResolutionLevel] = useState('PERSON');

  // Set default scopes on load
  useEffect(() => {
    if (isBranchManager && currentUser?.branchId) {
      setSelectedBranchId(currentUser.branchId.toString());
    } else if (isCompanyAdmin && currentUser?.companyId) {
      setSelectedCompanyId(currentUser.companyId.toString());
    }
  }, [currentUser, isBranchManager, isCompanyAdmin]);

  // 1. Fetch companies for Super Admin
  const { data: companiesRes, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies-settings-options'],
    queryFn: () => companyService.getCompaniesRaw(),
    enabled: isSuperAdmin
  });

  const companiesList = Array.isArray(companiesRes)
    ? companiesRes
    : (Array.isArray(companiesRes?.data) ? companiesRes.data : (companiesRes?.data?.companies || []));

  const companyOptions = useMemo(() => {
    return companiesList.map(c => ({ id: c.id.toString(), name: c.name }));
  }, [companiesList]);

  // 2. Fetch branches scoped by company selection
  const targetCompanyId = isSuperAdmin ? selectedCompanyId : currentUser?.companyId;

  const { data: branchesRes, isLoading: isLoadingBranches } = useQuery({
    queryKey: ['branches-settings-options', targetCompanyId],
    queryFn: () => branchService.getBranchesRaw(targetCompanyId),
    enabled: isCompanyAdmin || (isSuperAdmin && !!targetCompanyId)
  });

  const branchesList = Array.isArray(branchesRes)
    ? branchesRes
    : (Array.isArray(branchesRes?.data) ? branchesRes.data : (branchesRes?.data?.branches || []));

  const branchOptions = useMemo(() => {
    return branchesList.map(b => ({ id: b.id.toString(), name: b.name }));
  }, [branchesList]);

  // 3. Fetch configuration details for active branch
  const activeBranchId = isBranchManager ? currentUser?.branchId : selectedBranchId ? Number(selectedBranchId) : null;

  const { data: branchDetailsRes, isLoading: isLoadingDetails, refetch } = useQuery({
    queryKey: ['branch-settings-details', activeBranchId],
    queryFn: async () => {
      const res = await branchService.getBranchById(activeBranchId);
      return res.data?.branch || res.branch || res;
    },
    enabled: !!activeBranchId
  });

  const userCount = branchDetailsRes?._count?.users ?? 0;
  const teamCount = branchDetailsRes?._count?.teams ?? 0;
  const hasNoMembers = userCount === 0 && teamCount === 0;

  // Sync form states with retrieved branch configurations
  useEffect(() => {
    if (branchDetailsRes) {
      setAutoAssignmentEnabled(hasNoMembers ? false : (branchDetailsRes.autoAssignmentEnabled ?? false));
      setMaxDailyLeadsPerUser(
        branchDetailsRes.maxDailyLeadsPerUser !== null && branchDetailsRes.maxDailyLeadsPerUser !== undefined
          ? branchDetailsRes.maxDailyLeadsPerUser.toString()
          : ''
      );
      setAssignmentAlgorithm(branchDetailsRes.assignmentAlgorithm ?? 'ROUND_ROBIN');
      setAssignmentResolutionLevel(branchDetailsRes.assignmentResolutionLevel ?? 'PERSON');
    }
  }, [branchDetailsRes, hasNoMembers]);

  // 4. Update mutation
  const updateBranchMutation = useMutation({
    mutationFn: (payload) => branchService.updateBranch(activeBranchId, payload),
    onSuccess: (res) => {
      toast.success('Lead assignment settings saved successfully.');
      queryClient.invalidateQueries(['branch-settings-details', activeBranchId]);
      refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to save settings.');
    }
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!activeBranchId) {
      toast.error('Please select a branch first.');
      return;
    }

    const limitVal = maxDailyLeadsPerUser.trim() === '' ? null : Number(maxDailyLeadsPerUser);
    if (limitVal !== null && (isNaN(limitVal) || !Number.isInteger(limitVal) || limitVal < 50)) {
      toast.error('Daily lead limit must be at least 50.');
      return;
    }

    updateBranchMutation.mutate({
      autoAssignmentEnabled,
      maxDailyLeadsPerUser: limitVal,
      assignmentAlgorithm,
      assignmentResolutionLevel
    });
  };

  const ALGORITHM_CONFIGS = [
    {
      id: 'ROUND_ROBIN',
      name: 'Round Robin',
      badge: 'Equal Distribution',
      subtitle: 'Strict sequential rotation',
      icon: Shuffle,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      description: 'Rotates each incoming lead to the next eligible sales candidate in strict circular queue order, ensuring equal distribution.',
      howItWorksPerson: 'Eligible salespeople in this branch are ordered sequentially. Each incoming lead goes to the next person in queue, skipping anyone who has hit their daily limit.',
      howItWorksTeam: 'Active teams are queued sequentially. Leads route to the next team container in order, which the team manager then distributes to their reps.',
      scenario: 'Lead 1 → Candidate A  |  Lead 2 → Candidate B  |  Lead 3 → Candidate C  |  Lead 4 → Loops back to Candidate A'
    },
    {
      id: 'LEAST_WORKLOAD',
      name: 'Least Workload',
      badge: 'Load Balancing',
      subtitle: 'Dynamic workload leveler',
      icon: BarChart3,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      description: 'Dynamically routes leads to the candidate with the lowest number of active leads received today to prevent bottlenecks.',
      howItWorksPerson: 'The system queries total leads received today across reps. The lead is assigned to the salesperson currently having the lowest daily lead count.',
      howItWorksTeam: 'Total workload per team (direct team assignments + all team members combined) is calculated. The team with the fewest total leads today is selected.',
      scenario: 'If Rep A has received 2 leads today and Rep B has 6 leads, the next incoming lead is dispatched to Rep A to equalize workload.'
    },
    {
      id: 'PRIORITY_BASED',
      name: 'Priority Based',
      badge: 'Seniority Cascading',
      subtitle: 'Rank & seniority hierarchy',
      icon: Award,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      description: 'Dispatches leads to senior, top-ranking sales representatives first until their daily capacity is exhausted before cascading down.',
      howItWorksPerson: 'Highest-ranking roles receive leads first. They continue getting leads until they hit their daily lead limit. Lower-ranked reps only receive leads once senior reps are capped.',
      howItWorksTeam: 'Teams are ranked by their managing BDE role rank. The highest-ranked team receives priority until capped, then overflows to next tier.',
      scenario: 'Senior Executives (Rank 40) receive all inbound leads first. Only upon reaching their daily cap (e.g. 50 leads) do leads cascade to Junior Reps (Rank 20).'
    }
  ];

  const currentAlgorithmConfig = ALGORITHM_CONFIGS.find(a => a.id === assignmentAlgorithm) || ALGORITHM_CONFIGS[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">

      {/* ── UNIFORM PAGE HEADER ── */}
      <PageHeader
        title="Lead Distribution & Assignment Rules"
        description="Configure automated inbound lead routing algorithms, daily workload limits, and resolution hierarchy per branch."
        icon={Settings}
      />

      {/* ── SCOPE SELECTORS CARD (Super Admin & Company Admin) ── */}
      {(isSuperAdmin || isCompanyAdmin) && (
        <div className="bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-orange-500" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Branch Scope Selection</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Configure rules for specific operational branches</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isSuperAdmin && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-500" />
                  Target Company <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={companyOptions}
                  value={selectedCompanyId}
                  onChange={(val) => {
                    setSelectedCompanyId(val);
                    setSelectedBranchId('');
                  }}
                  placeholder="Select Company..."
                  isLoading={isLoadingCompanies}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch size={13} className="text-slate-500" />
                Target Branch <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={branchOptions}
                value={selectedBranchId}
                onChange={(val) => setSelectedBranchId(val)}
                placeholder={isSuperAdmin && !selectedCompanyId ? "Select company first..." : "Select Branch..."}
                disabled={isSuperAdmin && !selectedCompanyId}
                isLoading={isLoadingBranches}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── SETTINGS FORM & CONFIGURATION ── */}
      {activeBranchId ? (
        isLoadingDetails ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Quick Stats Strip Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-slate-200 p-3.5 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton variant="text" width={100} height={12} />
                    <Skeleton variant="text" width={70} height={24} />
                  </div>
                  <Skeleton variant="rounded" width={32} height={32} className="rounded-lg" />
                </div>
              ))}
            </div>

            {/* Main Settings Card Skeleton */}
            <div className="bg-white border border-slate-200 p-6 space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton variant="text" width={200} height={24} />
                  <Skeleton variant="text" width={320} height={16} />
                </div>
                <Skeleton variant="rounded" width={50} height={28} className="rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border border-slate-200 p-4 space-y-3 rounded-lg">
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="text" width={120} height={20} />
                    <Skeleton variant="text" width="100%" height={36} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6" noValidate>

            {/* Branch Health & Quick Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branch Sales Reps</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{userCount} Users</p>
                </div>
                <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600">
                  <User size={16} />
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configured Teams</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{teamCount} Teams</p>
                </div>
                <div className="p-2 bg-purple-50 border border-purple-100 text-purple-600">
                  <Users size={16} />
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Routing Status</p>
                  <p className={`text-sm font-bold mt-0.5 ${autoAssignmentEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {autoAssignmentEnabled ? '● ACTIVE' : '○ DISABLED'}
                  </p>
                </div>
                <div className={`p-2 border ${autoAssignmentEnabled ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                  <Sparkles size={16} />
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolution Mode</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {assignmentResolutionLevel === 'PERSON' ? 'Individual' : 'Team Pool'}
                  </p>
                </div>
                <div className="p-2 bg-orange-50 border border-orange-100 text-orange-600">
                  <Layers size={16} />
                </div>
              </div>
            </div>

            {/* Warning when branch has no active members */}
            {hasNoMembers && (
              <div className="bg-red-50 border border-red-200 p-4 flex gap-3 text-red-800 text-xs">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="font-bold text-red-900 text-sm">Automatic Lead Assignment Restricted</h4>
                  <p className="mt-1 leading-relaxed text-red-700 font-medium">
                    This branch does not have any active salespeople or teams. You cannot activate automated lead routing until you onboard team members or configure sales teams for this branch.
                  </p>
                </div>
              </div>
            )}

            {/* Master Activation Banner */}
            <div className={`border p-6 transition-all duration-200 ${autoAssignmentEnabled
                ? 'bg-gradient-to-r from-emerald-50/70 via-white to-white border-emerald-200 shadow-sm'
                : 'bg-white border-slate-200 shadow-sm'
              }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-slate-900">
                      Automated Lead Distribution Engine
                    </span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border ${autoAssignmentEnabled
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                      {autoAssignmentEnabled ? 'ENABLED' : 'PAUSED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                    When enabled, unassigned incoming leads belonging to this branch are automatically distributed to candidates according to the rule strategy and capacity thresholds below.
                  </p>
                </div>

                <div className="shrink-0">
                  <Toggle
                    id="autoAssignmentEnabled"
                    checked={autoAssignmentEnabled}
                    onChange={(val) => setAutoAssignmentEnabled(val)}
                    disabled={hasNoMembers}
                  />
                </div>
              </div>
            </div>

            {/* Child Settings Wrapper */}
            <div className={`space-y-6 transition-all duration-300 ${!autoAssignmentEnabled ? 'opacity-50 pointer-events-none filter grayscale-[20%]' : ''}`}>

              {/* ── CARD 1: DAILY LEAD CAPACITY (LIMITS) ── */}
              <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-100 text-slate-700 border border-slate-200">
                      <Gauge size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Daily Lead Capacity & Throttling
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        Cap the maximum number of leads any single salesperson or team can receive per calendar day.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 font-mono">Min: 50 Leads</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Max Daily Leads Per Candidate
                    </label>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Once a candidate reaches this quota today, the algorithm automatically skips them and routes to next available candidate.
                    </p>
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <div className="relative max-w-xs">
                      <input
                        type="number"
                        min="50"
                        placeholder="50"
                        value={maxDailyLeadsPerUser}
                        onChange={(e) => setMaxDailyLeadsPerUser(e.target.value)}
                        className={`w-full bg-slate-50 border pl-3.5 pr-24 py-2 text-sm font-semibold outline-none transition-all placeholder:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${maxDailyLeadsPerUser.trim() !== '' && Number(maxDailyLeadsPerUser) < 50
                            ? 'border-red-500 text-red-900 focus:border-red-500 bg-red-50/30'
                            : 'border-slate-200 text-slate-900 focus:border-orange-500 focus:bg-white'
                          }`}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 border border-slate-200 pointer-events-none select-none">
                        leads/day
                      </span>
                    </div>

                    {maxDailyLeadsPerUser.trim() !== '' && Number(maxDailyLeadsPerUser) < 50 && (
                      <p className="text-red-600 text-xs font-bold flex items-center gap-1">
                        <AlertCircle size={13} /> Daily lead limit must be at least 50.
                      </p>
                    )}

                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 text-xs text-slate-600">
                      <Info size={14} className="text-slate-400 shrink-0" />
                      <span>
                        {maxDailyLeadsPerUser.trim() === ''
                          ? 'No override is set. System default of 50 leads per day is active.'
                          : `Active branch override: Maximum ${maxDailyLeadsPerUser} leads per candidate daily.`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── CARD 2: ASSIGNMENT ALGORITHM SELECTION ── */}
              <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-100 text-slate-700 border border-slate-200">
                      <Shuffle size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Lead Distribution Algorithm
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        Select the strategy rule that decides which candidate in the pool receives the next lead.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5">
                    Active: {currentAlgorithmConfig.name}
                  </span>
                </div>

                {/* 3 Strategy Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {ALGORITHM_CONFIGS.map((algo) => {
                    const isSelected = assignmentAlgorithm === algo.id;
                    const Icon = algo.icon;
                    return (
                      <div
                        key={algo.id}
                        onClick={() => setAssignmentAlgorithm(algo.id)}
                        className={`p-4 border transition-all cursor-pointer relative flex flex-col justify-between ${isSelected
                            ? 'bg-orange-50/20 border-orange-500 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className={`p-2 border ${algo.color}`}>
                              <Icon size={16} />
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${isSelected
                                ? 'bg-orange-100 text-orange-800 border-orange-300'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                              {algo.badge}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 mt-1">
                            {algo.name}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed font-normal">
                            {algo.description}
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className={`font-bold ${isSelected ? 'text-orange-600' : 'text-slate-400'}`}>
                            {isSelected ? '✓ Selected Strategy' : 'Click to select'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dynamic Strategy Explanation & Scenario Walkthrough */}
                <div className="bg-slate-50 border border-slate-200 p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <HelpCircle size={14} className="text-orange-500" />
                      Detailed Engine Behavior ({currentAlgorithmConfig.name})
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-slate-500">
                      Scope: {assignmentResolutionLevel === 'PERSON' ? 'Individual Salesperson' : 'Team Pool'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {assignmentResolutionLevel === 'PERSON'
                      ? currentAlgorithmConfig.howItWorksPerson
                      : currentAlgorithmConfig.howItWorksTeam}
                  </p>

                  {/* Scenario box */}
                  <div className="bg-white border border-slate-200 p-3 text-xs text-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Live Routing Simulation:
                    </span>
                    <p className="font-mono text-slate-800 text-[11px] leading-relaxed">
                      {currentAlgorithmConfig.scenario}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── CARD 3: TARGET RESOLUTION LEVEL ── */}
              <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-100 text-slate-700 border border-slate-200">
                      <Users size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Resolution Hierarchy Level
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        Determine whether leads are assigned to individual people directly or placed into team containers.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Option 1: Person */}
                  <div
                    onClick={() => setAssignmentResolutionLevel('PERSON')}
                    className={`p-4 border transition-all cursor-pointer space-y-2 ${assignmentResolutionLevel === 'PERSON'
                        ? 'bg-orange-50/20 border-orange-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User size={16} className={assignmentResolutionLevel === 'PERSON' ? 'text-orange-600' : 'text-slate-400'} />
                        <span className="text-sm font-bold text-slate-900">Direct Salesperson (Individual)</span>
                      </div>
                      <div className={`w-4 h-4 border flex items-center justify-center ${assignmentResolutionLevel === 'PERSON' ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300'}`}>
                        {assignmentResolutionLevel === 'PERSON' && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      Leads are auto-routed directly into individual BDE/ISE salespeople accounts across the branch as a flat candidate pool.
                    </p>
                  </div>

                  {/* Option 2: Team */}
                  <div
                    onClick={() => setAssignmentResolutionLevel('TEAM')}
                    className={`p-4 border transition-all cursor-pointer space-y-2 ${assignmentResolutionLevel === 'TEAM'
                        ? 'bg-orange-50/20 border-orange-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users size={16} className={assignmentResolutionLevel === 'TEAM' ? 'text-orange-600' : 'text-slate-400'} />
                        <span className="text-sm font-bold text-slate-900">Sales Team Pool</span>
                      </div>
                      <div className={`w-4 h-4 border flex items-center justify-center ${assignmentResolutionLevel === 'TEAM' ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300'}`}>
                        {assignmentResolutionLevel === 'TEAM' && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      Leads are auto-routed to a team container as a whole. The managing BDE then claims or delegates the lead internally to their subordinates.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* ── STICKY/BOTTOM SAVE ACTION BAR ── */}
            <div className="bg-white border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>Saved parameters immediately take effect for all subsequent incoming leads.</span>
              </div>

              <div className="flex items-center justify-end gap-3 shrink-0">
                <Button
                  type="submit"
                  variant="contained"
                  isLoading={updateBranchMutation.isLoading}
                  startIcon={<Save size={16} />}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2 text-xs shadow-md shadow-orange-600/20 active:scale-95 transition-all"
                >
                  Save Distribution Settings
                </Button>
              </div>
            </div>

          </form>
        )
      ) : (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-dashed border-slate-300 text-center space-y-3">
          <div className="p-3 bg-slate-100 border border-slate-200 text-slate-400">
            <GitBranch size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Branch Selected</h3>
          <p className="text-xs font-medium text-slate-400 max-w-sm">
            Please choose an operational branch from the selector above to configure its automated lead distribution rules.
          </p>
        </div>
      )}

    </div>
  );
};

export default AssignmentSettingsPage;
