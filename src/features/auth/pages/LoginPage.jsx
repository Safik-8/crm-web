import LoginForm from '../components/LoginForm';

const LoginPage = () => {
  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-zinc-50 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-50/60 rounded-full blur-3xl" />
      </div>

      <div className="z-10 w-full px-4 flex flex-col items-center">
        <LoginForm />

        <p className="mt-6 text-[13px] font-medium text-zinc-500">
          New to StackCode?{' '}
          <a href="#" className="text-primary hover:text-primary/80 font-semibold transition-colors underline decoration-primary/30 underline-offset-4">
            Learn more
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
