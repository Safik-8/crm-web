// src/features/leadstatuses/components/LeadStatusFormSlideover.jsx
import React from 'react';
import { Tags } from 'lucide-react';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import TextField from '../../../shared/components/elements/TextField';
import {
  useCreateLeadStatusMutation,
  useUpdateLeadStatusMutation
} from '../hooks/useLeadStatuses';

export const LeadStatusFormSlideover = ({ isOpen, mode, status, onClose }) => {
  const createMutation = useCreateLeadStatusMutation();
  const updateMutation = useUpdateLeadStatusMutation();

  const isEdit = mode === 'edit';

  const fields = [
    {
      key: 'name',
      label: 'Status Name',
      required: true,
      placeholder: 'e.g. In Progress, Hot Lead, Closed Won...',
    },
    {
      key: 'displayColor',
      label: 'Display Color',
      required: true,
      render: (value, onChange, _values, errorText) => (
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Display Color <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value || '#3b82f6'}
              onChange={(e) => onChange('displayColor', e.target.value)}
              className="h-10 w-14 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white flex-shrink-0"
            />
            <div className="flex-1">
              <TextField
                id="input-color-hex"
                value={value || ''}
                onChange={(val) => {
                  if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                    onChange('displayColor', val);
                  }
                }}
                placeholder="#3b82f6"
                errorText={errorText}
              />
            </div>
            <div
              className="h-8 w-8 rounded-full border-2 border-white shadow-md flex-shrink-0"
              style={{ background: value || '#3b82f6' }}
            />
          </div>
          {errorText && <p className="text-xs text-red-500 mt-1">{errorText}</p>}
        </div>
      )
    }
  ];

  if (isEdit) {
    fields.push({
      key: 'isActive',
      label: 'Status Active',
      type: 'select',
      required: true,
      options: [
        { value: true, label: 'Active' },
        { value: false, label: 'Inactive' }
      ]
    });

    fields.push({
      key: 'isDefault',
      label: 'Is Default Status',
      type: 'select',
      required: true,
      options: [
        { value: true, label: 'Yes' },
        { value: false, label: 'No' }
      ]
    });
  } else {
    // For creation
    fields.push({
      key: 'isDefault',
      label: 'Is Default Status',
      type: 'select',
      required: true,
      options: [
        { value: true, label: 'Yes' },
        { value: false, label: 'No' }
      ]
    });
  }

  const initialValues = isEdit
    ? {
      name: status?.name || '',
      displayColor: status?.displayColor || '#3b82f6',
      isActive: status?.isActive ?? true,
      isDefault: status?.isDefault ?? false,
    }
    : {
      name: '',
      displayColor: '#3b82f6',
      isActive: true,
      isDefault: false,
    };

  const handleSubmit = async (values) => {
    try {
      const isDefaultBool = values.isDefault === 'true' || values.isDefault === true;
      const isActiveBool = values.isActive === 'true' || values.isActive === true;

      if (!isEdit) {
        await createMutation.mutateAsync({
          name: values.name,
          displayColor: values.displayColor,
          isDefault: isDefaultBool
        });
      } else {
        await updateMutation.mutateAsync({
          id: status.id,
          data: {
            name: values.name,
            displayColor: values.displayColor,
            isActive: isActiveBool,
            isDefault: isDefaultBool
          }
        });
      }
      onClose();
    } catch (err) {
      if (err?.errors && Array.isArray(err.errors)) {
        const fieldErrors = {};
        err.errors.forEach((e) => {
          if (e.field) fieldErrors[e.field] = e.message;
        });
        throw fieldErrors;
      }
      if (err?.code === 'CONFLICT' || err?.statusCode === 409) {
        const field = err?.details?.field || 'name';
        throw { [field]: err.message || 'Status already exists' };
      }
      throw { name: err?.message || 'Something went wrong' };
    }
  };

  return (
    <DynamicFormSlideover
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Lead Status' : 'Add Lead Status'}
      subtitle={isEdit ? 'Update lead status configurations' : 'Define a standard lead status lifecycle stage'}
      icon={Tags}
      fields={fields}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      submitText={isEdit ? 'Save Changes' : 'Create Status'}
      isLoading={createMutation.isPending || updateMutation.isPending}
    >
      {isEdit && (
        <div className="mb-4 mx-6 mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Code:</span>
          <code className="font-mono text-xs bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
            {status?.code}
          </code>
          <span className="text-xs text-slate-400 ml-auto">Auto-generated · Immutable</span>
        </div>
      )}
    </DynamicFormSlideover>
  );
};

export default LeadStatusFormSlideover;
