import { useAuth } from '../../app/providers/AuthProvider';

export const usePermission = () => {
  const { permissions, hasPermission, user } = useAuth();

  return {
    permissions,
    hasPermission,
    user,
    isAdmin: user?.roles?.includes('SUPER_ADMIN'),
  };
};
