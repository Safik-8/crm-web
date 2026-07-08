// src/features/branch/components/BranchForm.jsx

import React from 'react';
import { Save, GitBranch } from 'lucide-react';
import { useCreateBranch, useUpdateBranch } from '../hooks/useBranches';
import { toast, enhancedToast } from '../../../shared/utils/toast';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import TextField from '../../../shared/components/elements/TextField';

/**
 * BranchForm Component
 * Slide-over drawer form to create or edit a branch.
 * Integrated with TanStack Query.
 */
const BranchForm = ({ isOpen, onClose, branch, companyId, onSuccess }) => {
  const isEdit = !!branch;
  const createBranchMutation = useCreateBranch();
  const updateBranchMutation = useUpdateBranch();

  const handleSubmit = async (values) => {
    const loadingToastId = enhancedToast.saveProgress('Branch');
    try {
      if (isEdit) {
        await updateBranchMutation.mutateAsync({
          id: branch.id,
          data: {
            name: values.name,
            address: values.address,
            location: values.location,
            status: values.status
          }
        });
      } else {
        await createBranchMutation.mutateAsync({
          companyId: Number(companyId),
          name: values.name,
          code: values.code,
          address: values.address,
          location: values.location,
          status: values.status
        });
      }

      toast.dismiss(loadingToastId);
      enhancedToast.operationSuccess(
        isEdit ? 'Updated' : 'Created',
        'Branch'
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.dismiss(loadingToastId);
      
      if (error && error.statusCode === 409) {
        toast.error('Code Already Exists', {
          description: 'The provided branch code is already in use.',
        });
        throw { code: 'This branch code is already active in the system.' };
      } else {
        enhancedToast.operationError(
          isEdit ? 'update' : 'create',
          'branch',
          error?.message
        );
        throw error;
      }
    }
  };

  const fields = [
    {
      key: 'name',
      label: 'Branch Name',
      type: 'text',
      placeholder: 'Enter branch name...',
      required: true
    },
    {
      key: 'code',
      label: 'Unique Branch Code',
      required: !isEdit,
      disabled: isEdit,
      render: (value, onChange, formValues, errorText) => (
        <TextField
          id="branch-code"
          label="Unique Branch Code"
          disabled={isEdit}
          value={value || ''}
          onChange={(val) => onChange('code', val.toUpperCase())}
          placeholder="e.g. AHM_HQ"
          errorText={errorText}
          required={!isEdit}
          helperText={!isEdit ? "Unique identifier within the company. Cannot be changed later." : undefined}
          inputSx={{
            '& .MuiInputBase-input': {
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }
          }}
        />
      )
    },
    {
      key: 'address',
      label: 'Street Address',
      type: 'text',
      placeholder: 'Enter physical branch address...',
      required: false
    },
    {
      key: 'location',
      label: 'Location / City',
      type: 'text',
      placeholder: 'e.g. Toronto, London, New York...',
      required: false
    },
    {
      key: 'status',
      label: 'Operational Status',
      render: (value, onChange, formValues) => {
        const activeStatus = value || 'ACTIVE';
        return (
          <div className="flex flex-col gap-2 w-full mb-1">
            <span className="block text-slate-500 font-bold text-xs ml-0.5">
              Operational Status
            </span>
            
            <div className="flex gap-4 w-full">
              {['ACTIVE', 'INACTIVE'].map((statusOption) => {
                const isSelected = activeStatus === statusOption;
                return (
                  <button
                    key={statusOption}
                    type="button"
                    onClick={() => onChange('status', statusOption)}
                    className={`flex-1 flex items-center justify-center gap-2.5 h-[42px] rounded-xl border font-bold text-xs select-none transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-orange-50/40 text-primary'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected ? 'border-primary bg-primary' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    {statusOption === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }
    }
  ];

  const initialValues = {
    name: branch?.name || '',
    code: branch?.code || '',
    address: branch?.address || '',
    location: branch?.location || '',
    status: branch?.status || 'ACTIVE'
  };

  return (
    <DynamicFormSlideover
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Refine Branch Details' : 'Register New Branch'}
      subtitle={isEdit ? 'Update identity for an existing branch' : 'Onboard a new geographical or functional hub'}
      icon={GitBranch}
      fields={fields}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      submitText={isEdit ? 'Commit Changes' : 'Initialize Branch'}
      submitIcon={Save}
    />
  );
};

export default BranchForm;
