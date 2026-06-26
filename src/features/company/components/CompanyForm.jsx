import React from 'react';
import { Save, Building } from 'lucide-react';
import { companyApi } from '../api/companyApi';
import { toast, enhancedToast } from '../../../shared/utils/toast';
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
 * CompanyForm Component
 * Slide-over drawer form to onboard/edit companies.
 * Powered by reusable DynamicFormSlideover and styled with Material UI.
 */
const CompanyForm = ({ isOpen, onClose, company, onSuccess }) => {
  const isEdit = !!company;

  const handleSubmit = async (values) => {
    try {
      let response;
      const loadingToastId = enhancedToast.saveProgress('Company');
      
      if (isEdit) {
        response = await companyApi.updateCompany(company.id, {
          name: values.name,
          status: values.status
        });
      } else {
        response = await companyApi.createCompany(values);
      }

      toast.dismiss(loadingToastId);

      if (response && response.success) {
        enhancedToast.operationSuccess(
          isEdit ? 'Updated' : 'Created', 
          'Company'
        );
        onSuccess?.();
        onClose();
      } else {
        enhancedToast.operationError(
          isEdit ? 'update' : 'create',
          'company',
          response?.message
        );
      }
    } catch (error) {
      if (error && error.statusCode === 409) {
        toast.error('Code Already Exists', {
          description: 'The provided company code is already in use by another company.',
        });
        throw { code: 'This company code is already active in the system.' };
      } else if (error && error.statusCode >= 500) {
        enhancedToast.networkError();
        throw error;
      } else {
        enhancedToast.operationError(
          isEdit ? 'update' : 'create',
          'company',
          error?.message
        );
        throw error;
      }
    }
  };

  const fields = [
    {
      key: 'name',
      label: 'Company Name',
      type: 'text',
      placeholder: 'Enter legal company name...',
      required: true
    },
    {
      key: 'code',
      label: 'Unique Entity Code',
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
            Unique Entity Code {!isEdit && <span style={{ color: '#F86F03', fontWeight: 'bold', marginLeft: '2px' }}>*</span>}
          </Typography>
          <OutlinedInput
            id="company-code"
            disabled={isEdit}
            value={value || ''}
            onChange={(e) => onChange('code', e.target.value.toUpperCase())}
            placeholder="e.g. STKDT_LLC"
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
    name: company?.name || '',
    code: company?.code || '',
    status: company?.status || 'ACTIVE'
  };

  return (
    <DynamicFormSlideover
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Refine Entity Details' : 'Register New Company'}
      subtitle={isEdit ? 'Updating global identity for an existing entity' : 'Onboard a new organization to the CRM cloud foundation'}
      icon={Building}
      fields={fields}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      submitText={isEdit ? 'Commit Changes' : 'Initialize Enterprise'}
      submitIcon={Save}
    />
  );
};

export default CompanyForm;
