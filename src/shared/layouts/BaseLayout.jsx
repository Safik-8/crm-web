import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/modules/Sidebar';
import Topbar from '../components/modules/Topbar';
import useRouteLoader from '../hooks/useRouteLoader';

const BaseLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Drives the global loader on every route transition
  useRouteLoader();

  // Close the mobile sidebar on every navigation so the new page
  // doesn't render with the drawer still open
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Extract page title from pathname
  const getPageTitle = (path) => {
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments.pop() || 'Overview';
    
    // Custom mappings for better UX
    const customMappings = {
      'daily': 'Daily Report',
      'kanban': 'Leads Kanban',
      'branch': 'Branch Performance',
    };

    if (customMappings[lastSegment]) return customMappings[lastSegment];

    // Default: capitalize and replace separators
    return lastSegment.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const pageTitle = getPageTitle(location.pathname);

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
        <main className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${isFullWidthPage ? 'p-0' : 'p-3 sm:p-4 md:p-6 lg:p-8'}`}>
          <div className={`mx-auto h-full ${isFullWidthPage ? 'max-w-none' : 'max-w-7xl'} animate-in fade-in slide-in-from-bottom-5 duration-700`}>
            <Outlet />
          </div>
        </main>

        {/* Footer - Fixed */}
        <footer className="min-h-[3.5rem] border-t border-slate-200 bg-white/50 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium tracking-wide shrink-0 font-sans">
          <p className="whitespace-nowrap">&copy; 2026 StackCode Training Institute. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-primary cursor-pointer transition-colors whitespace-nowrap">Privacy Policy</span>
            <span className="hover:text-primary cursor-pointer transition-colors whitespace-nowrap">Terms of Service</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default BaseLayout;
