import { useAuth } from '../../app/providers/AuthProvider';

const PermissionGuard = ({ permission, children, fallback = null }) => {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return fallback;
  }

  return children;
};

export default PermissionGuard;
