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
  ...props
}) => {
  const hasError = !!errorText;

  const inputStyles = {
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
        '&:-webkit-autofill': {
          WebkitBoxShadow: '0 0 0 100px #FFFFFF inset !important',
          WebkitTextFillColor: '#1E293B !important',
          caretColor: '#1E293B'
        }
      }
    },
    '& .MuiFormHelperText-root': {
      mx: 1,
      mt: 0.75,
      fontSize: '11px',
      fontWeight: 500
    },
    ...sx
  };

  return (
    <FormControl fullWidth error={hasError} disabled={disabled} sx={inputStyles}>
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
      {options.length >= 10 ? (
        <SearchableSelect
          options={options.map(opt => ({ id: opt.value, name: opt.label }))}
          value={value}
          onChange={onChange}
          placeholder={placeholder || (label ? `Select ${label}` : 'Select...')}
          disabled={disabled}
          hasError={hasError}
          allowEmptyOption={allowEmptyOption}
        />
      ) : (
        <Select
          id={id}
          value={value}
          displayEmpty
          onChange={(e) => onChange?.(e.target.value)}
          error={hasError}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: 240,
              borderRadius: '10px',
              mt: 1,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)',
              border: '1px solid #E2E8F0',
              '& .MuiMenuItem-root': {
                py: 2,
                fontSize: '13px',
                fontWeight: 500
              }
            }
          }
        }}
        startAdornment={
          StartIcon ? (
            <InputAdornment position="start" sx={{ pl: 1.5, color: 'text.secondary' }}>
              <StartIcon size={16} />
            </InputAdornment>
          ) : null
        }
        sx={{
          '&.Mui-disabled': {
            bgcolor: '#F1F5F9 !important',
            opacity: '0.5 !important',
            cursor: 'not-allowed !important',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#E2E8F0 !important'
            }
          },
          '& .MuiSelect-select': {
            py: '10px !important',
            pl: StartIcon ? 1 : 3.5,
            display: 'flex',
            alignItems: 'center',
            color: value === '' ? '#64748B !important' : '#1E293B !important',
            '&.Mui-disabled': {
              color: '#64748B !important',
              WebkitTextFillColor: '#64748B !important'
            }
          },
          ...selectSx
        }}
        {...props}
      >
        <MenuItem 
          value="" 
          disabled={!allowEmptyOption} 
          sx={{ 
            color: '#64748B !important', 
            fontWeight: 500,
            '&.Mui-disabled': {
              color: '#64748B !important',
              opacity: '0.95 !important',
              WebkitTextFillColor: '#64748B !important'
            }
          }}
        >
          {placeholder || `Select ${label}`}
        </MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
      )}
      {hasError && <FormHelperText>{errorText}</FormHelperText>}
    </FormControl>
  );
};

export default SelectField;
