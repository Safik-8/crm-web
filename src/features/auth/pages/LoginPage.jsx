import LoginForm from '../components/LoginForm';

const LoginPage = () => {
  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 blur-3xl -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 blur-3xl translate-x-1/2 translate-y-1/2 rounded-full"></div>

      <div className="z-10 w-full px-4 flex flex-col items-center">
        {/* Logo/Brand again for the login page specifically */}
        <div className="mb-8 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-white font-black text-xl italic uppercase tracking-tighter">S</span>
          </div>
          <span className="text-2xl font-black text-slate-800 tracking-tightest uppercase italic font-heading">STACKDOT</span>
        </div>

        <LoginForm />

        <p className="mt-8 text-sm font-medium text-slate-500">
          New to StackDot? <a href="#" className="text-primary hover:text-primary/80 font-bold transition-colors underline decoration-primary/30 underline-offset-4">Create an account</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
