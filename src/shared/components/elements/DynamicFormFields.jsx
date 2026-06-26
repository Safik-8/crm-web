import React, { useState } from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  IconButton,
  Typography,
  Box,
  OutlinedInput
} from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';

/**
 * DynamicFormFields
 * High-end SaaS-level dynamic fields renderer using MUI.
 * Matches Stripe, HubSpot, and Linear layout controls.
 */
export const DynamicFormFields = ({ fields = [], values = {}, onChange, errors = {}, disabled = false }) => {
  const [showPassword, setShowPassword] = useState({});

  const togglePasswordVisibility = (key) => {
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {fields.map((field) => {
        const {
          key,
          label,
          type = 'text',
          placeholder,
          icon: Icon,
          options = [],
          required = false,
          disabled: fieldDisabled = false,
          render
        } = field;

        const isFieldDisabled = disabled || fieldDisabled;
        const errorText = errors[key];
        const hasError = !!errorText;
        const value = values[key] !== undefined ? values[key] : '';

        // Custom Render Slot
        if (render) {
          return (
            <Box key={key} sx={{ width: '100%' }}>
              {render(value, onChange, values, errorText)}
            </Box>
          );
        }

        // Shared input styles (SaaS-level input fields: 44-48px height, 10px border-radius)
        const inputStyles = {
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            bgcolor: '#F8FAFC', // Soft contrast background (Slate-50 / Zinc-50)
            fontSize: '13px',
            fontWeight: 500,
            color: '#1E293B', // Slate-800
            transition: 'all 0.15s ease-in-out',
            '& fieldset': {
              borderColor: '#E2E8F0', // Soft border (Slate-200)
              borderWidth: '1px'
            },
            '&:hover': {
              bgcolor: '#F1F5F9' // Subtle background darkening on hover
            },
            '&:hover fieldset': {
              borderColor: '#CBD5E1' // Slate-300
            },
            '&.Mui-focused': {
              bgcolor: '#FFFFFF', // Transitions to pure white on focus
              boxShadow: '0 0 0 3px rgba(248,111,3,0.14), 0 2px 4px rgba(0,0,0,0.02)' // Clean focus ring + soft drop shadow
            },
            '&.Mui-focused fieldset': {
              borderColor: '#F86F03',
              borderWidth: '1px'
            },
            '& .MuiInputBase-input': {
              py: 2.5, // Matches exactly 44-46px height
              px: 3.5,
              '&::placeholder': {
                color: '#94A3B8', // Slate-400 placeholder
                opacity: 0.8
              },
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
          }
        };

        const labelElement = (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              fontWeight: 600,
              fontSize: '12px',
              color: hasError ? 'error.main' : '#475569', // Slate-600
              mb: 1,
              ml: 0.5
            }}
          >
            {label} {required && <span style={{ color: '#F86F03', fontWeight: 'bold', marginLeft: '2px' }}>*</span>}
          </Typography>
        );

        // Dropdown Select Field
        if (type === 'select') {
          return (
            <FormControl
              key={key}
              fullWidth
              error={hasError}
              disabled={isFieldDisabled}
              sx={inputStyles}
            >
              {labelElement}
              <Select
                id={`select-${key}`}
                value={value}
                displayEmpty
                onChange={(e) => onChange(key, e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 240, // Limits height and triggers scrollbar for dropdown choices
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
                  Icon ? (
                    <InputAdornment position="start" sx={{ pl: 1.5, color: 'text.secondary' }}>
                      <Icon size={16} />
                    </InputAdornment>
                  ) : null
                }
                sx={{
                  '& .MuiSelect-select': {
                    py: '10px !important', // matches standard text field input height
                    pl: Icon ? 1 : 3.5,
                    display: 'flex',
                    alignItems: 'center',
                    color: value === '' ? '#64748B !important' : '#1E293B !important',
                    '&.Mui-disabled': {
                      color: '#64748B !important',
                      WebkitTextFillColor: '#64748B !important'
                    }
                  }
                }}
              >
                <MenuItem 
                  value="" 
                  disabled 
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
              {hasError && <FormHelperText>{errorText}</FormHelperText>}
            </FormControl>
          );
        }

        // Standard Text/Numeric/Date/Password Fields
        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword[key] ? 'text' : 'password') : type;
        const isDate = type === 'date';

        return (
          <FormControl key={key} fullWidth error={hasError} sx={inputStyles}>
            {labelElement}
            <OutlinedInput
              id={`input-${key}`}
              type={inputType}
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(key, e.target.value)}
              disabled={isFieldDisabled}
              error={hasError}
              startAdornment={
                Icon ? (
                  <InputAdornment position="start" sx={{ pl: 1.5, color: 'text.secondary' }}>
                    <Icon size={16} />
                  </InputAdornment>
                ) : null
              }
              endAdornment={
                isPassword ? (
                  <InputAdornment position="end" sx={{ pr: 0.5 }}>
                    <IconButton
                      onClick={() => togglePasswordVisibility(key)}
                      edge="end"
                      size="small"
                    >
                      {showPassword[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </InputAdornment>
                ) : null
              }
            />
            {hasError && <FormHelperText>{errorText}</FormHelperText>}
          </FormControl>
        );
      })}
    </Box>
  );
};

export default DynamicFormFields;
