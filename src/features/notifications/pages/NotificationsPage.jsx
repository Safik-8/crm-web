/**
 * NotificationsPage — legacy route redirect
 *
 * The /notifications route is preserved in the router for backward
 * compatibility (deep links, bookmarks, RBAC permission checks).
 * Notifications are now surfaced via the floating panel in the Topbar,
 * so this page simply redirects to the dashboard.
 *
 * If a full-page notifications view is needed in the future, this file
 * is the correct place to build it — the route and permission guard
 * are already wired up in routes/index.jsx.
 */

import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useLoader } from '../../../shared/context/LoaderContext';

const NotificationsPage = () => {
  const { forceHideLoader } = useLoader();

  // Ensure the global loader is cleared before the redirect renders
  useEffect(() => {
    const t = setTimeout(() => forceHideLoader(), 50);
    return () => clearTimeout(t);
  }, [forceHideLoader]);

  return <Navigate to="/dashboard" replace />;
};

export default NotificationsPage;
