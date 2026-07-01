// src/features/company/components/CompanyForm.jsx

import React from 'react';
import { Save, Building, User, Briefcase } from 'lucide-react';
import { useCreateCompany, useUpdateCompany } from '../hooks/useCompanies';
import { toast, enhancedToast } from '../../../shared/utils/toast';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import TextField from '../../../shared/components/elements/TextField';
import {
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  Button as MuiButton,
} from '@mui/material';

/**
 * CompanyForm Component
 * Slide-over drawer form to onboard/edit companies and automatically register a Company Admin.
 */
const CompanyForm = ({ isOpen, onClose, company, onSuccess }) => {
  const isEdit = !!company;
  const createCompanyMutation = useCreateCompany();
  const updateCompanyMutation = useUpdateCompany();

  const handleSubmit = async (values) => {
    const loadingToastId = enhancedToast.saveProgress('Company');
    try {
      if (isEdit) {
        // Edit company details (code and admin details are locked)
        await updateCompanyMutation.mutateAsync({
          id: company.id,
          data: {
            name: values.name,
            logo: values.logo,
            industry: values.industry,
            website: values.website,
            address: values.address,
            status: values.status
          }
        });
      } else {
        // Onboard new company along with its primary Admin
        await createCompanyMutation.mutateAsync(values);
      }

      toast.dismiss(loadingToastId);
      enhancedToast.operationSuccess(
        isEdit ? 'Updated' : 'Created', 
        'Company'
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.dismiss(loadingToastId);
      
      // Centralized error toast formatting
      if (error && error.statusCode === 409) {
        if (error.code === 'adminEmail') {
          toast.error('Admin Email Already Registered', {
            description: 'The email provided for the company admin is already in use.',
          });
          throw { adminEmail: 'A user with this email address already exists.' };
        } else {
          toast.error('Code Already Exists', {
            description: 'The company code provided is already assigned to another tenant.',
          });
          throw { code: 'This company code is already active in the system.' };
        }
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

  // ── Construct Form Fields dynamically ────────────────────────────────────
  const fields = [
    // ═════ SECTION 1: BASIC DETAILS ═════
    {
      key: 'basic_header',
      render: () => (
        <Box sx={{ mb: 2, mt: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 800,
              color: '#475569',
              textTransform: 'uppercase',
              fontSize: '11px',
              letterSpacing: '0.1em',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              borderBottom: '1px solid #f1f5f9',
              pb: 1
            }}
          >
            <Building size={14} /> Basic Details
          </Typography>
        </Box>
      )
    },
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
      key: 'logo',
      label: 'Logo Image',
      render: (value, onChange, formValues, errorText) => {
        const handleFileChange = (e) => {
          const file = e.target.files[0];
          if (!file) return;

          // Validate file type
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
          if (!allowedTypes.includes(file.type)) {
            toast.error('Only JPG, JPEG, and PNG images are allowed.');
            return;
          }

          // Validate file size (under 2MB to keep Base64 payload size optimized)
          if (file.size > 2 * 1024 * 1024) {
            toast.error('Image size must be under 2MB.');
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            onChange('logo', reader.result); // Base64 string representation
          };
          reader.readAsDataURL(file);
        };

        const handleRemove = () => {
          onChange('logo', '');
        };

        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontWeight: 600,
                fontSize: '12px',
                color: '#475569',
                mb: 0.5,
                ml: 0.5
              }}
            >
              Company Logo
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {value ? (
                <Box sx={{ position: 'relative', width: 56, height: 56 }}>
                  <img
                    src={value}
                    alt="Logo preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', border: '1px solid #cbd5e1' }}
                  />
                  <button
                    type="button"
                    onClick={handleRemove}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      fontSize: 10,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Remove logo"
                  >
                    ✕
                  </button>
                </Box>
              ) : (
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '12px',
                    border: '2px dashed #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    bgcolor: '#f8fafc'
                  }}
                >
                  <Building size={20} />
                </Box>
              )}
              <Box>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleFileChange}
                  id="logo-file-input"
                  style={{ display: 'none' }}
                />
                <label htmlFor="logo-file-input">
                  <MuiButton
                    variant="outlined"
                    component="span"
                    sx={{
                      textTransform: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '12px',
                      borderColor: '#cbd5e1',
                      color: '#475569',
                      bgcolor: '#ffffff',
                      py: 0.5,
                      px: 1.5,
                      '&:hover': {
                        borderColor: '#94a3b8',
                        bgcolor: '#f8fafc'
                      }
                    }}
                  >
                    {value ? 'Change Image' : 'Upload Image'}
                  </MuiButton>
                </label>
                <Typography variant="caption" display="block" sx={{ mt: 0.5, color: '#94a3b8', fontSize: '10px' }}>
                  Max size: 2MB. JPG, JPEG, PNG only.
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      }
    },

    // ═════ SECTION 2: BUSINESS DETAILS ═════
    {
      key: 'business_header',
      render: () => (
        <Box sx={{ mb: 2, mt: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 800,
              color: '#475569',
              textTransform: 'uppercase',
              fontSize: '11px',
              letterSpacing: '0.1em',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              borderBottom: '1px solid #f1f5f9',
              pb: 1
            }}
          >
            <Briefcase size={14} /> Business Details
          </Typography>
        </Box>
      )
    },
    {
      key: 'industry',
      label: 'Industry Sector',
      type: 'text',
      placeholder: 'e.g. Education, Tech, Finance...',
      required: false
    },
    {
      key: 'website',
      label: 'Corporate Website',
      type: 'text',
      placeholder: 'e.g. https://stackdot.co',
      required: false
    },
    {
      key: 'address',
      label: 'HQ Street Address',
      type: 'text',
      placeholder: 'Enter physical headquarters address...',
      required: false
    },

    // ═════ SECTION 3: COMPANY ADMIN (ONLY SHOWN FOR CREATE) ═════
    ...(!isEdit ? [
      {
        key: 'admin_header',
        render: () => (
          <Box sx={{ mb: 2, mt: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                color: '#475569',
                textTransform: 'uppercase',
                fontSize: '11px',
                letterSpacing: '0.1em',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderBottom: '1px solid #f1f5f9',
                pb: 1
              }}
            >
              <User size={14} /> Primary Company Admin
            </Typography>
          </Box>
        )
      },
      {
        key: 'adminName',
        label: 'Admin Full Name',
        type: 'text',
        placeholder: 'Enter admin first and last name...',
        required: true
      },
      {
        key: 'adminEmail',
        label: 'Admin Email Address',
        type: 'text',
        placeholder: 'admin@company.com',
        required: true
      },
      {
        key: 'adminPassword',
        label: 'Admin Password',
        type: 'password',
        placeholder: 'Minimum 6 characters...',
        required: true
      }
    ] : []),

    // ═════ SECTION 4: STATUS (RADIO TOGGLES) ═════
    {
      key: 'status_header',
      render: () => (
        <Box sx={{ mb: 1, mt: 3 }} />
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
    logo: company?.logo || '',
    industry: company?.industry || '',
    website: company?.website || '',
    address: company?.address || '',
    status: company?.status || 'ACTIVE',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
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
