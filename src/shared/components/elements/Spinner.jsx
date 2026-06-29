import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

/**
 * Reusable Spinner Component
 * Wraps MUI CircularProgress with consistent sizing and alignment options.
 */
const Spinner = ({ size = 'md', color = 'primary', center = false, sx = {} }) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 40,
  };

  const resolvedSize = typeof size === 'number' ? size : sizeMap[size] || 24;

  const progress = (
    <CircularProgress
      size={resolvedSize}
      color={color}
      sx={{
        animationDuration: '750ms',
        ...sx,
      }}
    />
  );

  if (center) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          width: '100%',
        }}
      >
        {progress}
      </Box>
    );
  }

  return progress;
};

export default Spinner;
