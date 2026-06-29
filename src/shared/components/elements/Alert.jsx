import React from 'react';
import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info 
} from 'lucide-react';

/**
 * Reusable Alert Component
 * Renders an industry-grade alert box using MUI and Lucide icons.
 */
const Alert = ({ 
  severity = 'info', 
  title, 
  children, 
  onClose, 
  action,
  sx = {} 
}) => {
  // Map severity to matching Lucide icons
  const iconMap = {
    success: <CheckCircle2 size={18} />,
    warning: <AlertTriangle size={18} />,
    error: <AlertCircle size={18} />,
    info: <Info size={18} />,
  };

  return (
    <MuiAlert
      severity={severity}
      icon={iconMap[severity]}
      onClose={onClose}
      action={action}
      sx={{
        borderRadius: '12px',
        border: '1px solid',
        fontSize: '12px',
        fontWeight: 500,
        lineHeight: 1.6,
        alignItems: 'flex-start',
        py: 1.5,
        px: 2,
        '& .MuiAlert-icon': {
          mr: 1.5,
          mt: 0.25,
          color: `${severity}.main`,
        },
        '& .MuiAlert-message': {
          padding: 0,
          width: '100%',
        },
        '& .MuiAlert-action': {
          padding: '0 0 0 8px',
          marginRight: -4,
          alignItems: 'flex-start',
        },
        ...sx,
      }}
    >
      {title && (
        <AlertTitle
          sx={{
            fontSize: '13px',
            fontWeight: 700,
            mb: 0.5,
            lineHeight: 1.3,
            color: 'inherit',
          }}
        >
          {title}
        </AlertTitle>
      )}
      <Box sx={{ color: 'inherit' }}>
        {children}
      </Box>
    </MuiAlert>
  );
};

export default Alert;
