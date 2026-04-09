import { useAuth } from '../../app/providers/AuthProvider';

export const usePermission = () => {
  const { permissions, hasPermission, user } = useAuth();

  return {
    permissions,
    hasPermission,
    user,
    // Backend returns primaryRole as a direct string like 'Admin' or 'Super Admin'
    isAdmin: user?.primaryRole === 'Super Admin' || user?.primaryRole === 'Admin',
  };
};

