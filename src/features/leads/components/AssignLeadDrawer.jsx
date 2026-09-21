import React, { useState, useEffect, useMemo } from 'react';
import Drawer from '../../../shared/components/elements/Drawer';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import Button from '../../../shared/components/elements/Button';
import { useAuth } from '../../../app/providers/AuthProvider';
import { getRoleHierarchy } from '../../../lib/utils/roleHierarchy';
import { useTeamsQuery } from '../../teams/hooks/useTeams';
import { userService } from '../../users/services/userService';
import { branchService } from '../../branch/services/branchService';
import { companyService } from '../../company/services/companyService';
import { useQuery } from '@tanstack/react-query';
import { useAssignLeadsMutation } from '../hooks/useLeads';
import { toast } from '../../../shared/utils/toast';
import {
  User,
  Users,
  FileText,
  ShieldAlert,
  GitBranch,
  Building2,
  UserCheck,
  Layers
} from 'lucide-react';

export const AssignLeadDrawer = ({ isOpen, onClose, leads = [], onSuccess }) => {
  const { user: currentUser } = useAuth();
  const assignMutation = useAssignLeadsMutation();

  const leadsArray = useMemo(() => {
    return Array.isArray(leads) ? leads : leads ? [leads] : [];
  }, [leads]);

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
  const [errors, setErrors] = useState({});

  const { isSuperAdmin, isCompanyWide, isBranchLevel } = getRoleHierarchy(currentUser);
  const isCompanyAdmin = isCompanyWide && !isSuperAdmin;
  const isBranchManager = isBranchLevel;

  // Reset form states and default scopes on open
  useEffect(() => {
    if (isOpen) {
      if (singleLead) {
        setSelectedCompanyId(singleLead.companyId ? singleLead.companyId.toString() : (currentUser?.companyId ? currentUser.companyId.toString() : ''));
        setSelectedBranchId(singleLead.branchId ? singleLead.branchId.toString() : (currentUser?.branchId ? currentUser.branchId.toString() : ''));

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
      setErrors({});
    }
  }, [isOpen, singleLead, currentUser]);

  // Determine if a reason is required (if any lead already has an owner)
  const needsReason = useMemo(() => {
    return leadsArray.some(lead => Boolean(lead?.assignedToId || lead?.teamId));
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

  // Target Branch for teams/users query
  const targetBranchId = (isCompanyAdmin || isSuperAdmin) ? selectedBranchId : currentUser?.branchId;

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

  const validate = () => {
    const errs = {};

    if (isSuperAdmin && !selectedCompanyId) {
      errs.companyId = 'Company selection is required';
    }

    if ((isCompanyAdmin || isSuperAdmin) && !selectedBranchId) {
      errs.branchId = 'Branch selection is required';
    }

    if (!assignType) {
      errs.assignType = 'Please select an assignment mode';
    } else if (assignType === 'TEAM' && !selectedTeamId) {
      errs.selectedTeamId = 'Team selection is required';
    } else if (assignType === 'PERSON' && !selectedUserId) {
      errs.selectedUserId = 'Sales representative selection is required';
    }

    if (needsReason && !reason.trim()) {
      errs.reason = 'Please specify a reason for reassignment';
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      setTimeout(() => {
        const firstErrorEl = document.querySelector('.Mui-error');
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const inputEl = firstErrorEl.querySelector('input, textarea, select');
          if (inputEl) inputEl.focus();
        }
      }, 100);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!validate()) {
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

  const getCustomFooter = () => {
    return (
      <div className="flex w-full items-center justify-end gap-2">
        <Button
          variant="text"
          onClick={onClose}
          disabled={assignMutation.isPending}
          sx={{
            color: '#475569',
            fontWeight: 600,
            fontSize: '13px',
            '&:hover': { bgcolor: 'transparent', color: '#0F172A' }
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="lead-assign-form"
          variant="contained"
          color="primary"
          startIcon={<UserCheck size={15} />}
          isLoading={assignMutation.isPending}
        >
          {isBulk ? `Assign ${leadsArray.length} Leads` : 'Assign Lead'}
        </Button>
      </div>
    );
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={() => !assignMutation.isPending && onClose()}
      title={isBulk ? "Bulk Lead Assignment" : "Assign Lead"}
      subtitle={isBulk ? `Configure routing for ${leadsArray.length} selected leads.` : (singleLead ? `${singleLead.name} • ${singleLead.mobile}` : 'Assign lead to a team or representative.')}
      width={{ xs: '100%', sm: 480, md: 520 }}
      icon={UserCheck}
      showFooter={true}
      customFooter={getCustomFooter()}
    >
      <form id="lead-assign-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Section 0: Current Ownership / Selected Leads Summary Card */}
        {!isBulk && singleLead && (
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Current Ownership</span>
              <span className="text-[11px] font-semibold text-slate-400">{singleLead?.mobile}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-white rounded-lg p-2.5 border border-slate-200/60 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                  <Users size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Team</p>
                  <p className="text-xs font-bold text-slate-700 truncate">
                    {singleLead.team?.name || <span className="text-slate-400 font-normal italic">None</span>}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-slate-200/60 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <User size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Owner</p>
                  <p className="text-xs font-bold text-slate-700 truncate">
                    {singleLead.assignedTo?.name || <span className="text-slate-400 font-normal italic">Unassigned</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isBulk && (
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Selected Leads</span>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/60">
                {leadsArray.length} Leads
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              You are re-routing ownership for the following prospects:
            </p>
            <div className="max-h-[110px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {leadsArray.map(lead => (
                <div key={lead.id} className="text-xs text-slate-700 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200/60 flex items-center justify-between">
                  <span className="font-semibold truncate">{lead.name}</span>
                  <span className="text-slate-400 text-[11px] shrink-0 ml-2">{lead.mobile}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 1: Territory Scope (Super Admin & Company Admin Only) */}
        {(isSuperAdmin || isCompanyAdmin) && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5 mb-4">
              Territory Scope
            </h3>

            <div className={isSuperAdmin ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-3.5"}>
              {isSuperAdmin && (
                <SelectField
                  id="assign-company"
                  label="Company"
                  placeholder="Select Company..."
                  required
                  value={selectedCompanyId}
                  onChange={(val) => {
                    setSelectedCompanyId(val);
                    setSelectedBranchId('');
                    setSelectedTeamId('');
                    setSelectedUserId('');
                    if (errors.companyId) setErrors(prev => ({ ...prev, companyId: null }));
                  }}
                  options={companyOptions}
                  isLoading={isLoadingCompanies}
                  errorText={errors.companyId}
                  startIcon={Building2}
                  searchable={true}
                />
              )}

              <SelectField
                id="assign-branch"
                label="Branch"
                placeholder="Select Branch..."
                required
                value={selectedBranchId}
                onChange={(val) => {
                  setSelectedBranchId(val);
                  setSelectedTeamId('');
                  setSelectedUserId('');
                  if (errors.branchId) setErrors(prev => ({ ...prev, branchId: null }));
                }}
                options={branchOptions}
                isLoading={isLoadingBranches}
                disabled={!targetCompanyId}
                errorText={errors.branchId}
                startIcon={GitBranch}
                searchable={true}
              />
            </div>
          </div>
        )}

        {/* Section 2: Assignment Routing */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5 mb-4">
            Assignment Target
          </h3>

          <SelectField
            id="assign-mode"
            label="Assignment Mode"
            placeholder="Select Assignment Target..."
            required
            value={assignType}
            onChange={(val) => {
              setAssignType(val);
              setSelectedTeamId('');
              setSelectedUserId('');
              if (errors.assignType) setErrors(prev => ({ ...prev, assignType: null }));
            }}
            options={[
              { id: 'TEAM', name: 'Assign to Team' },
              { id: 'PERSON', name: 'Assign to Individual Representative' }
            ]}
            errorText={errors.assignType}
            startIcon={Layers}
            searchable={false}
          />

          {assignType === 'TEAM' && (
            <SelectField
              id="assign-team"
              label="Team"
              placeholder="Select Team..."
              required
              value={selectedTeamId}
              onChange={(val) => {
                setSelectedTeamId(val);
                if (errors.selectedTeamId) setErrors(prev => ({ ...prev, selectedTeamId: null }));
              }}
              options={teamOptions}
              isLoading={isLoadingTeams}
              disabled={!targetCompanyId || (!isBranchManager && !selectedBranchId)}
              errorText={errors.selectedTeamId}
              startIcon={Users}
              searchable={true}
            />
          )}

          {assignType === 'PERSON' && (
            <SelectField
              id="assign-user"
              label="Sales Representative"
              placeholder="Select Representative..."
              required
              value={selectedUserId}
              onChange={(val) => {
                setSelectedUserId(val);
                if (errors.selectedUserId) setErrors(prev => ({ ...prev, selectedUserId: null }));
              }}
              options={userOptions}
              isLoading={isLoadingAllUsers}
              disabled={!targetCompanyId || (!isBranchManager && !selectedBranchId)}
              errorText={errors.selectedUserId}
              startIcon={UserCheck}
              searchable={true}
            />
          )}
        </div>

        {/* Section 3: Notes & Reassignment Reason */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5 mb-4">
            Notes & Remarks
          </h3>

          <TextField
            id="assign-notes"
            label="Assignment Notes"
            placeholder="Optional notes or routing instructions for the assignee..."
            multiline
            rows={3}
            value={notes}
            onChange={(val) => setNotes(val)}
            startIcon={FileText}
          />

          {needsReason && (
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-700">
                <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">Reassignment Reason Required</span>
              </div>
              <p className="text-[11px] text-amber-600/90 leading-relaxed">
                One or more selected leads currently have an assigned owner or team. Please specify why ownership is being changed.
              </p>
              <TextField
                id="assign-reason"
                placeholder="e.g. Territory reorganization / Lead rebalancing..."
                multiline
                rows={2}
                required
                value={reason}
                onChange={(val) => {
                  setReason(val);
                  if (errors.reason) setErrors(prev => ({ ...prev, reason: null }));
                }}
                errorText={errors.reason}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#FFFFFF'
                  }
                }}
              />
            </div>
          )}
        </div>
      </form>
    </Drawer>
  );
};

export default AssignLeadDrawer;
