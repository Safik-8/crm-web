// src/features/teams/components/TeamFormModal.jsx

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users2, Building2, GitBranch } from 'lucide-react';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import Button from '../../../shared/components/elements/Button';
import Checkbox from '../../../shared/components/elements/Checkbox';
import { useCreateTeamMutation, useUpdateTeamMutation } from '../hooks/useTeams';
import { teamService } from '../services/teamService';
import { userService } from '../../users/services/userService';
import { branchService } from '../../branch/services/branchService';
import { companyService } from '../../company/services/companyService';
import { getRoleHierarchy } from '../../../lib/utils/roleHierarchy';

const TeamFormModal = ({
  isOpen,
  onClose,
  initialValues = null,
  companies = [],
  branches = [],
  currentUser = null
}) => {
  const isEditMode = !!initialValues && !!initialValues.id;
  
  const createTeamMutation = useCreateTeamMutation();
  const updateTeamMutation = useUpdateTeamMutation();
  const isLoading = createTeamMutation.isPending || updateTeamMutation.isPending;

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [bdeId, setBdeId] = useState('');
  const [iseIds, setIseIds] = useState([]);
  const [status, setStatus] = useState('ACTIVE');
  const [errors, setErrors] = useState({});

  // Role Hierarchy & Scoping
  const { isSuperAdmin, isCompanyWide, isBranchLevel } = getRoleHierarchy(currentUser);
  const canSelectCompany = isSuperAdmin;
  const canSelectBranch = isSuperAdmin || isCompanyWide;
  const isBranchManager = isBranchLevel;
  const targetCompanyId = canSelectCompany ? companyId : currentUser?.companyId;

  // Sync state with initial values
  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        setName(initialValues.name || '');
        setCode(initialValues.code || '');
        setCompanyId(initialValues.companyId || currentUser?.companyId || '');
        setBranchId(initialValues.branchId || (isBranchManager ? currentUser?.branchId : ''));
        setBdeId(initialValues.bdeId || '');
        setStatus(initialValues.status || 'ACTIVE');
        const membersList = initialValues.members || [];
        const isesList = membersList
          .filter(m => !m.removedAt && m.userId !== initialValues.bdeId)
          .map(m => m.userId);
        setIseIds(isesList);
      } else {
        setName('');
        setCode('');
        setCompanyId(currentUser?.companyId || '');
        setBranchId(isBranchManager ? (currentUser?.branchId || '') : (initialValues?.branchId || ''));
        setBdeId('');
        setStatus('ACTIVE');
        setIseIds([]);
      }
      setErrors({});
    }
  }, [isOpen, initialValues, currentUser, isBranchManager]);

  // Fetch Companies (for Super Admin)
  const { data: companiesRes } = useQuery({
    queryKey: ['companies-form-options'],
    queryFn: () => companyService.getCompaniesRaw(),
    enabled: canSelectCompany && isOpen
  });
  const companyOptions = (companiesRes?.data || companies || []).map(c => ({
    value: c.id,
    label: c.name
  }));

  // Fetch Branches for target company
  const { data: branchesRes, isLoading: isLoadingBranches } = useQuery({
    queryKey: ['branches-form-options', targetCompanyId],
    queryFn: () => branchService.getBranchesRaw(targetCompanyId),
    enabled: !!targetCompanyId && isOpen
  });
  const rawBranches = Array.isArray(branchesRes?.data)
    ? branchesRes.data
    : (branchesRes?.data?.branches || branchesRes?.branches || branchesRes?.data?.data || (targetCompanyId === currentUser?.companyId ? branches : []));
  const branchOptions = rawBranches.map(b => ({
    value: b.id,
    label: b.code ? `${b.name} (${b.code})` : b.name
  }));

  // Fetch users for selected branch
  const { data: usersRes, isLoading: isLoadingBdes, refetch: refetchUsers } = useQuery({
    queryKey: ['branch-bdes-options', branchId],
    queryFn: () => userService.getUsers({ branchId, status: 'ACTIVE', limit: 150 }),
    enabled: !!branchId && isOpen,
    staleTime: 0
  });

  // Fetch all teams to identify active BDE owners and members (exclude archived/inactive teams)
  const { data: allTeamsRes, refetch: refetchTeams } = useQuery({
    queryKey: ['all-teams-bde-filter'],
    queryFn: () => teamService.getTeams({ limit: 1000 }),
    enabled: isOpen,
    staleTime: 0
  });

  // Force refetch on open to ensure recently created users/teams display immediately
  useEffect(() => {
    if (isOpen) {
      refetchUsers?.();
      refetchTeams?.();
    }
  }, [isOpen, refetchUsers, refetchTeams]);

  const allTeams = allTeamsRes?.data?.teams || allTeamsRes?.teams || [];

  // Only consider active, non-deleted teams when filtering occupied BDEs & members
  const activeOtherTeams = allTeams.filter(t => !t.isDeleted && t.status === 'ACTIVE' && (!isEditMode || t.id !== initialValues?.id));

  const assignedBdeIds = activeOtherTeams.map(t => t.bdeId);

  const assignedIseIds = activeOtherTeams.flatMap(t => 
    (t.members || []).filter(m => !m.removedAt && m.userId !== t.bdeId).map(m => m.userId)
  );

  const allUsers = usersRes?.data?.users || usersRes?.data || [];

  // Team Leader: Strictly BDE only
  const bdeOptions = allUsers
    .filter(u => u.status === 'ACTIVE' || !u.status)
    .filter(u => u.userRoles?.some(ur => ur.role?.name === 'BDE'))
    .filter(u => !assignedBdeIds.includes(u.id) || u.id === initialValues?.bdeId)
    .map(u => ({
      value: u.id,
      label: `${u.name} (${u.employeeId || 'No ID'})`
    }));

  // Helper to check member eligibility (ISE or Custom Role with rank <= 40)
  const isEligibleMemberUser = (u) => {
    if (u.status && u.status !== 'ACTIVE') return false;
    const primaryRole = u.userRoles?.[0]?.role;
    const roleName = primaryRole?.name || u.primaryRole || '';
    const roleRank = Number(primaryRole?.rank ?? u.primaryRoleRank ?? 0);

    // Exclude system management roles and BDE leaders
    if (['SUPER_ADMIN', 'COMPANY_ADMIN', 'BRANCH_MANAGER', 'BDE'].includes(roleName)) {
      return false;
    }

    // Allow ISE or Custom Roles with rank <= 40
    return roleName === 'ISE' || (roleRank <= 40 && roleRank >= 0);
  };

  const getRoleBadgeLabel = (u) => {
    return u.userRoles?.[0]?.role?.name || u.primaryRole || 'Member';
  };

  // Team Members: ISE + Custom Roles (Rank <= 40)
  const iseOptions = allUsers
    .filter(isEligibleMemberUser)
    .filter(u => !assignedIseIds.includes(u.id) || iseIds.includes(u.id))
    .map(u => ({
      id: u.id,
      name: `${u.name} (${getRoleBadgeLabel(u)}${u.employeeId ? ` - ${u.employeeId}` : ''})`
    }));

  // Handle Cascading Changes
  const handleCompanyChange = (val) => {
    setCompanyId(val);
    setBranchId('');
    setBdeId('');
    setIseIds([]);
    if (errors.companyId) setErrors(prev => ({ ...prev, companyId: null }));
    if (errors.branchId) setErrors(prev => ({ ...prev, branchId: null }));
  };

  const handleBranchChange = (val) => {
    setBranchId(val);
    setBdeId('');
    setIseIds([]);
    if (errors.branchId) setErrors(prev => ({ ...prev, branchId: null }));
    if (errors.bdeId) setErrors(prev => ({ ...prev, bdeId: null }));
  };

  const validate = () => {
    const tempErrors = {};
    if (!name?.trim()) tempErrors.name = 'Team name is required';
    if (!isEditMode && !code?.trim()) tempErrors.code = 'Team code is required';
    if (!isEditMode && canSelectCompany && !companyId) tempErrors.companyId = 'Company selection is required';
    if (!isEditMode && !branchId) tempErrors.branchId = 'Branch selection is required';
    if (!bdeId) {
      tempErrors.bdeId = 'Team Leader (BDE) is required';
    } else if (iseIds.includes(Number(bdeId)) || iseIds.includes(String(bdeId))) {
      tempErrors.bdeId = 'The Team Leader (BDE) cannot also be assigned as a team member';
    }

    const uniqueIseIds = [...new Set(iseIds)];
    if (uniqueIseIds.length !== iseIds.length) {
      tempErrors.iseIds = 'Duplicate member assignments are not allowed';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      bdeId: Number(bdeId),
      iseIds,
      status
    };

    if (!isEditMode) {
      payload.code = code.trim().toUpperCase();
      payload.branchId = Number(branchId);
      if (canSelectCompany) {
        payload.companyId = Number(companyId);
      }

      createTeamMutation.mutate(payload, {
        onSuccess: () => {
          onClose();
        },
        onError: (err) => {
          if (err?.code === 'CONFLICT' && err?.details?.field) {
            setErrors(prev => ({ ...prev, [err.details.field]: err.message }));
          } else if (err?.details && Array.isArray(err.details)) {
            const backendErrors = {};
            err.details.forEach(item => {
              backendErrors[item.field] = item.message;
            });
            setErrors(backendErrors);
          }
        }
      });
    } else {
      updateTeamMutation.mutate({ id: initialValues.id, data: payload }, {
        onSuccess: () => {
          onClose();
        },
        onError: (err) => {
          if (err?.code === 'CONFLICT' && err?.details?.field) {
            setErrors(prev => ({ ...prev, [err.details.field]: err.message }));
          } else if (err?.details && Array.isArray(err.details)) {
            const backendErrors = {};
            err.details.forEach(item => {
              backendErrors[item.field] = item.message;
            });
            setErrors(backendErrors);
          }
        }
      });
    }
  };

  const customFooter = (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        disabled={isLoading}
        onClick={onClose}
        variant="outlined"
        sx={{
          borderColor: '#E2E8F0',
          color: '#475569',
          '&:hover': {
            borderColor: '#CBD5E1',
            backgroundColor: '#F8FAFC',
          }
        }}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        onClick={handleFormSubmit}
        disabled={isLoading}
        variant="contained"
        color="primary"
        isLoading={isLoading}
      >
        {isEditMode ? 'Update Team' : 'Create Team'}
      </Button>
    </div>
  );

  return (
    <DynamicFormSlideover
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Team Details' : 'Create New Team'}
      subtitle={isEditMode ? 'Update team name, owner, and status settings' : 'Define new team name, code, branch scope, and assign its BDE lead.'}
      icon={Users2}
      isLoading={isLoading}
      showFooter={true}
      customFooter={customFooter}
      onSubmit={() => handleFormSubmit({ preventDefault: () => {} })}
    >
      <div className="space-y-6">

        {/* Section 1: Basic Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5">
            Team Details
          </h3>
          
          <TextField
            id="teamName"
            label="Team Name"
            placeholder="e.g. Sales Tigers"
            value={name}
            onChange={(val) => {
              setName(val);
              if (errors.name) setErrors(prev => ({ ...prev, name: null }));
            }}
            errorText={errors.name}
            required
          />

          <TextField
            id="teamCode"
            label="Team Code"
            placeholder="e.g. TGR-01"
            value={code}
            onChange={(val) => {
              setCode(val.toUpperCase());
              if (errors.code) setErrors(prev => ({ ...prev, code: null }));
            }}
            disabled={isEditMode}
            errorText={errors.code}
            required
          />
        </div>

        {/* Section 2: Branch & Scope */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5">
            Branch Scope
          </h3>

          {/* Company select for Super Admin */}
          {canSelectCompany && (
            <SelectField
              id="teamCompanySelect"
              label="Company"
              placeholder="Select a company..."
              value={companyId}
              onChange={handleCompanyChange}
              options={companyOptions}
              disabled={isEditMode}
              errorText={errors.companyId}
              searchable={true}
              required
            />
          )}

          {/* Branch select for Super Admin / Company Admin */}
          {canSelectBranch ? (
            <SelectField
              id="teamBranchSelect"
              label="Branch Scope"
              placeholder={targetCompanyId ? "Select a branch..." : "Please select a company first"}
              value={branchId}
              onChange={handleBranchChange}
              options={branchOptions}
              disabled={isEditMode || !targetCompanyId}
              errorText={errors.branchId}
              searchable={true}
              required
            />
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
              <GitBranch size={16} className="text-orange-500" />
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Branch Scope</p>
                <p className="text-xs font-bold text-slate-700">
                  {currentUser?.branch?.name || (branchOptions.find(b => b.value === branchId)?.label) || 'Current Assigned Branch'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: BDE Assignee */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5">
            Team Leadership
          </h3>

          <SelectField
            id="bdeId"
            label="Team Owner (BDE)"
            placeholder={branchId ? "Select a BDE..." : "Please select a branch first"}
            value={bdeId}
            onChange={(val) => {
              setBdeId(val);
              if (errors.bdeId) setErrors(prev => ({ ...prev, bdeId: null }));
            }}
            options={bdeOptions}
            disabled={!branchId || isLoadingBdes}
            errorText={errors.bdeId}
            searchable={true}
            required
          />
        </div>

        {/* Section 3b: Team Members Assignment */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5">
            Assign Team Members (ISE & Custom Roles)
          </h3>
          
          {!branchId ? (
            <p className="text-xs italic text-slate-400">Please select a branch to view available team members.</p>
          ) : isLoadingBdes ? (
            <p className="text-xs italic text-slate-400">Loading members...</p>
          ) : iseOptions.length === 0 ? (
            <p className="text-xs italic text-slate-400">No active eligible team members (ISE or Custom Roles) available in this branch.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50/50 space-y-1">
              {iseOptions.map(ise => {
                const isChecked = iseIds.includes(ise.id);
                return (
                  <Checkbox
                    key={ise.id}
                    id={`ise-${ise.id}`}
                    label={ise.name}
                    checked={isChecked}
                    onChange={(checked) => {
                      if (!checked) {
                        setIseIds(prev => prev.filter(id => id !== ise.id));
                      } else {
                        setIseIds(prev => [...prev, ise.id]);
                      }
                    }}
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '8px',
                      '&:hover': { bgcolor: 'white' }
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Section 4: Operational Status */}
        {isEditMode && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5">
              Status Settings
            </h3>
            <SelectField
              id="status"
              label="Team Status"
              value={status}
              onChange={(val) => setStatus(val)}
              options={[
                { value: 'ACTIVE', label: 'Active (Accepts Assignments)' },
                { value: 'INACTIVE', label: 'Inactive (No New Members)' }
              ]}
              required
            />
          </div>
        )}

      </div>
    </DynamicFormSlideover>
  );
};

export default TeamFormModal;
