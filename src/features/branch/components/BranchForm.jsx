import React from 'react';
import { Save, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
import { branchApi } from '../api/branchApi';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import {
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  OutlinedInput,
  FormHelperText
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

      if (response && response.success) {
        toast.success(`Branch ${isEdit ? 'updated' : 'created'} successfully`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      if (error && (error.statusCode === 409 || error.status === 409)) {
        toast.error('The provided code is already in use.');
        throw { code: 'This branch code is already active in the system.' };
      } else {
        toast.error(error?.message || 'An unexpected error occurred. Please try again.');
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
        <FormControl
          fullWidth
          error={!!errorText}
          disabled={isEdit}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              bgcolor: '#F8FAFC',
              fontSize: '13px',
              fontWeight: 500,
              color: '#1E293B',
              transition: 'all 0.15s ease-in-out',
              '& fieldset': {
                borderColor: '#E2E8F0',
                borderWidth: '1px'
              },
              '&:hover': {
                bgcolor: '#F1F5F9'
              },
              '&:hover fieldset': {
                borderColor: '#CBD5E1'
              },
              '&.Mui-focused': {
                bgcolor: '#FFFFFF',
                boxShadow: '0 0 0 3px rgba(248,111,3,0.14), 0 2px 4px rgba(0,0,0,0.02)'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#F86F03',
                borderWidth: '1px'
              },
              '& .MuiInputBase-input': {
                py: 2.5,
                px: 3.5,
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: '0.05em',
                '&::placeholder': {
                  color: '#94A3B8',
                  opacity: 0.8
                }
              }
            },
            '& .MuiFormHelperText-root': {
              mx: 1,
              mt: 0.75,
              fontSize: '11px',
              fontWeight: 500
            }
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              fontWeight: 600,
              fontSize: '12px',
              color: !!errorText ? 'error.main' : '#475569',
              mb: 1,
              ml: 0.5
            }}
          >
            Unique Branch Code {!isEdit && <span style={{ color: '#F86F03', fontWeight: 'bold', marginLeft: '2px' }}>*</span>}
          </Typography>
          <OutlinedInput
            id="branch-code"
            disabled={isEdit}
            value={value || ''}
            onChange={(e) => onChange('code', e.target.value.toUpperCase())}
            placeholder="e.g. AHM_HQ"
            error={!!errorText}
          />
          {errorText ? (
            <FormHelperText>{errorText}</FormHelperText>
          ) : (
            !isEdit && (
              <FormHelperText sx={{ color: 'text.secondary' }}>
                System-wide unique identifier. Cannot be changed later.
              </FormHelperText>
            )
          )}
        </FormControl>
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
