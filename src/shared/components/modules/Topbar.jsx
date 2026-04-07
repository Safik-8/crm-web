import { Search, Bell, Menu, User, LogOut } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider.jsx';

const Topbar = ({ toggleSidebar, pageTitle }) => {
  const { logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md">
      {/* Left section: Toggle & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-lg font-semibold text-slate-800 capitalize tracking-tight">
          {pageTitle || "Overview"}
        </h2>
      </div>

      {/* Right section: Search, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search placeholder */}
        <div className="hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="h-10 w-64 rounded-full bg-slate-100 pl-10 pr-4 text-sm outline-none transition-all focus:bg-white focus:ring-1 focus:ring-blue-500/20 lg:w-80"
            />
          </div>
        </div>

        {/* Notifications */}
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-white"></span>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-2">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold text-slate-800 font-heading leading-tight">{user?.name || 'Jane Smith'}</p>
            <p className="text-xs font-medium text-slate-500">{user?.role || 'Sales Administrator'}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm transition-transform hover:scale-105 cursor-pointer">
            <User size={20} />
          </div>
          
          <button 
            onClick={logout}
            className="ml-2 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all group"
            title="Log out"
          >
            <LogOut size={20} className="group-active:scale-95" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
