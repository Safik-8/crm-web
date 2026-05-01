import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { getFilteredNavItems } from '../../lib/constants/navItems';

const RootRedirect = () => {
  const { user, hasPermission, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const filteredItems = getFilteredNavItems(user, hasPermission);

  if (filteredItems.length > 0) {
    // Redirect to the first allowed item's path
    return <Navigate to={filteredItems[0].path} replace />;
  }

  // Fallback if no items are allowed (should theoretically not happen with correct RBAC)
  return <div className="p-10 text-center text-slate-500 font-bold">No accessible modules found for your account.</div>;
};

export default RootRedirect;
