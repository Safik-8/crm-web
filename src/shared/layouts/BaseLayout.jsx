import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/modules/Sidebar';
import Topbar from '../components/modules/Topbar';
import GlobalLoader from '../components/elements/GlobalLoader';
import useRouteLoader from '../hooks/useRouteLoader';

const BaseLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Drives the global loader on every route transition
  useRouteLoader();

  // Close the mobile sidebar on every navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const getPageTitle = (path) => {
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments.pop() || 'Overview';
    const customMappings = {
      'daily': 'Daily Report',
      'kanban': 'Leads Kanban',
      'branch': 'Branch Performance',
    };
    if (customMappings[lastSegment]) return customMappings[lastSegment];
    return lastSegment.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const pageTitle = getPageTitle(location.pathname);
  const isFullWidthPage = location.pathname.includes('/board') || location.pathname.includes('/stages');

  return (
    <div className="flex bg-zinc-50 h-screen overflow-hidden">
      {/* Sidebar — fixed on mobile, static on desktop */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/*
       * Content column — `relative` is the key: it creates a positioning
       * context so the loader overlay (position: absolute) is clipped to
       * this column only, never covering the sidebar.
       */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* Topbar — outside the loader scope, always visible */}
        <Topbar toggleSidebar={toggleSidebar} pageTitle={pageTitle} />

        {/*
         * Loader + main wrapped in a relative container so the loader
         * (position:absolute) is clipped to this area only — topbar and
         * sidebar remain fully visible during route transitions.
         */}
        <div className="relative flex-1 min-h-0 flex flex-col">
          <GlobalLoader contentScoped />

          {/* Main content */}
          <main
            className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-zinc-50 ${
              isFullWidthPage ? 'p-0' : 'p-4 sm:p-5 md:p-6 lg:p-8'
            }`}
          >
            <div
              className={`mx-auto h-full ${
                isFullWidthPage ? 'max-w-none' : 'max-w-7xl'
              } animate-in fade-in slide-in-from-bottom-4 duration-500`}
            >
              <Outlet />
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="min-h-[44px] border-t border-zinc-200/70 bg-white/60 backdrop-blur-sm px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 font-medium tracking-wide shrink-0">
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
