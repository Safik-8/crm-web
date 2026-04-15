import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/modules/Sidebar';
import Topbar from '../components/modules/Topbar';

const BaseLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Extract page title from pathname
  const pageTitle = location.pathname.split('/').pop() || 'Overview';

  return (
    <div className="flex bg-slate-50 h-screen overflow-hidden">
      {/* Sidebar Navigation - Fixed */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content Area - Scrollable */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Topbar - Fixed */}
        <Topbar toggleSidebar={toggleSidebar} pageTitle={pageTitle} />
        
        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-5 duration-700">
            <Outlet />
          </div>
        </main>

        {/* Footer - Fixed */}
        <footer className="h-14 border-t border-slate-200 bg-white/50 px-8 flex items-center justify-between text-xs text-slate-500 font-medium tracking-wide shrink-0">
          <p>&copy; 2026 STACKDOT. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-blue-500 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-blue-500 cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default BaseLayout;
