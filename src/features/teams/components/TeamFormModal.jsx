// src/features/teams/components/TeamFormModal.jsx

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users2 } from 'lucide-react';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import { SearchableSelect } from '../../../shared/components/elements/SearchableSelect';
import Button from '../../../shared/components/elements/Button';
import { useCreateTeamMutation, useUpdateTeamMutation } from '../hooks/useTeams';
import { teamService } from '../services/teamService';
import { userService } from '../../users/services/userService';
import { branchService } from '../../branch/services/branchService';
import { companyService } from '../../company/services/companyService';
import { toast } from '../../../shared/utils/toast';

const TeamFormModal = ({
  isOpen,
  onClose,
  initialValues = null,
  companies = [],
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

  // Scoping helper
  const formActorRank = currentUser?.primaryRoleRank ?? 0;
  const canSelectCompany = formActorRank >= 100;
  const targetCompanyId = canSelectCompany ? companyId : currentUser?.companyId;

  // Sync state with initial values
  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        setName(initialValues.name || '');
        setCode(initialValues.code || '');
        setCompanyId(initialValues.companyId || currentUser?.companyId || '');
        setBranchId(initialValues.branchId || '');
        setBdeId(initialValues.bdeId || '');
        setStatus(initialValues.status || 'ACTIVE');
        const membersList = initialValues.members || [];
        const isesList = membersList.filter(m => m.memberRole === 'ISE' && !m.removedAt).map(m => m.userId);
        setIseIds(isesList);
      } else {
        setName('');
        setCode('');
        setCompanyId(currentUser?.companyId || '');
        setBranchId(currentUser?.primaryRole === 'BRANCH_MANAGER' ? currentUser.branchId : '');
        setBdeId('');
        setStatus('ACTIVE');
        setIseIds([]);
      }
      setErrors({});
    }
  }, [isOpen, initialValues, currentUser]);

  // Fetch Companies (for Super Admin)
  const { data: companiesRes } = useQuery({
    queryKey: ['companies-form-options'],
    queryFn: () => companyService.getCompaniesRaw(),
    enabled: canSelectCompany && isOpen
  });
  const companyOptions = (companiesRes?.data || []).map(c => ({
    value: c.id,
    label: c.name
  }));

  // Fetch Branches for target company
  const { data: branchesRes } = useQuery({
    queryKey: ['branches-form-options', targetCompanyId],
    queryFn: () => branchService.getBranchesRaw(targetCompanyId),
    enabled: !!targetCompanyId && isOpen && currentUser?.primaryRole !== 'BRANCH_MANAGER'
  });
  const branchOptions = (Array.isArray(branchesRes?.data) ? branchesRes.data : (branchesRes?.data?.branches || [])).map(b => ({
    value: b.id,
    label: b.name
  }));

  // Fetch BDE users for selected branch
  const { data: usersRes, isLoading: isLoadingBdes, refetch: refetchUsers } = useQuery({
    queryKey: ['branch-bdes-options', branchId],
    queryFn: () => userService.getUsers({ branchId, status: 'ACTIVE', limit: 150 }),
    enabled: !!branchId && isOpen,
    staleTime: 0
  });

  // Fetch all teams to identify active BDE owners
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

  const assignedBdeIds = allTeams
    .filter(t => !isEditMode || t.id !== initialValues?.id)
    .map(t => t.bdeId);

  const assignedIseIds = allTeams
    .filter(t => !isEditMode || t.id !== initialValues?.id)
    .flatMap(t => (t.members || []).filter(m => m.memberRole === 'ISE' && !m.removedAt).map(m => m.userId));

  const allUsers = usersRes?.data?.users || usersRes?.data || [];

  const bdeOptions = allUsers
    .filter(u => u.userRoles?.some(ur => ur.role?.name === 'BDE'))
    .filter(u => !assignedBdeIds.includes(u.id))
    .map(u => ({
      id: u.id,
      name: `${u.name} (${u.employeeId || 'No ID'})`
    }));

  const iseOptions = allUsers
    .filter(u => u.userRoles?.some(ur => ur.role?.name === 'ISE'))
    .filter(u => !assignedIseIds.includes(u.id))
    .map(u => ({
      id: u.id,
      name: `${u.name} (${u.employeeId || 'No ID'})`
    }));

  const validate = () => {
    const tempErrors = {};
    if (!name?.trim()) tempErrors.name = 'Team name is required';
    if (!isEditMode && !code?.trim()) tempErrors.code = 'Team code is required';
    if (!isEditMode && canSelectCompany && !companyId) tempErrors.companyId = 'Company selection is required';
    if (!isEditMode && !branchId) tempErrors.branchId = 'Branch selection is required';
    if (!bdeId) {
      tempErrors.bdeId = 'At least 1 BDE is must';
    } else if (iseIds.includes(Number(bdeId)) || iseIds.includes(String(bdeId))) {
      tempErrors.bdeId = 'The Team Owner (BDE) cannot also be assigned as an ISE member';
    }

    const uniqueIseIds = [...new Set(iseIds)];
    if (uniqueIseIds.length !== iseIds.length) {
      tempErrors.iseIds = 'Duplicate ISE assignments are not allowed';
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

        {/* Section 2: Branch Scope */}
        {!isEditMode && (canSelectCompany || currentUser?.primaryRole !== 'BRANCH_MANAGER') && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5">
              Location & Scope
            </h3>

            {/* Company Selection (Super Admin only) */}
            {canSelectCompany && (
              <SelectField
                id="companyId"
                label="Assign to Company"
                value={companyId}
                onChange={(val) => {
                  setCompanyId(val);
                  setBranchId('');
                  setBdeId('');
                  if (errors.companyId) setErrors(prev => ({ ...prev, companyId: null }));
                }}
                options={companyOptions}
                errorText={errors.companyId}
                required
              />
            )}

            {/* Branch Selection (Super Admin & Company Admin only) */}
            {currentUser?.primaryRole !== 'BRANCH_MANAGER' && (
              <SelectField
                id="branchId"
                label="Assign to Branch"
                value={branchId}
                onChange={(val) => {
                  setBranchId(val);
                  setBdeId('');
                  if (errors.branchId) setErrors(prev => ({ ...prev, branchId: null }));
                }}
                options={branchOptions}
                errorText={errors.branchId}
                searchable={true}
                required
              />
            )}
          </div>
        )}

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

        {/* Section 3b: ISE Members Assignment */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5">
            Assign Team Members (ISEs)
          </h3>
          
          {!branchId ? (
            <p className="text-xs italic text-slate-400">Please select a branch to view available ISEs.</p>
          ) : isLoadingBdes ? (
            <p className="text-xs italic text-slate-400">Loading members...</p>
          ) : iseOptions.length === 0 ? (
            <p className="text-xs italic text-slate-400">No active ISEs found in this branch.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2.5">
              {iseOptions.map(ise => {
                const isChecked = iseIds.includes(ise.id);
                return (
                  <label key={ise.id} className="flex items-center gap-3 px-2 py-1.5 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setIseIds(prev => prev.filter(id => id !== ise.id));
                        } else {
                          setIseIds(prev => [...prev, ise.id]);
                        }
                      }}
                    />
                    <div className="text-left">
                      <span className="text-[13px] font-bold text-slate-700 block leading-tight">{ise.name}</span>
                    </div>
                  </label>
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
