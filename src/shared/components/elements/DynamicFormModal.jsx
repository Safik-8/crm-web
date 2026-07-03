import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import { X } from 'lucide-react';
import DynamicFormFields from './DynamicFormFields';
import Button from './Button';

/**
 * DynamicFormModal
 * A premium, highly customizable, centered modal component.
 * Redesigned to match Stripe, HubSpot, Linear and Notion UI layout parameters.
 * Supports standard dynamic forms, custom children components, dynamic footers, and presentation modes.
 */
export const DynamicFormModal = ({
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
  size = 'sm',
  danger = false,
  showFooter = true,
  showSubmit = true,
  customFooter = null
}) => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  // Sync initial values when modal opens
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
      const val = values[field.key];
      if (field.required && (!val || (typeof val === 'string' && !val.trim()))) {
        errs[field.key] = `${field.label} is required.`;
      }
      // If field-specific validator is present
      if (field.validate && val) {
        const fieldErr = field.validate(val);
        if (fieldErr) errs[field.key] = fieldErr;
      }
    });

    // 2. Perform form-level check (if custom validate function is provided)
    if (validate) {
      const formErrs = validate(values);
      errs = { ...errs, ...formErrs };
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
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
    <Dialog
      open={isOpen}
      onClose={() => !busy && onClose()}
      fullWidth
      maxWidth={size}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '12px', // Refined enterprise border-radius
          backgroundImage: 'none',
          boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
          width: size === 'sm' ? '560px' : size === 'md' ? '760px' : 'auto',
          maxWidth: '92%',
          overflow: 'visible'
        }
      }}
    >
      <Box component={FormComponent} {...formProps} sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'visible' }}>
        {/* Header */}
        <DialogTitle sx={{ borderBottom: '1px solid #E2E8F0', py: 2.5, px: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flex: 1, minWidth: 0 }}>
              {Icon && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '6px',
                    bgcolor: danger ? 'error.lightest' : 'primary.lightest',
                    color: danger ? 'error.main' : 'primary.main',
                    flexShrink: 0
                  }}
                >
                  <Icon size={14} />
                </Box>
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color="#0F172A"
                  sx={{
                    fontFamily: '"Sora", "DM Sans", sans-serif',
                    lineHeight: 1.25,
                    fontSize: '15px',
                    letterSpacing: '-0.015em'
                  }}
                >
                  {title}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={onClose}
              disabled={busy}
              size="small"
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
        </DialogTitle>

        {/* Content */}
        <DialogContent sx={{ py: 4.5, px: 6, display: 'flex', flexDirection: 'column', gap: 3.5, overflow: 'visible' }}>
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
        </DialogContent>

        {/* Footer */}
        {showFooter && (
          <DialogActions sx={{ borderTop: '1px solid #E2E8F0', px: 6, py: 3, gap: 1.5, bgcolor: '#FAFAFA' }}>
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
                    sx={{ px: 5.5 }}
                  >
                    {busy ? 'Saving...' : submitText}
                  </Button>
                )}
              </>
            )}
          </DialogActions>
        )}
      </Box>
    </Dialog>
  );
};

export default DynamicFormModal;
