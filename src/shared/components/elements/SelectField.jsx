import React from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  InputAdornment
} from '@mui/material';
import { SearchableSelect } from './SearchableSelect';

/**
 * Reusable SelectField Component
 * Custom dropdown select component configured with Slate-50 styling and custom menus.
 */
const SelectField = ({
  id,
  label,
  value = '',
  onChange,
  options = [],
  placeholder,
  errorText,
  disabled = false,
  required = false,
  allowEmptyOption = false,
  startIcon: StartIcon,
  sx = {},
  selectSx = {},
  searchable = null,
  isLoading = false,
  ...props
}) => {
  const hasError = !!errorText;

  const formattedOptions = options.map((opt) => {
    if (opt.id !== undefined && opt.name !== undefined) {
      return opt;
    }
    return {
      id: opt.value !== undefined ? String(opt.value) : '',
      name: opt.label !== undefined ? opt.label : ''
    };
  });

  const inputStyles = {
    ...sx
  };

  return (
    <FormControl fullWidth error={hasError} disabled={disabled || isLoading} sx={inputStyles}>
      {label && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontWeight: 600,
            fontSize: '12px',
            color: hasError ? 'error.main' : '#475569',
            mb: 1,
            ml: 0.5
          }}
        >
          {label} {required && <span style={{ color: '#F86F03', fontWeight: 'bold', marginLeft: '2px' }}>*</span>}
        </Typography>
      )}
      <SearchableSelect
        options={formattedOptions}
        value={value}
        onChange={onChange}
        placeholder={placeholder || (label ? `Select ${label}` : 'Select...')}
        disabled={disabled || isLoading}
        hasError={hasError}
        allowEmptyOption={allowEmptyOption}
        searchable={searchable !== null ? searchable : options.length >= 10}
        isLoading={isLoading}
      />
      {hasError && <FormHelperText>{errorText}</FormHelperText>}
    </FormControl>
  );
};

export default SelectField;
