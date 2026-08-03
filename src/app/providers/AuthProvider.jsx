import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../lib/api/api';
import { useQueryClient } from '@tanstack/react-query';

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
  'view:company_setup': { module: 'COMPANY', action: 'canCreate' },
  'view:users': { module: 'USER', action: 'canView' },
  'view:roles': { module: 'ROLE_PERMISSION', action: 'canView' },
  'view:leads': { module: 'LEAD', action: 'canView' },
  'view:customers': { module: 'CUSTOMER', action: 'canView' }, // Fixed from PIPELINE
  'view:deals': { module: 'PIPELINE', action: 'canView' },
  'view:audit': { module: 'AUDIT', action: 'canView' },
  'view:targets': { module: 'TARGET', action: 'canView' },
  'view:notifications': { module: 'NOTIFICATION', action: 'canView' },
  'read:notification': { module: 'NOTIFICATION', action: 'canEdit' },
  'delete:notification': { module: 'NOTIFICATION', action: 'canDelete' },

  'view:courses': { module: 'COURSE', action: 'canView' },
  'view:lead_sources': { module: 'LEAD_SOURCE', action: 'canView' },
  'view:teams': { module: 'TEAM', action: 'canView' },
  'view:lead_statuses': { module: 'LEAD_STATUS', action: 'canView' },
  'view:lead_assignment': { module: 'LEAD_ASSIGNMENT', action: 'canView' },

  // Action Permissions
  'action:approve_transfers': { module: 'APPROVAL', action: 'canEdit' }, // Fixed from BRANCH
  'action:manage_users': { module: 'USER', action: 'canEdit' },
  'action:manage_all_users': { module: 'USER', action: 'canEdit' },
  'action:read_only_reports': { module: 'REPORT', action: 'canView' },

  // Pipeline & Stage Permissions (Phase 1)
  'view:pipelines':   { module: 'PIPELINE', action: 'canView' },
  'create:pipeline':  { module: 'PIPELINE', action: 'canCreate' },
  'manage:pipelines': { module: 'PIPELINE', action: 'canEdit' },
  'delete:pipeline':  { module: 'PIPELINE', action: 'canDelete' },
  'view:stages':      { module: 'PIPELINE', action: 'canView' },
  'manage:stages':    { module: 'PIPELINE', action: 'canEdit' },

  // Lead Permissions (Phase 1)
  'view:leads_kanban': { module: 'LEAD', action: 'canView' },
  'create:lead':       { module: 'LEAD', action: 'canCreate' },
  'edit:lead':         { module: 'LEAD', action: 'canEdit' },

  // Activity / Comment Permissions (Phase 1)
  'view:activity_feed': { module: 'ACTIVITY', action: 'canView' },
  'create:activity':    { module: 'ACTIVITY', action: 'canCreate' },

  // Follow-up Permissions (Sprint 4 — Task 5)
  'view:followups':   { module: 'FOLLOWUP', action: 'canView' },
  'create:followup':  { module: 'FOLLOWUP', action: 'canCreate' },
  'edit:followup':    { module: 'FOLLOWUP', action: 'canEdit' },
  'delete:followup':  { module: 'FOLLOWUP', action: 'canDelete' },

  // Daily Report (ISE)
  'view:daily_report': { module: 'NOTIFICATION', action: 'canView' }, // Workaround mapping for menu rendering
  'create:daily_report': { module: 'NOTIFICATION', action: 'canCreate' }, 
};

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Prevent duplicate logout calls
  const logoutInFlightRef = useRef(false);

  // Derive permissions dynamically using the RBAC adapter map against the real backend permissions object.
  // Supports both:
  //   1. hasPermission('create:pipeline') -> looks up via RBAC_ADAPTER_MAP
  //   2. hasPermission('PIPELINE', 'canCreate') -> directly evaluates backend permissions (fully dynamic/extendable)
  const hasPermission = useCallback((moduleOrPermissionStr, action = null) => {
    if (!user) return false;

    // Super Admin & Company Admin have full administrative permissions over all modules
    if (user.primaryRole === 'SUPER_ADMIN' || user.primaryRole === 'COMPANY_ADMIN' || (user.primaryRoleRank >= 80)) {
      return true;
    }

    // Branch Managers have permission to view & edit their own branch and organization settings
    if (
      user.primaryRole === 'BRANCH_MANAGER' ||
      (user.primaryRoleRank && Number(user.primaryRoleRank) >= 60)
    ) {
      if (
        moduleOrPermissionStr === 'view:settings' ||
        moduleOrPermissionStr === 'view:branches' ||
        moduleOrPermissionStr === 'view:branch_settings' ||
        moduleOrPermissionStr === 'view:branch_dashboard' ||
        (moduleOrPermissionStr === 'BRANCH' && (action === 'canView' || action === 'canEdit'))
      ) {
        return true;
      }
    }

    // Mode A: Direct check - hasPermission('MODULE_NAME', 'canAction')
    if (action) {
      return !!(user.permissions?.[moduleOrPermissionStr]?.[action]);
    }

    // Special logic for settings organization path: allowed if they can view COMPANY OR BRANCH
    if (moduleOrPermissionStr === 'view:settings') {
      return !!(user.permissions?.COMPANY?.canView || user.permissions?.BRANCH?.canView);
    }

    // Mode B: Mapped check - hasPermission('permission_string')
    const mapping = RBAC_ADAPTER_MAP[moduleOrPermissionStr];
    if (!mapping) return false;

    return !!(user.permissions?.[mapping.module]?.[mapping.action]);
  }, [user]);

  const refetchUser = useCallback(async () => {
    try {
      const response = await apiClient('/auth/me', { method: 'GET' });
      if (response?.success && response?.data?.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('[Auth] Refetch user failed:', error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchCurrentUser = async () => {
      try {
        const response = await apiClient('/auth/me', { method: 'GET' });
        if (isMounted && response?.success && response?.data?.user) {
          setUser(response.data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);

    try {
      const response = await apiClient('/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      if (response && response.success && response.data?.user) {
        queryClient.clear();
        setUser(response.data.user);
        setLoading(false);
        return { success: true };
      }


      setLoading(false);
      return { success: false, message: response?.message || 'Login failed', rawData: response };
    } catch (error) {
      setLoading(false);
      // Pass the fully parsed HTTP error block upstream for precise UI validation handling
      return { success: false, error };
    }
  };

  const logout = async () => {
    // Prevent duplicate calls (double-click, race conditions)
    if (logoutInFlightRef.current) return;
    logoutInFlightRef.current = true;
    setIsLoggingOut(true);

    // ── Optimistic logout ────────────────────────────────────────────────────
    // Clear auth state immediately so the UI reacts at once — no waiting for
    // the network. The ProtectedRoute will redirect to /login as soon as
    // `isAuthenticated` becomes false.
    setUser(null);
    queryClient.clear();

    // ── Background API call ──────────────────────────────────────────────────
    // Fire-and-forget: the session cookie is invalidated server-side.
    // We don't await this before navigating — the UX is already instant.
    try {
      await apiClient('/auth/logout', { method: 'POST', silent: true });
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
      hasPermission,
      refetchUser
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
