import React, { useState } from 'react';
import { Box, InputAdornment, IconButton } from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';
import TextField from './TextField';
import SelectField from './SelectField';

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
        const value = values[key] !== undefined ? values[key] : '';

        // Custom Render Slot
        if (render) {
          return (
            <Box key={key} sx={{ width: '100%' }}>
              {render(value, onChange, values, errorText)}
            </Box>
          );
        }

        // Dropdown Select Field
        if (type === 'select') {
          return (
            <SelectField
              key={key}
              id={`select-${key}`}
              label={label}
              value={value}
              onChange={(val) => onChange(key, val)}
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
        const inputType = isPassword ? (showPassword[key] ? 'text' : 'password') : type;

        const endIcon = isPassword ? (
          <InputAdornment position="end" sx={{ pr: 0.5 }}>
            <IconButton
              onClick={() => togglePasswordVisibility(key)}
              edge="end"
              size="small"
            >
              {showPassword[key] ? <EyeOff size={16} /> : <Eye size={16} />}
            </IconButton>
          </InputAdornment>
        ) : null;

        return (
          <TextField
            key={key}
            id={`input-${key}`}
            label={label}
            type={inputType}
            placeholder={placeholder}
            value={value}
            onChange={(val) => onChange(key, val)}
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
