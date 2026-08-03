import React, { useState, useEffect, useMemo } from 'react';
import Drawer from '../../../shared/components/elements/Drawer';
import { SearchableSelect } from '../../../shared/components/elements/SearchableSelect';
import Button from '../../../shared/components/elements/Button';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useTeamsQuery } from '../../teams/hooks/useTeams';
import { userService } from '../../users/services/userService';
import { branchService } from '../../branch/services/branchService';
import { companyService } from '../../company/services/companyService';
import { useQuery } from '@tanstack/react-query';
import { useAssignLeadsMutation } from '../hooks/useLeads';
import { toast } from '../../../shared/utils/toast';
import { User, Users, FileText, HelpCircle, ShieldAlert, GitBranch, Building2 } from 'lucide-react';

export const AssignLeadDrawer = ({ isOpen, onClose, leads = [], onSuccess }) => {
  const { user: currentUser } = useAuth();
  const assignMutation = useAssignLeadsMutation();

  const leadsArray = Array.isArray(leads) ? leads : leads ? [leads] : [];
  const isBulk = leadsArray.length > 1;
  const singleLead = !isBulk ? leadsArray[0] : null;

  // Form states
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [assignType, setAssignType] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  const isSuperAdmin = currentUser?.primaryRole === 'SUPER_ADMIN';
  const isCompanyAdmin = currentUser?.primaryRole === 'COMPANY_ADMIN';
  const isBranchManager = currentUser?.primaryRole === 'BRANCH_MANAGER';

  // Reset form states and default scopes on open
  useEffect(() => {
    if (isOpen) {
      if (singleLead) {
        setSelectedCompanyId(singleLead.companyId ? singleLead.companyId.toString() : '');
        setSelectedBranchId(singleLead.branchId ? singleLead.branchId.toString() : '');

        if (singleLead.assignedToId) {
          setAssignType('PERSON');
          setSelectedUserId(singleLead.assignedToId.toString());
          setSelectedTeamId('');
        } else if (singleLead.teamId) {
          setAssignType('TEAM');
          setSelectedTeamId(singleLead.teamId.toString());
          setSelectedUserId('');
        } else {
          setAssignType('');
          setSelectedTeamId('');
          setSelectedUserId('');
        }
      } else {
        setSelectedCompanyId(currentUser?.companyId ? currentUser.companyId.toString() : '');
        setSelectedBranchId(currentUser?.branchId ? currentUser.branchId.toString() : '');
        setAssignType('');
        setSelectedTeamId('');
        setSelectedUserId('');
      }
      setNotes('');
      setReason('');
    }
  }, [isOpen, singleLead, currentUser]);

  // Determine if a reason is required (if any lead already has an owner)
  const needsReason = useMemo(() => {
    return leadsArray.some(lead => lead?.assignedToId || lead?.teamId);
  }, [leadsArray]);

  // Fetch companies for Super Admin
  const { data: companiesRes, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies-assign-options'],
    queryFn: () => companyService.getCompaniesRaw(),
    enabled: isOpen && isSuperAdmin
  });

  const companiesList = Array.isArray(companiesRes)
    ? companiesRes
    : (Array.isArray(companiesRes?.data) ? companiesRes.data : (companiesRes?.data?.companies || []));

  const companyOptions = useMemo(() => {
    return companiesList.map(c => ({ id: c.id.toString(), name: c.name }));
  }, [companiesList]);

  // Fetch branches (scoped by company selection or admin scope)
  const targetCompanyId = isSuperAdmin ? selectedCompanyId : currentUser?.companyId;

  const { data: branchesRes, isLoading: isLoadingBranches } = useQuery({
    queryKey: ['branches-assign-options', targetCompanyId],
    queryFn: () => branchService.getBranchesRaw(targetCompanyId),
    enabled: isOpen && (isCompanyAdmin || (isSuperAdmin && !!targetCompanyId))
  });

  const branchesList = Array.isArray(branchesRes)
    ? branchesRes
    : (Array.isArray(branchesRes?.data) ? branchesRes.data : (branchesRes?.data?.branches || []));

  const branchOptions = useMemo(() => {
    return branchesList.map(b => ({ id: b.id.toString(), name: b.name }));
  }, [branchesList]);

  // Fetch teams within branch scope
  const teamParams = useMemo(() => {
    const params = { limit: 150 };
    if (isBranchManager && currentUser?.branchId) {
      params.branchId = currentUser.branchId;
    } else if (isCompanyAdmin || isSuperAdmin) {
      params.branchId = selectedBranchId ? Number(selectedBranchId) : -1;
    }
    return params;
  }, [currentUser, isBranchManager, isCompanyAdmin, isSuperAdmin, selectedBranchId]);

  const { data: teamsData, isLoading: isLoadingTeams } = useTeamsQuery(teamParams);
  const teamsList = teamsData?.teams || [];

  const teamOptions = useMemo(() => {
    if ((isCompanyAdmin || isSuperAdmin) && !selectedBranchId) return [];
    return teamsList.map(t => ({
      id: t.id.toString(),
      name: t.name + (t.status === 'INACTIVE' || t.isDeleted ? ' (Inactive)' : ''),
      disabled: t.status === 'INACTIVE' || t.isDeleted
    }));
  }, [teamsList, isCompanyAdmin, isSuperAdmin, selectedBranchId]);

  // Fetch users in branch scope
  const userParams = useMemo(() => {
    const params = { limit: 150 };
    if (isBranchManager && currentUser?.branchId) {
      params.branchId = currentUser.branchId;
    } else if (isCompanyAdmin || isSuperAdmin) {
      params.branchId = selectedBranchId ? Number(selectedBranchId) : -1;
    }
    return params;
  }, [currentUser, isBranchManager, isCompanyAdmin, isSuperAdmin, selectedBranchId]);

  const { data: allUsersRes, isLoading: isLoadingAllUsers } = useQuery({
    queryKey: ['users', 'assign-list', userParams],
    queryFn: async () => {
      const res = await userService.getUsers(userParams);
      return res.data || res;
    },
    enabled: isOpen && (!isCompanyAdmin && !isSuperAdmin || !!selectedBranchId)
  });

  const allUsersList = allUsersRes?.users || [];

  const userOptions = useMemo(() => {
    if ((isCompanyAdmin || isSuperAdmin) && !selectedBranchId) return [];
    return allUsersList.map(u => {
      const roleName = u.userRoles?.[0]?.role?.name || '';
      const suffix = roleName ? ` (${roleName})` : '';
      const statusSuffix = u.status === 'INACTIVE' ? ' (Inactive)' : '';
      return {
        id: u.id.toString(),
        name: `${u.name}${suffix}${statusSuffix}`,
        disabled: u.status === 'INACTIVE'
      };
    });
  }, [allUsersList, isCompanyAdmin, isSuperAdmin, selectedBranchId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSuperAdmin && !selectedCompanyId) {
      toast.error('Please select a company.');
      return;
    }

    if ((isCompanyAdmin || isSuperAdmin) && !selectedBranchId) {
      toast.error('Please select a branch.');
      return;
    }

    if (assignType === 'TEAM' && !selectedTeamId) {
      toast.error('Please select a team.');
      return;
    }

    if (assignType === 'PERSON' && !selectedUserId) {
      toast.error('Please select a person.');
      return;
    }

    if (!assignType) {
      toast.error('Please select an assignment target type.');
      return;
    }

    if (needsReason && !reason.trim()) {
      toast.error('Please specify a reason for reassignment.');
      return;
    }

    const payload = {
      leadIds: leadsArray.map(l => l.id),
      teamId: assignType === 'TEAM' ? Number(selectedTeamId) : null,
      assignedToId: assignType === 'PERSON' ? Number(selectedUserId) : null,
      notes: notes.trim() || null,
      reason: reason.trim() || null
    };

    try {
      const response = await assignMutation.mutateAsync(payload);
      if (response?.summary) {
        const { successCount, failCount } = response.summary;
        if (failCount === 0) {
          toast.success(`Successfully assigned ${successCount} lead(s).`);
          onSuccess?.();
          onClose();
        } else {
          const failures = response.results
            .filter(r => !r.success)
            .map(r => `Lead #${r.leadId}: ${r.reason}`)
            .join('\n');
          toast.warning(`Assigned ${successCount} leads. ${failCount} failed:\n${failures}`, { duration: 6000 });
          onSuccess?.();
          onClose();
        }
      } else {
        toast.success('Leads assigned successfully.');
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      // Handled by mutation onError hook
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isBulk ? "Bulk Lead Assignment" : "Assign Lead"}
      subtitle={isBulk ? `Configure routing for ${leadsArray.length} selected leads` : (singleLead ? `${singleLead.name} • ${singleLead.mobile}` : '')}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between gap-6 pb-6">
        <div className="space-y-5 overflow-y-auto pr-1">
          {/* Current Owner Visibility */}
          {!isBulk && singleLead && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Ownership</span>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <Users size={14} className="text-slate-400" />
                  <span>Team: {singleLead.team?.name || <span className="text-slate-400 italic font-normal">None</span>}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <User size={14} className="text-slate-400" />
                  <span>User: {singleLead.assignedTo?.name || <span className="text-slate-400 italic font-normal">Unassigned</span>}</span>
                </div>
              </div>
            </div>
          )}

          {isBulk && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Selected Leads</span>
              <p className="text-xs text-slate-600 font-semibold">
                You are assigning {leadsArray.length} leads:
              </p>
              <div className="max-h-[120px] overflow-y-auto mt-2 space-y-1 pr-1 custom-scrollbar">
                {leadsArray.map(lead => (
                  <div key={lead.id} className="text-[11px] text-slate-500 font-medium bg-white px-2 py-1 rounded border border-slate-100">
                    {lead.name} ({lead.mobile})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Select Company - Super Admin Only */}
          {isSuperAdmin && (
            <div className="animate-in fade-in duration-200">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 size={12} /> Select Company
              </label>
              <SearchableSelect
                options={companyOptions}
                value={selectedCompanyId}
                onChange={(val) => {
                  setSelectedCompanyId(val);
                  setSelectedBranchId('');
                  setSelectedTeamId('');
                  setSelectedUserId('');
                }}
                placeholder="Search or select a company..."
                isLoading={isLoadingCompanies}
                allowEmptyOption={true}
              />
            </div>
          )}

          {/* Select Branch - Super Admin & Company Admin Only */}
          {(isCompanyAdmin || (isSuperAdmin && selectedCompanyId)) && (
            <div className="animate-in fade-in duration-200">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <GitBranch size={12} /> Select Branch
              </label>
              <SearchableSelect
                options={branchOptions}
                value={selectedBranchId}
                onChange={(val) => {
                  setSelectedBranchId(val);
                  setSelectedTeamId('');
                  setSelectedUserId('');
                }}
                placeholder="Search or select a branch..."
                isLoading={isLoadingBranches}
                allowEmptyOption={true}
              />
            </div>
          )}

          {/* Mode Selector Pill Toggle - Shown after Company/Branch context is resolved */}
          {(!isSuperAdmin || selectedCompanyId) && (!isCompanyAdmin || selectedBranchId) && (
            <div className="animate-in fade-in duration-200 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assignment Mode</label>
                <div className="grid grid-cols-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignType('TEAM');
                      setSelectedUserId('');
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${assignType === 'TEAM'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/20'
                        : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    Assign to Team
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignType('PERSON');
                      setSelectedTeamId('');
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${assignType === 'PERSON'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/20'
                        : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    Assign to Person
                  </button>
                </div>
              </div>

              {/* Select Team - Shown conditionally */}
              {assignType === 'TEAM' && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Team</label>
                  <SearchableSelect
                    options={teamOptions}
                    value={selectedTeamId}
                    onChange={(val) => setSelectedTeamId(val)}
                    placeholder="Search or select a team..."
                    isLoading={isLoadingTeams}
                    allowEmptyOption={true}
                  />
                </div>
              )}

              {/* Select Person - Shown conditionally */}
              {assignType === 'PERSON' && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Person</label>
                  <SearchableSelect
                    options={userOptions}
                    value={selectedUserId}
                    onChange={(val) => setSelectedUserId(val)}
                    placeholder="Search or select a person..."
                    isLoading={isLoadingAllUsers}
                    allowEmptyOption={true}
                  />
                </div>
              )}

              {/* Assignment Notes */}
              {assignType && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5"><FileText size={12} /> Notes</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes regarding this assignment..."
                    className="w-full text-[13px] bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:outline-none focus:border-[#F86F03] focus:bg-white transition-all resize-none h-24 placeholder:text-slate-400 text-slate-800"
                  />
                </div>
              )}

              {/* Reassignment Reason */}
              {assignType && needsReason && (
                <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-4 space-y-2.5 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-amber-500" /> Reassignment Reason (Required)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please specify why ownership is being changed..."
                    className="w-full text-[13px] bg-white border border-amber-200 rounded-xl p-3 focus:outline-none focus:border-amber-400 transition-all resize-none h-20 placeholder:text-slate-400 text-slate-800"
                    required
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <Button
            onClick={onClose}
            variant="outlined"
            className="flex-1"
            sx={{
              borderColor: '#E2E8F0',
              color: '#475569',
              '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            className="flex-1"
            isLoading={assignMutation.isPending}
            disabled={!assignType}
          >
            Submit Assignment
          </Button>
        </div>
      </form>
    </Drawer>
  );
};

export default AssignLeadDrawer;
