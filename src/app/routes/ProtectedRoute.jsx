import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

const ProtectedRoute = ({ children, requiredPermission }) => {
  const { isAuthenticated, loading, isLoggingOut, hasPermission } = useAuth();
  const location = useLocation();

  // Show spinner only during initial auth check (app boot), not during logout.
  // During logout, `isAuthenticated` becomes false immediately (optimistic),
  // so we skip the spinner and let the Navigate redirect happen instantly.
  if (loading && !isLoggingOut) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the current location they were trying to go to.
    // During logout we use replace:true so the user can't navigate back to the
    // protected page via the browser back button.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    // If user doesn't have required permission, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
