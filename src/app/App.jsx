import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './providers/AuthProvider';
import { router } from './routes/index.jsx';
import { LoaderProvider } from '../shared/context/LoaderContext.jsx';
import muiTheme from '../shared/theme/muiTheme.js';
import CustomToaster from '../shared/components/elements/CustomToaster.jsx';
import '../shared/styles/index.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';

import { SocketProvider } from './providers/SocketProvider';

function App() {
  return (
    /*
     * Provider order (outermost → innermost):
     *   LoaderProvider  — must wrap everything so route components can
     *                     access the loader context.
     *   AuthProvider    — auth state, depends on apiClient (loader already wired)
     *   SocketProvider  — real-time WebSocket connection
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
      {/* Global notification toaster container */}
      <CustomToaster />

      <div className="antialiased text-zinc-900 bg-zinc-50 font-sans selection:bg-primary/20 selection:text-primary">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SocketProvider>
              <RouterProvider router={router} />
            </SocketProvider>
          </AuthProvider>
        </QueryClientProvider>
      </div>
    </LoaderProvider>
    </ThemeProvider>
  );
}

export default App;
