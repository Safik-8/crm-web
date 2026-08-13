import React from 'react';
import MuiButton from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

/**
 * Reusable Button Component
 * Extends MUI Button with built-in loading spinner, click animation shifts, and danger states.
 */
const Button = ({
  children,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  startIcon,
  danger = false,
  sx = {},
  ...props
}) => {
  const isButtonDisabled = disabled || isLoading;

  // Render Spinner as startIcon if isLoading is true
  const resolvedStartIcon = isLoading ? (
    <CircularProgress size={14} color="inherit" />
  ) : (
    startIcon
  );

  const sizeStyles = {
    small: {
      height: '32px',
      fontSize: '12px',
      padding: '5px 14px',
      borderRadius: '8px',
    },
    medium: {
      height: '42px',
      fontSize: '13px',
      padding: '8px 20px',
      borderRadius: '10px',
    },
    large: {
      height: '48px',
      fontSize: '15px',
      padding: '11px 28px',
      borderRadius: '12px',
    },
  }[size] || {
    height: '42px',
    fontSize: '13px',
    padding: '8px 20px',
    borderRadius: '10px',
  };

  return (
    <MuiButton
      variant={variant}
      color={danger ? 'error' : color}
      disabled={isButtonDisabled}
      startIcon={resolvedStartIcon}
      size={size}
      sx={{
        textTransform: 'none',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        transition: 'all 0.15s ease-in-out',
        '&:active': {
          transform: 'translateY(0)',
        },
        ...sizeStyles,
        // Premium hover elevation for contained actions
        ...(variant === 'contained' && !isButtonDisabled
          ? {
              boxShadow: danger 
                ? '0 4px 10px rgba(239, 68, 68, 0.12)' 
                : '0 4px 10px rgba(248, 111, 3, 0.15)',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: danger 
                  ? '0 6px 14px rgba(239, 68, 68, 0.2)' 
                  : '0 6px 14px rgba(248, 111, 3, 0.22)',
                ...(danger ? { backgroundColor: '#DC2626' } : {}),
              },
            }
          : {}),
        // Additional danger variant styling overrides if text/outlined
        ...(danger && variant !== 'contained'
          ? {
              color: '#EF4444',
              borderColor: '#FCA5A5',
              '&:hover': {
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.04)',
              },
            }
          : {}),
        ...sx,
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

export default Button;
