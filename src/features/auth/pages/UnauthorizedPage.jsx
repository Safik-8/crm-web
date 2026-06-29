import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
        p: 3,
      }}
    >
      {/* Background Decorative Blur */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '20%',
            width: 320,
            height: 320,
            backgroundColor: 'rgba(248, 111, 3, 0.05)',
            borderRadius: '50%',
            filter: 'blur(80px)',
          }}
        />
      </Box>

      <Paper
        elevation={0}
        sx={{
          zIndex: 10,
          p: { xs: 4, sm: 6 },
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          borderRadius: 3,
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.03)',
          backgroundColor: 'background.paper',
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'rgba(248, 111, 3, 0.06)',
            color: 'primary.main',
            mb: 4,
          }}
        >
          <ShieldAlert size={44} />
        </Box>

        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 2,
            color: 'text.primary',
            letterSpacing: '-0.5px',
          }}
        >
          Access Denied
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            mb: 5,
            lineHeight: 1.6,
            fontSize: '15px',
          }}
        >
          You do not have the required permissions to access this module. If you believe this is an error, please reach out to your system administrator.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/')}
            sx={{
              py: 1.5,
              borderRadius: 2.5,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              },
            }}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            size="large"
            onClick={() => navigate(-1)}
            sx={{
              py: 1.5,
              borderRadius: 2.5,
              fontWeight: 600,
              textTransform: 'none',
              borderColor: 'rgba(0, 0, 0, 0.1)',
            }}
          >
            Go Back
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default UnauthorizedPage;
