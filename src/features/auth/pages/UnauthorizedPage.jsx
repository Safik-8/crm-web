import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../shared/components/elements/Button';

/**
 * UnauthorizedPage Component
 * Renders an access denied layout for unauthorized users.
 * Refactored to use Tailwind CSS for all containers, card structures, and text styling,
 * importing the shared reusable Button component.
 */
const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-gray-50 overflow-hidden p-6">
      {/* Background Decorative Blur */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-80 h-80 bg-orange-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="z-10 p-8 sm:p-12 max-w-[480px] w-full text-center rounded-2xl border border-gray-100 shadow-[0px_8px_30px_rgba(0,0,0,0.03)] bg-white">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-500/6 text-orange-600 mb-8">
          <ShieldAlert size={44} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900 tracking-tight font-sora">
          Access Denied
        </h1>

        <p className="text-gray-500 mb-10 leading-relaxed text-[15px]">
          You do not have the required permissions to access this module. If you believe this is an error, please reach out to your system administrator.
        </p>

        <div className="flex flex-col gap-4">
          <Button
            variant="contained"
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
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
