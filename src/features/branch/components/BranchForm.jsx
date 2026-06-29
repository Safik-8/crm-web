import React from 'react';
import { Save, GitBranch } from 'lucide-react';
import { toast, enhancedToast } from '../../../shared/utils/toast';
import { branchApi } from '../api/branchApi';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import TextField from '../../../shared/components/elements/TextField';
import {
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
} from '@mui/material';

/**
 * BranchForm Component
 * Slide-over drawer form to create or edit a branch.
 * Powered by reusable DynamicFormSlideover and styled with Material UI.
 */
const BranchForm = ({ isOpen, onClose, branch, companyId, onSuccess }) => {
  const isEdit = !!branch;

  const handleSubmit = async (values) => {
    try {
      let response;
      const loadingToastId = enhancedToast.saveProgress('Branch');

      if (isEdit) {
        response = await branchApi.updateBranch(branch.id, {
          name: values.name,
          status: values.status
        });
      } else {
        response = await branchApi.createBranch({
          companyId: Number(companyId),
          name: values.name,
          code: values.code,
          status: values.status
        });
      }

      toast.dismiss(loadingToastId);

      if (response && response.success) {
        enhancedToast.operationSuccess(
          isEdit ? 'Updated' : 'Created',
          'Branch'
        );
        onSuccess?.();
        onClose();
      } else {
        enhancedToast.operationError(
          isEdit ? 'update' : 'create',
          'branch',
          response?.message
        );
      }
    } catch (error) {
      if (error && (error.statusCode === 409 || error.status === 409)) {
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
          helperText={!isEdit ? "System-wide unique identifier. Cannot be changed later." : undefined}
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
      key: 'status',
      label: 'Operational Status',
      render: (value, onChange, formValues) => {
        const activeStatus = value || 'ACTIVE';
        return (
          <FormControl component="fieldset" fullWidth>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontWeight: 600,
                fontSize: '12px',
                color: '#475569',
                mb: 1.5,
                ml: 0.5
              }}
            >
              Operational Status
            </Typography>
            <RadioGroup
              row
              value={activeStatus}
              onChange={(e) => onChange('status', e.target.value)}
              sx={{ display: 'flex', gap: 3, width: '100%' }}
            >
              {['ACTIVE', 'INACTIVE'].map((statusOption) => {
                const isSelected = activeStatus === statusOption;
                return (
                  <FormControlLabel
                    key={statusOption}
                    value={statusOption}
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: '#CBD5E1',
                          '&.Mui-checked': {
                            color: '#F86F03',
                          },
                          p: 1
                        }}
                      />
                    }
                    label={statusOption === 'ACTIVE' ? 'Active' : 'Inactive'}
                    sx={{
                      flex: 1,
                      margin: 0,
                      height: '42px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: isSelected ? '#F86F03' : '#CBD5E1',
                      bgcolor: isSelected ? '#FFF5EB' : '#FFFFFF',
                      transition: 'all 0.15s ease-in-out',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      px: 3,
                      '&:hover': {
                        borderColor: isSelected ? '#F86F03' : '#94A3B8',
                        bgcolor: isSelected ? '#FFF5EB' : '#FAFAFA'
                      },
                      '& .MuiTypography-root': {
                        fontSize: '13px',
                        fontWeight: 600,
                        color: isSelected ? '#F86F03' : '#475569',
                        ml: 1
                      }
                    }}
                  />
                );
              })}
            </RadioGroup>
          </FormControl>
        );
      }
    }
  ];

  const initialValues = {
    name: branch?.name || '',
    code: branch?.code || '',
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
