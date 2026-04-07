import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './providers/AuthProvider.jsx';
import { router } from './routes/index.jsx';
import '../shared/styles/index.css';

function App() {
  return (
    <div className="antialiased text-slate-900 bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Toaster position="top-right" richColors />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </div>
  );
}

export default App;
