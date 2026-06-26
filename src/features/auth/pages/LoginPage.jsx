import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import LoginForm from '../components/LoginForm';

const LoginPage = () => {
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
      }}
    >
      {/* Subtle background pattern */}
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
            top: 0,
            left: '25%',
            width: 384, // 96 units * 4
            height: 384,
            backgroundColor: 'rgba(255, 228, 196, 0.4)', // Peach / orange[100] with opacity
            borderRadius: '50%',
            filter: 'blur(64px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: '25%',
            width: 320, // 80 units * 4
            height: 320,
            backgroundColor: 'rgba(255, 245, 235, 0.6)', // Brand warmWhite / orange[50] with opacity
            borderRadius: '50%',
            filter: 'blur(64px)',
          }}
        />
      </Box>

      <Box
        sx={{
          zIndex: 10,
          width: '100%',
          px: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <LoginForm />

        <Typography
          variant="body2"
          sx={{
            mt: 6,
            fontWeight: 500,
            color: 'text.secondary',
            fontSize: '13px',
          }}
        >
          New to StackCode?{' '}
          <Link
            href="#"
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              textDecoration: 'underline',
              textDecorationColor: 'rgba(248, 111, 3, 0.3)',
              textUnderlineOffset: '4px',
              transition: 'all 0.15s ease-in-out',
              '&:hover': {
                color: 'primary.dark',
                textDecorationColor: 'primary.dark',
              },
            }}
          >
            Learn more
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;

