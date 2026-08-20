import React from 'react';
import { FormControlLabel, Checkbox as MuiCheckbox, FormHelperText, FormControl } from '@mui/material';

/**
 * Reusable Checkbox Component
 * Blends Material-UI's checkbox component with custom theme colors and slate typography.
 * Follows the project's brand design system (orange primary color, slate labels, standard error helpers).
 */
const Checkbox = ({
  id,
  label,
  checked = false,
  onChange,
  disabled = false,
  errorText,
  color = 'primary',
  sx = {},
  ...props
}) => {
  const hasError = !!errorText;

  return (
    <FormControl error={hasError} disabled={disabled} sx={{ width: '100%', ...sx }}>
      <FormControlLabel
        control={
          <MuiCheckbox
            id={id}
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
            disabled={disabled}
            color={color}
            sx={{
              color: hasError ? '#EF4444' : '#CBD5E1',
              '&.Mui-checked': {
                color: '#F86F03',
              },
              '&:hover': {
                backgroundColor: 'rgba(248, 111, 3, 0.04)',
              },
              p: 1.5,
              borderRadius: '8px',
            }}
            {...props}
          />
        }
        label={
          <span className={`text-[13px] font-bold select-none leading-none ${
            disabled ? 'text-slate-400' : hasError ? 'text-rose-600' : 'text-slate-700'
          }`}>
            {label}
          </span>
        }
        sx={{
          margin: 0,
          gap: 1,
          alignItems: 'center',
          '& .MuiFormControlLabel-label': {
            display: 'flex',
            alignItems: 'center',
          }
        }}
      />
      {hasError && (
        <FormHelperText sx={{ ml: 9, mt: 0.5, fontSize: '11px', fontWeight: 500 }}>
          {errorText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default Checkbox;
