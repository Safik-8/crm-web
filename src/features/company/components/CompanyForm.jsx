import React from 'react';
import { Save, Building } from 'lucide-react';
import { companyApi } from '../api/companyApi';
import { toast, enhancedToast } from '../../../shared/utils/toast';
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
        <TextField
          id="company-code"
          label="Unique Entity Code"
          disabled={isEdit}
          value={value || ''}
          onChange={(val) => onChange('code', val.toUpperCase())}
          placeholder="e.g. STKDT_LLC"
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
