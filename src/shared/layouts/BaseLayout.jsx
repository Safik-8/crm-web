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

  // Check if current page should be full width (e.g. Kanban board)
  const isFullWidthPage = location.pathname.includes('/board') || location.pathname.includes('/stages');

  return (
    <div className="flex bg-neutral h-screen overflow-hidden">
      {/* Sidebar Navigation - Fixed */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content Area - Scrollable */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Topbar - Fixed */}
        <Topbar toggleSidebar={toggleSidebar} pageTitle={pageTitle} />
        
        {/* Main Content - Scrollable */}
        <main className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${isFullWidthPage ? 'p-0' : 'p-6 md:p-8'} bg-white`}>
          <div className={`mx-auto h-full ${isFullWidthPage ? 'max-w-none' : 'max-w-7xl'} animate-in fade-in slide-in-from-bottom-5 duration-700`}>
            <Outlet />
          </div>
        </main>

        {/* Footer - Fixed */}
        <footer className="h-14 border-t border-slate-200 bg-white/50 px-8 flex items-center justify-between text-xs text-slate-500 font-medium tracking-wide shrink-0 font-sans">
          <p>&copy; 2026 StackCode Training Institute. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default BaseLayout;
