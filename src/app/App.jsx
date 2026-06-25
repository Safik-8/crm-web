import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './providers/AuthProvider.jsx';
import { router } from './routes/index.jsx';
import { LoaderProvider } from '../shared/context/LoaderContext.jsx';
import muiTheme from '../shared/theme/muiTheme.js';
import '../shared/styles/index.css';

function App() {
  return (
    /*
     * Provider order (outermost → innermost):
     *   LoaderProvider  — must wrap everything so route components can
     *                     access the loader context.
     *   AuthProvider    — auth state, depends on apiClient (loader already wired)
     *   RouterProvider  — page routing
     *
     * GlobalLoader renders the full-screen overlay; it is intentionally placed
     * OUTSIDE RouterProvider so it is never unmounted during route transitions.
     *
     * Toaster z-index (9999) sits above GlobalLoader (9998) so notifications
     * remain visible while the loader is active.
     */
    <ThemeProvider theme={muiTheme}>
      {/*
       * CssBaseline normalises browser defaults.
       * We do NOT use enableColorScheme to avoid interfering with
       * Tailwind's own base reset that is already applied globally.
       */}
      <CssBaseline enableColorScheme={false} />
    <LoaderProvider>
      {/*
       * Sonner toast container.
       * Declared before AuthProvider/RouterProvider so it is never
       * re-mounted during auth state changes.
       */}
      <Toaster
        position="bottom-right"
        mobilePosition="bottom-center"
        closeButton
        duration={5000}
        gap={8}
        offset={20}
        expand={false}
        visibleToasts={4}
        containerAriaLabel="Notifications"
        style={{ zIndex: 9999 }}
        toastOptions={{
          unstyled: true,
          className: 'toast-root',
        }}
        icons={{
          success: (
            <span className="toast-icon toast-icon--success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </span>
          ),
          error: (
            <span className="toast-icon toast-icon--error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </span>
          ),
          warning: (
            <span className="toast-icon toast-icon--warning">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </span>
          ),
          info: (
            <span className="toast-icon toast-icon--info">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
              </svg>
            </span>
          ),
          loading: (
            <span className="toast-icon toast-icon--loading">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{animation:'toast-spin 0.75s linear infinite'}}>
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
            </span>
          ),
        }}
      />

      <div className="antialiased text-zinc-900 bg-zinc-50 font-sans selection:bg-primary/20 selection:text-primary">
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </div>
    </LoaderProvider>
    </ThemeProvider>
  );
}

export default App;
