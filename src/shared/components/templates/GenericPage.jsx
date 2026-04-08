

const GenericPage = ({ title, description, icon: Icon, children }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="bg-primary/10 p-3 rounded-xl text-primary">
          <Icon size={32} strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-slate-500 font-medium">{description}</p>
        </div>
      </div>
      
      <div className="grid gap-6">
        {children || (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
               <Icon size={40} />
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-semibold text-slate-800">Welcome to {title}</h3>
              <p className="text-slate-500 text-sm mt-1">
                This module is currently being finalized. You have permission to view this page based on your role.
              </p>
            </div>
            <button className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
              Refresh Module
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenericPage;
