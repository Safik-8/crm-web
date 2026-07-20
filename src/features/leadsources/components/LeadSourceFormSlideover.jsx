// src/features/leadsources/components/LeadSourceFormSlideover.jsx

import React from 'react';
import { Compass } from 'lucide-react';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import TextField from '../../../shared/components/elements/TextField';
import {
  useCreateLeadSourceMutation,
  useUpdateLeadSourceMutation
} from '../hooks/useLeadSources';

export const LeadSourceFormSlideover = ({ isOpen, mode, source, onClose }) => {
  const createMutation = useCreateLeadSourceMutation();
  const updateMutation = useUpdateLeadSourceMutation();

  const isEdit = mode === 'edit';

  const fields = [
    {
      key: 'name',
      label: 'Source Name',
      required: true,
      placeholder: 'e.g. Website, Facebook Ads, Events...',
    },
    {
      key: 'description',
      label: 'Description',
      render: (value, onChange, _values, errorText) => (
        <TextField
          id="input-description"
          label="Description"
          placeholder="Describe this acquisition channel..."
          value={value}
          onChange={(val) => onChange('description', val)}
          errorText={errorText}
          multiline
          rows={3}
        />
      )
    }
  ];

  if (isEdit) {
    fields.push({
      key: 'isActive',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: true, label: 'Active' },
        { value: false, label: 'Inactive' }
      ]
    });
  }

  const initialValues = isEdit
    ? {
        name: source?.name || '',
        description: source?.description || '',
        isActive: source?.isActive ?? true
      }
    : {
        name: '',
        description: '',
        isActive: true
      };

  const handleSubmit = async (values) => {
    try {
      const isActiveBool = values.isActive === 'true' || values.isActive === true;

      if (!isEdit) {
        await createMutation.mutateAsync({
          name: values.name,
          description: values.description
        });
      } else {
        await updateMutation.mutateAsync({
          id: source.id,
          data: {
            name: values.name,
            description: values.description,
            isActive: isActiveBool
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
        throw { name: err.message || 'Lead source name already exists' };
      }
      throw { name: err?.message || 'Something went wrong' };
    }
  };

  return (
    <DynamicFormSlideover
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Lead Source' : 'Add Lead Source'}
      subtitle={isEdit ? 'Update acquisition channel details' : 'Define a standard lead acquisition channel'}
      icon={Compass}
      fields={fields}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      submitText={isEdit ? 'Save Changes' : 'Create Source'}
      isLoading={createMutation.isPending || updateMutation.isPending}
    />
  );
};

export default LeadSourceFormSlideover;
