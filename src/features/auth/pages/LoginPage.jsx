import LoginForm from '../components/LoginForm';

const LoginPage = () => {
  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-gray-50 overflow-hidden">
      {/* Subtle background blurs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-100/40 rounded-full blur-[64px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-50/60 rounded-full blur-[64px]" />
      </div>

      <div className="z-10 w-full px-4 flex flex-col items-center">
        <LoginForm />

        <p className="mt-6 text-[13px] font-medium text-gray-500">
          New to StackCode?{' '}
          <a
            href="#"
            className="text-orange-600 font-semibold underline underline-offset-4 decoration-orange-600/30 hover:text-orange-700 hover:decoration-orange-700 transition-all duration-150"
          >
            Learn more
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

