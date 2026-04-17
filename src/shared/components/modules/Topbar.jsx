import { Search, Bell, Menu, User, LogOut } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { useNavigate } from 'react-router-dom';

const Topbar = ({ toggleSidebar, pageTitle }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="h-10 w-64 rounded-full bg-slate-100 pl-10 pr-4 text-sm outline-none transition-all focus:bg-white focus:ring-1 focus:ring-primary/20 lg:w-80"
            />
          </div>
        </div>

        {/* Notifications */}
        <button onClick={() => navigate('/notifications')} className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-white"></span>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-2">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold text-slate-800 font-heading leading-tight italic">
              {user?.name || 'Guest User'}
            </p>
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-full mt-0.5 border border-primary/10">
              {user?.primaryRole || user?.designation || 'Unknown Role'}
            </p>
          </div>
          <div className="group relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 shadow-lg shadow-slate-200 text-white transition-all hover:scale-105 cursor-pointer ring-2 ring-white">
              <User size={20} />
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="ml-2 rounded-xl p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all group shrink-0"
            title="Log out"
          >
            <LogOut size={20} className="group-active:scale-95 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
