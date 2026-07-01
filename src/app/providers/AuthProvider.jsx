import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/api';

const AuthContext = createContext(undefined);

// RBAC Adapter Mapping
// Maps frontend permission string identifiers to backend UPPERCASE module names + CRUD booleans.
// Backend module keys: COMPANY, BRANCH, USER, PROSPECT, ACTIVITY, TASK, PIPELINE, SESSION, REPORT, AUDIT, TARGET, NOTIFICATION
const RBAC_ADAPTER_MAP = {
  // Navigation / View Permissions
  'view:dashboard': { module: 'DASHBOARD', action: 'canView' },
  'view:branch_dashboard': { module: 'DASHBOARD', action: 'canView' },
  'view:company_dashboard': { module: 'COMPANY', action: 'canView' },
  'view:prospects': { module: 'LEAD', action: 'canView' }, // Fixed from PROSPECT
  'view:activities': { module: 'ACTIVITY', action: 'canView' },
  'view:sessions': { module: 'ACTIVITY', action: 'canView' }, // Fallback to ACTIVITY
  'view:tasks': { module: 'TASK', action: 'canView' },
  'view:reports': { module: 'REPORT', action: 'canView' },
  'view:team_reports': { module: 'REPORT', action: 'canView' },
  'view:settings': { module: 'BRANCH', action: 'canView' },
  'view:branches': { module: 'BRANCH', action: 'canView' },
  'view:branch_settings': { module: 'BRANCH', action: 'canEdit' },
  'view:company_setup': { module: 'COMPANY', action: 'canEdit' },
  'view:users': { module: 'USER', action: 'canView' },
  'view:leads': { module: 'PIPELINE', action: 'canView' },
  'view:customers': { module: 'CUSTOMER', action: 'canView' }, // Fixed from PIPELINE
  'view:deals': { module: 'PIPELINE', action: 'canView' },
  'view:audit': { module: 'AUDIT', action: 'canView' },
  'view:targets': { module: 'TARGET', action: 'canView' },
  'view:notifications': { module: 'NOTIFICATION', action: 'canView' },

  // Action Permissions
  'action:approve_transfers': { module: 'APPROVAL', action: 'canEdit' }, // Fixed from BRANCH
  'action:manage_users': { module: 'USER', action: 'canEdit' },
  'action:manage_all_users': { module: 'USER', action: 'canEdit' },
  'action:read_only_reports': { module: 'REPORT', action: 'canView' },

  // Pipeline & Stage Permissions (Phase 1)
  'view:pipelines': { module: 'PIPELINE', action: 'canView' },
  'create:pipeline': { module: 'PIPELINE', action: 'canCreate' },
  'manage:pipelines': { module: 'PIPELINE', action: 'canEdit' },
  'delete:pipeline': { module: 'PIPELINE', action: 'canDelete' },
  'view:stages': { module: 'STAGE', action: 'canView' },
  'manage:stages': { module: 'STAGE', action: 'canEdit' },

  // Lead Permissions (Phase 1)
  'view:leads_kanban': { module: 'LEAD', action: 'canView' },
  'create:lead': { module: 'LEAD', action: 'canCreate' },
  'edit:lead': { module: 'LEAD', action: 'canEdit' },

  // Activity / Comment Permissions (Phase 1)
  'view:activity_feed': { module: 'ACTIVITY', action: 'canView' },
  'create:activity': { module: 'ACTIVITY', action: 'canCreate' },

  // Daily Report (ISE)
  'view:daily_report': { module: 'NOTIFICATION', action: 'canView' }, // Workaround mapping for menu rendering
  'create:daily_report': { module: 'NOTIFICATION', action: 'canCreate' },
};

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Prevent duplicate logout calls
  const logoutInFlightRef = useRef(false);

  // Load current user session via TanStack Query
  const { data: authData, isLoading: isAuthLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiClient('/auth/me', { method: 'GET' }),
    retry: false,
    staleTime: Infinity,
  });

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => apiClient('/auth/login', {
      method: 'POST',
      body: { email, password }
    }),
    onSuccess: (response) => {
      if (response && response.success && response.data?.user) {
        queryClient.setQueryData(['currentUser'], response);
      }
    }
  });

  // Logout Mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiClient('/auth/logout', { method: 'POST', silent: true }),
    onMutate: () => {
      // Optimistically clear the currentUser session
      queryClient.setQueryData(['currentUser'], null);
    }
  });

  const user = authData?.success && authData?.data?.user ? authData.data.user : null;
  const loading = isAuthLoading || loginMutation.isPending;

  // Derive permissions dynamically using the RBAC adapter map against the real backend permissions object.
  // Supports both:
  //   1. hasPermission('create:pipeline') -> looks up via RBAC_ADAPTER_MAP
  //   2. hasPermission('PIPELINE', 'canCreate') -> directly evaluates backend permissions (fully dynamic/extendable)
  const hasPermission = useCallback((moduleOrPermissionStr, action = null) => {
    if (!user) return false;

    // Mode A: Direct check - hasPermission('MODULE_NAME', 'canAction')
    if (action) {
      return !!(user.permissions?.[moduleOrPermissionStr]?.[action]);
    }

    // Mode B: Mapped check - hasPermission('permission_string')
    const mapping = RBAC_ADAPTER_MAP[moduleOrPermissionStr];
    if (!mapping) return false;

    return !!(user.permissions?.[mapping.module]?.[mapping.action]);
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await loginMutation.mutateAsync({ email, password });

      if (response && response.success && response.data?.user) {
        return { success: true };
      }

      return { success: false, message: response?.message || 'Login failed', rawData: response };
    } catch (error) {
      // Pass the fully parsed HTTP error block upstream for precise UI validation handling
      return { success: false, error };
    }
  };

  const logout = async () => {
    // Prevent duplicate calls (double-click, race conditions)
    if (logoutInFlightRef.current) return;
    logoutInFlightRef.current = true;
    setIsLoggingOut(true);

    try {
      await logoutMutation.mutateAsync();
    } catch (err) {
      // Swallow silently — user is already logged out locally.
      // The server-side session will expire naturally.
      console.warn('[Auth] Logout API call failed (user already cleared):', err);
    } finally {
      logoutInFlightRef.current = false;
      setIsLoggingOut(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      isLoggingOut,
      isAuthenticated: !!user,
      permissions: user?.permissions || {}, // Exposing raw backend permissions instead of array
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
