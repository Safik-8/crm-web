import React, { useState, useEffect } from 'react';
import {
  Drawer,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import { X } from 'lucide-react';
import DynamicFormFields from './DynamicFormFields';
import Button from './Button';

/**
 * DynamicFormSlideover
 * A premium, enterprise SaaS sliding drawer form container.
 * Redesigned to match Salesforce, Stripe, HubSpot and Linear UI.
 * Supports standard dynamic forms, custom children components, dynamic footers, and presentation modes.
 */
export const DynamicFormSlideover = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  fields = [],
  initialValues = {},
  onSubmit,
  submitText = 'Submit',
  submitIcon: SubmitIcon,
  cancelText = 'Cancel',
  validate,
  isLoading = false,
  children,
  danger = false,
  showFooter = true,
  showSubmit = true,
  customFooter = null,
  width = { xs: '100%', sm: 480, md: 540 }
}) => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  // Sync initial values when drawer opens
  useEffect(() => {
    if (isOpen) {
      setValues(initialValues);
      setErrors({});
      setBusy(false);
    }
  }, [isOpen]);

  const handleFieldChange = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const handleFormValidate = () => {
    let errs = {};

    // 1. Perform field-level check (basic required check)
    fields.forEach((field) => {
      const fieldKey = field.key || field.name || field.id;
      const val = values[fieldKey];
      if (field.required && (val === undefined || val === null || (typeof val === 'string' && !val.trim()))) {
        errs[fieldKey] = `${field.label} is required.`;
      }
      // If field-specific validator is present
      if (field.validate && val !== undefined && val !== null && val !== '') {
        const fieldErr = field.validate(val);
        if (fieldErr) errs[fieldKey] = fieldErr;
      }
    });

    // 2. Perform form-level check (if custom validate function is provided)
    if (validate) {
      const formErrs = validate(values);
      errs = { ...errs, ...formErrs };
    }

    const errorKeys = Object.keys(errs);
    if (errorKeys.length > 0) {
      // ONLY SHOW THE FIRST ERROR
      const firstKey = errorKeys[0];
      setErrors({ [firstKey]: errs[firstKey] });

      // Auto-scroll & focus first invalid input
      setTimeout(() => {
        const firstErrorEl = document.querySelector('.Mui-error, [aria-invalid="true"]');
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const inputEl = firstErrorEl.querySelector('input, select, textarea') || firstErrorEl;
          if (inputEl.focus) inputEl.focus();
        }
      }, 100);

      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!handleFormValidate()) return;

    setBusy(true);
    try {
      await onSubmit(values);
    } catch (err) {
      console.error('Submission failed:', err);
      if (typeof err === 'object' && err !== null) {
        setErrors((prev) => ({ ...prev, ...err }));
      }
    } finally {
      setBusy(false);
    }
  };

  // Determine container element based on whether a form submission handler is present
  const FormComponent = onSubmit ? 'form' : Box;
  const formProps = onSubmit ? { onSubmit: handleSubmit, noValidate: true } : {};

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={() => !busy && onClose()}
      ModalProps={{
        slotProps: {
          backdrop: {
            sx: {
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(15, 23, 42, 0.18)',
            }
          }
        }
      }}
      sx={{
        zIndex: 1300,
        '& .MuiDrawer-paper': {
          width: width,
          maxWidth: '100vw',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          borderRadius: '0px !important',
          boxShadow: '-8px 0 24px rgba(15, 23, 42, 0.06)',
          borderLeft: '1px solid #E2E8F0'
        }
      }}
    >
      <Box component={FormComponent} {...formProps} sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#FFFFFF' }}>
        {/* Header */}
        <Box
          sx={{
            px: 6,
            py: 2.5,
            borderBottom: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flex: 1, minWidth: 0 }}>
            {Icon && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 30,
                  height: 30,
                  borderRadius: '7px',
                  bgcolor: 'primary.lightest',
                  color: 'primary.main',
                  flexShrink: 0
                }}
              >
                <Icon size={14} />
              </Box>
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                color="#0F172A"
                sx={{
                  fontFamily: '"Sora", "DM Sans", sans-serif',
                  lineHeight: 1.25,
                  letterSpacing: '-0.015em',
                  fontSize: '16px'
                }}
              >
                {title}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            disabled={busy}
            sx={{
              color: '#64748B',
              bgcolor: 'transparent',
              borderRadius: '8px',
              width: 32,
              height: 32,
              transition: 'all 0.15s',
              '&:hover': { bgcolor: '#F1F5F9', color: '#0F172A' },
              flexShrink: 0
            }}
          >
            <X size={16} />
          </IconButton>
        </Box>

        {/* Scrollable Content Body */}
        <Box
          className="custom-scrollbar"
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 6,
            py: 5,
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          {fields.length > 0 && (
            <DynamicFormFields
              fields={fields}
              values={values}
              onChange={handleFieldChange}
              errors={errors}
              disabled={busy || isLoading}
            />
          )}
          {children && <Box sx={{ mt: fields.length > 0 ? 2 : 0 }}>{children}</Box>}
        </Box>

        {/* Footer Actions (Enterprise SaaS layout: Horizontal, Aligned Right) */}
        {showFooter && (
          <Box
            sx={{
              px: 6,
              py: 3.5,
              borderTop: '1px solid #E2E8F0',
              bgcolor: '#FAFAFA', // Soft light footer background
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 2.5,
              flexShrink: 0,
              position: 'sticky',
              bottom: 0,
              zIndex: 10
            }}
          >
            {customFooter ? (
              customFooter
            ) : (
              <>
                <Button
                  onClick={onClose}
                  disabled={busy}
                  variant="text"
                  color="inherit"
                  sx={{
                    color: '#475569',
                    px: 4.5,
                    '&:hover': {
                      color: '#0F172A',
                    }
                  }}
                >
                  {cancelText}
                </Button>

                {onSubmit && showSubmit && (
                  <Button
                    type="submit"
                    isLoading={busy || isLoading}
                    variant="contained"
                    color={danger ? 'error' : 'primary'}
                    danger={danger}
                    startIcon={SubmitIcon ? <SubmitIcon size={14} /> : null}
                    sx={{ px: 6 }}
                  >
                    {busy ? 'Saving...' : submitText}
                  </Button>
                )}
              </>
            )}
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default DynamicFormSlideover;
