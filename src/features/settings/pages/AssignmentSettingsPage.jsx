import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../app/providers/AuthProvider';
import { branchService } from '../../branch/services/branchService';
import { companyService } from '../../company/services/companyService';
import { SearchableSelect } from '../../../shared/components/elements/SearchableSelect';
import { Toggle } from '../../../shared/components/elements/Toggle';
import Button from '../../../shared/components/elements/Button';
import { toast } from '../../../shared/utils/toast';
import { GitBranch, Building2, Save, Info, Settings, AlertCircle } from 'lucide-react';

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

  const algorithmOptions = [
    { id: 'ROUND_ROBIN', name: 'Round Robin' },
    { id: 'LEAST_WORKLOAD', name: 'Least Workload' },
    { id: 'PRIORITY_BASED', name: 'Priority-Based' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header section */}
      <div className="flex items-center gap-3 border-b border-zinc-200/80 pb-5 shrink-0">
        <div className="p-2.5 bg-orange-100 rounded-xl text-orange-600">
          <Settings size={22} className="animate-spin-slow" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-950 tracking-tight">Lead Distribution Rules</h1>
          <p className="text-xs font-medium text-zinc-400 mt-1">Configure auto-routing parameters, daily limits, and resolution levels per branch.</p>
        </div>
      </div>

      {/* Selectors section */}
      {(isSuperAdmin || isCompanyAdmin) && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Branch Scope</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isSuperAdmin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={12} /> Company
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
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch size={12} /> Branch
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

      {/* Settings Form */}
      {activeBranchId ? (
        isLoadingDetails ? (
          <div className="flex flex-col items-center justify-center p-20 bg-white border border-zinc-200/80 rounded-2xl shadow-sm">
            <svg className="animate-spin h-8 w-8 text-orange-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-semibold text-zinc-500">Loading branch settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6" noValidate>
            
            {hasNoMembers && (
              <div className="bg-red-50 border border-red-200/60 rounded-2xl p-5 flex gap-3.5">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-sm font-bold text-red-800">Automatic Lead Assignment Restricted</h3>
                  <p className="text-xs font-semibold text-red-600 mt-1 leading-relaxed">
                    This branch does not have any active users or teams. You cannot enable automatic lead assignment until you onboard salespeople or set up active teams for this branch.
                  </p>
                </div>
              </div>
            )}

            {/* Form Fields Card */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                <Toggle
                  id="autoAssignmentEnabled"
                  label="Enable Automatic Lead Assignment"
                  checked={autoAssignmentEnabled}
                  onChange={(val) => setAutoAssignmentEnabled(val)}
                  disabled={hasNoMembers}
                />
                <p className="text-xs text-zinc-400 mt-1.5 font-medium ml-1">
                  When enabled, incoming unassigned leads belonging to this branch are routed automatically to people or teams using the resolved algorithm configuration below.
                </p>
              </div>

              {/* Child settings wrapper with visual de-emphasis if auto-assignment is disabled */}
              <div className={`p-6 space-y-6 transition-all duration-300 ${!autoAssignmentEnabled ? 'opacity-55 filter grayscale-[30%] pointer-events-none' : ''}`}>
                
                {/* Daily Lead Limit */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start border-b border-zinc-100 pb-6">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-800">Daily Lead Limit</h3>
                    <p className="text-xs font-semibold text-zinc-400 mt-1">Maximum leads a single person or team can receive per calendar day (minimum 50).</p>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <input
                      type="number"
                      placeholder="50"
                      value={maxDailyLeadsPerUser}
                      onChange={(e) => setMaxDailyLeadsPerUser(e.target.value)}
                      className={`w-full bg-[#F8FAFC] border rounded-[10px] px-3.5 py-[10px] text-[13px] font-medium outline-none focus:ring-3 transition-all ${
                        maxDailyLeadsPerUser.trim() !== '' && Number(maxDailyLeadsPerUser) < 50
                          ? 'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500/14'
                          : 'border-[#E2E8F0] text-slate-900 focus:border-orange-500 focus:ring-orange-500/14'
                      }`}
                    />
                    {maxDailyLeadsPerUser.trim() !== '' && Number(maxDailyLeadsPerUser) < 50 && (
                      <p className="text-red-500 text-[11px] font-semibold mt-1">
                        ⚠️ Daily lead limit must be at least 50.
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 bg-zinc-50 border border-zinc-100 rounded-lg p-2.5">
                      <Info size={13} className="text-zinc-500 shrink-0" />
                      <span>
                        {maxDailyLeadsPerUser.trim() === '' 
                          ? 'No override is set. Using system-wide default limit: 50 leads per day.'
                          : 'Currently overriding the system default.'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assignment Algorithm */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start border-b border-zinc-100 pb-6">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-800">Assignment Algorithm</h3>
                    <p className="text-xs font-semibold text-zinc-400 mt-1">Rule selection that decides which candidate in the pool is selected first.</p>
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <SearchableSelect
                      options={algorithmOptions}
                      value={assignmentAlgorithm}
                      onChange={(val) => setAssignmentAlgorithm(val)}
                      placeholder="Select Algorithm..."
                      searchable={false}
                    />
                    <div className="text-[13px] text-slate-600 bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-4 shadow-sm">
                      {assignmentAlgorithm === 'ROUND_ROBIN' && (
                        <>
                          <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2">
                            <span className="bg-orange-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded tracking-wide uppercase">ROUND ROBIN</span>
                            <span className="text-slate-800 font-bold text-sm">Sequential Rotation</span>
                          </div>
                          
                          <p className="leading-relaxed">
                            Distributes incoming leads sequentially in a strict queue order to ensure equal opportunity.
                          </p>
                          
                          <div className="bg-white border border-slate-100 rounded-lg p-3 space-y-1">
                            <p className="text-slate-700 font-bold text-xs uppercase tracking-wider">How it works in current mode:</p>
                            {assignmentResolutionLevel === 'PERSON' ? (
                              <p className="text-slate-500 text-xs leading-relaxed">
                                Eligible salespeople are sorted by ID. The system tracks the last assigned salesperson and routes the next incoming lead to the next person in sequence (skipping anyone who has hit their daily limit).
                              </p>
                            ) : (
                              <p className="text-slate-500 text-xs leading-relaxed">
                                Active teams are sorted by ID. The system tracks the last assigned team and routes the next incoming lead to the next team container in sequence (skipping any team that has hit its daily limit).
                              </p>
                            )}
                          </div>
                          
                          <div className="bg-orange-50/40 border border-orange-100/50 rounded-lg p-3 text-xs text-orange-800">
                            <strong className="block mb-1 font-bold">Example scenario:</strong>
                            Lead 1 &rarr; {assignmentResolutionLevel === 'PERSON' ? 'Person' : 'Team'} A <br />
                            Lead 2 &rarr; {assignmentResolutionLevel === 'PERSON' ? 'Person' : 'Team'} B <br />
                            Lead 3 &rarr; {assignmentResolutionLevel === 'PERSON' ? 'Person' : 'Team'} C <br />
                            Lead 4 &rarr; Loops back to {assignmentResolutionLevel === 'PERSON' ? 'Person' : 'Team'} A
                          </div>
                        </>
                      )}

                      {assignmentAlgorithm === 'LEAST_WORKLOAD' && (
                        <>
                          <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2">
                            <span className="bg-orange-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded tracking-wide uppercase">LEAST WORKLOAD</span>
                            <span className="text-slate-800 font-bold text-sm">Dynamic Load Balancing</span>
                          </div>
                          
                          <p className="leading-relaxed">
                            Routes new leads dynamically to the candidate with the lowest number of assignments today to prevent workload imbalance.
                          </p>
                          
                          <div className="bg-white border border-slate-100 rounded-lg p-3 space-y-1">
                            <p className="text-slate-700 font-bold text-xs uppercase tracking-wider">How it works in current mode:</p>
                            {assignmentResolutionLevel === 'PERSON' ? (
                              <p className="text-slate-500 text-xs leading-relaxed">
                                The system counts leads assigned to each salesperson today. The new lead goes to the individual salesperson who currently has the fewest leads today.
                              </p>
                            ) : (
                              <p className="text-slate-500 text-xs leading-relaxed">
                                The system counts the workload of each team (team workload = direct team assignments + sum of all individual team members' assignments today). The team with the lowest total workload receives the lead.
                              </p>
                            )}
                          </div>
                          
                          <div className="bg-orange-50/40 border border-orange-100/50 rounded-lg p-3 text-xs text-orange-800">
                            <strong className="block mb-1 font-bold">Example scenario:</strong>
                            If Candidate A has received 2 leads today and Candidate B has 5 leads, the next incoming lead is assigned to Candidate A to balance their daily load.
                          </div>
                        </>
                      )}

                      {assignmentAlgorithm === 'PRIORITY_BASED' && (
                        <>
                          <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2">
                            <span className="bg-orange-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded tracking-wide uppercase">PRIORITY BASED</span>
                            <span className="text-slate-800 font-bold text-sm">Rank / Seniority Cascading</span>
                          </div>
                          
                          <p className="leading-relaxed">
                            Prioritizes routing leads to the highest-ranking reps or teams based on their role level/seniority.
                          </p>
                          
                          <div className="bg-white border border-slate-100 rounded-lg p-3 space-y-1">
                            <p className="text-slate-700 font-bold text-xs uppercase tracking-wider">How it works in current mode:</p>
                            {assignmentResolutionLevel === 'PERSON' ? (
                              <p className="text-slate-500 text-xs leading-relaxed">
                                Leads are routed to the salesperson with the highest role rank first. Leads will continue going to the highest-ranking person until they hit their daily lead limit. Lower-ranked salespeople only receive leads once higher-ranked ones are capped.
                              </p>
                            ) : (
                              <p className="text-slate-500 text-xs leading-relaxed">
                                Ranks are determined by the team's owning BDE's role rank. The team owned by the BDE with the highest role rank receives priority, cascading to lower-priority teams only when the top team reaches its daily limit.
                              </p>
                            )}
                          </div>
                          
                          <div className="bg-orange-50/40 border border-orange-100/50 rounded-lg p-3 text-xs text-orange-800">
                            <strong className="block mb-1 font-bold">Example scenario:</strong>
                            A Senior Person (rank 40) receives all incoming leads first. Only when they reach their daily limit (e.g. 50 leads) will leads begin routing to Junior Salespeople (rank 20).
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resolution Level */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-800">Resolution Level</h3>
                    <p className="text-xs font-semibold text-zinc-400 mt-1">Determine whether leads are assigned to individual people or teams.</p>
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/50">
                      <button
                        type="button"
                        onClick={() => setAssignmentResolutionLevel('PERSON')}
                        className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          assignmentResolutionLevel === 'PERSON'
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-200/20'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Assign to Person
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignmentResolutionLevel('TEAM')}
                        className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          assignmentResolutionLevel === 'TEAM'
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-200/20'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Assign to Team
                      </button>
                    </div>

                    <div className="text-xs font-semibold text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 space-y-2">
                      {assignmentResolutionLevel === 'PERSON' ? (
                        <>
                          <p className="text-slate-800 font-bold">Assign to Person Mode:</p>
                          <p className="leading-relaxed">
                            Leads are auto-routed directly to individual BDE/ISE salespeople. The algorithm evaluates individuals across all active teams in the branch as a single flat pool.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-slate-800 font-bold">Assign to Team Mode:</p>
                          <p className="leading-relaxed">
                            Leads are auto-routed to a team as a whole (no individual person is picked). Leads landing on the team can then be managed manually by the BDE owner.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Save Action */}
            <div className="flex justify-end gap-3 shrink-0">
              <Button
                type="submit"
                variant="contained"
                isLoading={updateBranchMutation.isLoading}
                startIcon={<Save size={16} />}
              >
                Save Settings
              </Button>
            </div>

          </form>
        )
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-dashed border-zinc-300 rounded-2xl text-center space-y-3">
          <AlertCircle size={32} className="text-zinc-300" />
          <h3 className="text-sm font-bold text-zinc-700">No Branch Selected</h3>
          <p className="text-xs font-medium text-zinc-400">Please choose a branch from the selector above to view and configure its lead assignment parameters.</p>
        </div>
      )}

    </div>
  );
};

export default AssignmentSettingsPage;
