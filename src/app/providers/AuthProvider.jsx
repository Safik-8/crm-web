import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../lib/api/api';

const AuthContext = createContext(undefined);

// RBAC Adapter Mapping
// Maps frontend permission string identifiers to backend UPPERCASE module names + CRUD booleans.
// Backend module keys: COMPANY, BRANCH, USER, PROSPECT, ACTIVITY, TASK, PIPELINE, SESSION, REPORT, AUDIT, TARGET, NOTIFICATION
const RBAC_ADAPTER_MAP = {
  // Navigation / View Permissions
  // Dashboard has no dedicated backend module — grant to all authenticated users by using null module
  'view:dashboard':         { module: null, action: null },          // Always true if authenticated
  'view:company_dashboard': { module: 'COMPANY', action: 'canView' },
  'view:prospects':         { module: 'PROSPECT', action: 'canView' },
  'view:activities':        { module: 'ACTIVITY', action: 'canView' },
  'view:sessions':          { module: 'SESSION', action: 'canView' },
  'view:tasks':             { module: 'TASK', action: 'canView' },
  'view:reports':           { module: 'REPORT', action: 'canView' },
  'view:team_reports':      { module: 'REPORT', action: 'canView' },
  'view:settings':          { module: 'BRANCH', action: 'canView' },
  'view:branch_settings':   { module: 'BRANCH', action: 'canEdit' },
  'view:company_setup':     { module: 'COMPANY', action: 'canEdit' },
  'view:users':             { module: 'USER', action: 'canView' },
  'view:leads':             { module: 'PIPELINE', action: 'canView' },
  'view:customers':         { module: 'PIPELINE', action: 'canView' },
  'view:deals':             { module: 'PIPELINE', action: 'canView' },
  'view:audit':             { module: 'AUDIT',    action: 'canView' },
  'view:targets':           { module: 'TARGET',   action: 'canView' },
  'view:notifications':     { module: 'NOTIFICATION', action: 'canView' },

  // Action Permissions
  'action:approve_transfers': { module: 'BRANCH', action: 'canEdit' },
  'action:manage_users':      { module: 'USER', action: 'canEdit' },
  'action:manage_all_users':  { module: 'USER', action: 'canEdit' },
  'action:read_only_reports': { module: 'REPORT', action: 'canView' },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Derive permissions dynamically using the RBAC adapter map against the real backend permissions object
  const hasPermission = useCallback((permissionStr) => {
    if (!user) return false;

    const mapping = RBAC_ADAPTER_MAP[permissionStr];
    if (!mapping) return false;

    // null module means "grant to all authenticated users" (e.g. dashboard)
    if (mapping.module === null) return true;

    // Safely evaluate `user.permissions.<UPPERCASE_MODULE>.<canAction>`
    return !!(user.permissions?.[mapping.module]?.[mapping.action]);
  }, [user]);

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
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
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
