import LoginForm from '../components/LoginForm';

const LoginPage = () => {
  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-white relative overflow-hidden">
      {/* Background set to White per brand guidelines (masks the logo's background perfectly) */}

      <div className="z-10 w-full px-4 flex flex-col items-center">
        <LoginForm />

        <p className="mt-8 text-sm font-medium text-slate-500">
          New to StackCode? <a href="#" className="text-primary hover:text-primary/80 font-bold transition-colors underline decoration-primary/30 underline-offset-4">Learn more</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
