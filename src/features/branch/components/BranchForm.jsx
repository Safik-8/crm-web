// src/features/branch/components/BranchForm.jsx

import React from 'react';
import { Save, GitBranch, MapPin, Power } from 'lucide-react';
import { useCreateBranch, useUpdateBranch } from '../hooks/useBranches';
import { toast, enhancedToast } from '../../../shared/utils/toast';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import TextField from '../../../shared/components/elements/TextField';

const professionalInputSx = {
  '& .MuiInputBase-root': {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #f1f5f9',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f1f5f9',
      border: '1px solid #e2e8f0',
    },
    '&.Mui-focused': {
      backgroundColor: '#ffffff',
      border: '1px solid #f97316', // primary orange
      boxShadow: '0 0 0 3px rgba(249, 115, 22, 0.1)',
    },
  },
  '& .MuiInputBase-input': {
    padding: '12px 14px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#334155',
  }
};

/**
 * BranchForm Component
 * Slide-over drawer form to create or edit a branch.
 * Integrated with TanStack Query and professional UI styling.
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
    // ── Section 1: Branch Identity ──
    {
      key: 'identity_header',
      render: () => (
        <div className="mb-2 mt-2">
          <div className="flex items-center gap-2 p-3 bg-slate-50/80 border border-slate-100 rounded-xl shadow-sm">
            <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
              <GitBranch size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="font-heading font-black text-slate-800 text-sm tracking-tight leading-none">
                Branch Identity
              </h4>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                Basic naming and code
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'name',
      label: 'Branch Name',
      required: true,
      render: (value, onChange, formValues, errorText) => (
        <TextField
          label="Branch Name"
          value={value || ''}
          onChange={(val) => onChange('name', val)}
          placeholder="Enter branch name..."
          errorText={errorText}
          required={true}
          sx={professionalInputSx}
        />
      )
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
          sx={{
            ...professionalInputSx,
            '& .MuiInputBase-input': {
              ...professionalInputSx['& .MuiInputBase-input'],
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }
          }}
        />
      )
    },

    // ── Section 2: Location Information ──
    {
      key: 'location_header',
      render: () => (
        <div className="mb-2 mt-6">
          <div className="flex items-center gap-2 p-3 bg-slate-50/80 border border-slate-100 rounded-xl shadow-sm">
            <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
              <MapPin size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="font-heading font-black text-slate-800 text-sm tracking-tight leading-none">
                Location Details
              </h4>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                Geographical properties
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'address',
      label: 'Street Address',
      required: false,
      render: (value, onChange, formValues, errorText) => (
        <TextField
          label="Street Address"
          value={value || ''}
          onChange={(val) => onChange('address', val)}
          placeholder="Enter physical branch address..."
          errorText={errorText}
          sx={professionalInputSx}
        />
      )
    },
    {
      key: 'location',
      label: 'Location / City',
      required: false,
      render: (value, onChange, formValues, errorText) => (
        <TextField
          label="Location / City"
          value={value || ''}
          onChange={(val) => onChange('location', val)}
          placeholder="e.g. Toronto, London, New York..."
          errorText={errorText}
          sx={professionalInputSx}
        />
      )
    },

    // ── Section 3: Operational Setup ──
    {
      key: 'status_header',
      render: () => (
        <div className="mb-2 mt-6">
          <div className="flex items-center gap-2 p-3 bg-slate-50/80 border border-slate-100 rounded-xl shadow-sm">
            <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
              <Power size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="font-heading font-black text-slate-800 text-sm tracking-tight leading-none">
                Operational Status
              </h4>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                Toggle branch activation
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Operational Status',
      render: (value, onChange, formValues) => {
        const activeStatus = value || 'ACTIVE';
        return (
          <div className="flex flex-col gap-2 w-full mb-1">
            <span className="block text-slate-700 font-bold text-[13px] ml-1">
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
                    className={`flex-1 flex items-center justify-center gap-2.5 h-[48px] rounded-xl border-2 font-black text-[13px] select-none transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10'
                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
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
