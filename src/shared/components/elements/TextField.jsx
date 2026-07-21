import React from 'react';
import {
  FormControl,
  OutlinedInput,
  FormHelperText,
  Typography,
  InputAdornment
} from '@mui/material';

/**
 * Reusable TextField Component
 * Follows stripe/linear input styling parameters: 44-46px height, Slate-50 bg, orange focus ring.
 */
const TextField = ({
  id,
  label,
  value = '',
  onChange,
  type = 'text',
  placeholder,
  errorText,
  disabled = false,
  required = false,
  startIcon: StartIcon,
  endIcon,
  sx = {},
  inputSx = {},
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
        py: 2.5,
        px: 3.5,
        '&::placeholder': {
          color: '#94A3B8',
          opacity: 0.8
        },
        '&:-webkit-autofill': {
          WebkitBoxShadow: '0 0 0 100px #FFFFFF inset !important',
          WebkitTextFillColor: '#1E293B !important',
          caretColor: '#1E293B'
        },
        '&::-ms-reveal': {
          display: 'none'
        },
        '&::-ms-clear': {
          display: 'none'
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
      <OutlinedInput
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          let val = e.target.value;
          const isMobileField =
            (id && id.toLowerCase().includes('mobile')) ||
            (label && label.toLowerCase().includes('mobile')) ||
            type === 'tel';

          if (isMobileField) {
            val = val.replace(/\D/g, '');
            if (val.length > 10) {
              val = val.substring(0, 10);
            }
          }
          onChange?.(val);
        }}
        error={hasError}
        startAdornment={
          StartIcon ? (
            <InputAdornment position="start" sx={{ pl: 1.5, color: 'text.secondary' }}>
              <StartIcon size={16} />
            </InputAdornment>
          ) : null
        }
        endAdornment={endIcon}
        sx={inputSx}
        {...props}
      />
      {hasError ? (
        <FormHelperText>{errorText}</FormHelperText>
      ) : (
        props.helperText && <FormHelperText sx={{ color: 'text.secondary' }}>{props.helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

export default TextField;
