import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { X } from 'lucide-react';
import { AuthProvider } from './providers/AuthProvider.jsx';
import { router } from './routes/index.jsx';
import '../shared/styles/index.css';

function App() {
  return (
    <div className="antialiased text-slate-900 bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Toaster 
        position="top-right" 
        richColors
        closeButton
        duration={5000}
        gap={12}
        offset={24}
        expand={true}
        visibleToasts={5}
        toastOptions={{
          className: 'group toast-custom',
          style: {
            background: 'white',
            border: '1px solid rgb(226 232 240)',
            borderRadius: '16px',
            padding: '16px 20px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            backdropFilter: 'blur(8px)',
            minHeight: '64px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          },
          closeButton: {
            position: 'absolute',
            right: '12px',
            top: '12px',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: 'none',
            background: 'rgb(248 250 252)',
            color: 'rgb(100 116 139)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            fontSize: '16px',
            fontWeight: '600'
          }
        }}
        icons={{
          success: (
            <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
          ),
          error: (
            <div className="h-8 w-8 bg-red-50 rounded-lg flex items-center justify-center text-red-600 flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
          ),
          warning: (
            <div className="h-8 w-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <path d="M12 9v4"/>
                <path d="m12 17 .01 0"/>
              </svg>
            </div>
          ),
          info: (
            <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="m12 8 .01 0"/>
              </svg>
            </div>
          ),
          loading: (
            <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-600 flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
            </div>
          )
        }}
      />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </div>
  );
}

export default App;
