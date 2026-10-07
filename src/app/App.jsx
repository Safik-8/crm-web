import { RouterProvider } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './providers/AuthProvider';
import { DynamicThemeProvider } from './providers/ThemeProvider';
import { router } from './routes/index.jsx';
import { LoaderProvider } from '../shared/context/LoaderContext.jsx';
import CustomToaster from '../shared/components/elements/CustomToaster.jsx';
import '../shared/styles/index.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { SocketProvider } from './providers/SocketProvider';

function App() {
  return (
    /*
     * Provider order (outermost → innermost):
     *   LoaderProvider        — global loader & toaster context
     *   QueryClientProvider   — react-query cache
     *   AuthProvider          — auth session & user credentials
     *   DynamicThemeProvider — multi-tenant dynamic branding (MUI + Tailwind CSS vars)
     *   SocketProvider        — real-time WebSocket connection
     *   RouterProvider        — page routing
     */
    <LoaderProvider>
      <CustomToaster />

      <div className="antialiased text-zinc-900 bg-zinc-50 font-sans selection:bg-primary/20 selection:text-primary">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <DynamicThemeProvider>
              {/*
               * CssBaseline normalises browser defaults.
               * We do NOT use enableColorScheme to avoid interfering with
               * Tailwind's own base reset that is already applied globally.
               */}
              <CssBaseline enableColorScheme={false} />
              <SocketProvider>
                <RouterProvider router={router} />
              </SocketProvider>
            </DynamicThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </div>
    </LoaderProvider>
  );
}

export default App;
