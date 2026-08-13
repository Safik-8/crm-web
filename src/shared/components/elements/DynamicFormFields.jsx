import React, { useState } from 'react';
import { Box, InputAdornment, IconButton, Typography } from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';
import TextField from './TextField';
import SelectField from './SelectField';
import { SearchableSelect } from './SearchableSelect';

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
        const fieldKey = field.key || field.name || field.id;
        const {
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
        const errorText = errors[fieldKey];
        const value = values[fieldKey] !== undefined ? values[fieldKey] : '';

        // Custom Render Slot
        if (render) {
          return (
            <Box key={fieldKey} sx={{ width: '100%' }}>
              {render(value, onChange, values, errorText)}
            </Box>
          );
        }

        // Searchable Autocomplete Select Field
        if (type === 'searchable-select') {
          return (
            <Box key={fieldKey} sx={{ width: '100%' }}>
              {label && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mb: 0.8,
                    fontWeight: 600,
                    color: '#334155',
                    fontSize: '12px',
                  }}
                >
                  {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
                </Typography>
              )}
              <SearchableSelect
                options={options.map((opt) => ({
                  id: opt.value,
                  name: opt.label,
                }))}
                value={value}
                onChange={(val) =>
                  field.onCustomChange ? field.onCustomChange(val, onChange) : onChange(fieldKey, val)
                }
                placeholder={placeholder}
                disabled={isFieldDisabled}
                hasError={!!errorText}
                searchable={true}
              />
              {errorText && (
                <Typography
                  variant="caption"
                  sx={{ color: '#EF4444', fontSize: '11px', mt: 0.5, display: 'block' }}
                >
                  {errorText}
                </Typography>
              )}
            </Box>
          );
        }

        // Dropdown Select Field
        if (type === 'select') {
          return (
            <SelectField
              key={fieldKey}
              id={`select-${fieldKey}`}
              label={label}
              value={value}
              onChange={(val) => onChange(fieldKey, val)}
              options={options}
              placeholder={placeholder}
              errorText={errorText}
              disabled={isFieldDisabled}
              required={required}
              startIcon={Icon}
            />
          );
        }

        // Standard Text/Numeric/Date/Password Fields
        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword[fieldKey] ? 'text' : 'password') : type;

        const endIcon = isPassword ? (
          <InputAdornment position="end" sx={{ pr: 0.5 }}>
            <IconButton
              onClick={() => togglePasswordVisibility(fieldKey)}
              edge="end"
              size="small"
            >
              {showPassword[fieldKey] ? <EyeOff size={16} /> : <Eye size={16} />}
            </IconButton>
          </InputAdornment>
        ) : null;

        return (
          <TextField
            key={fieldKey}
            id={`input-${fieldKey}`}
            label={label}
            type={inputType}
            placeholder={placeholder}
            value={value}
            onChange={(val) => onChange(fieldKey, val)}
            disabled={isFieldDisabled}
            errorText={errorText}
            required={required}
            startIcon={Icon}
            endIcon={endIcon}
          />
        );
      })}
    </Box>
  );
};

export default DynamicFormFields;
