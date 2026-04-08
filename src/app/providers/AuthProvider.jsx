import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getPermissionsByRoles } from '../../lib/config/rbac-config';
import { MOCK_USERS } from '../../services/mock/mockUsers';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Derive permissions from user roles
  const permissions = user ? getPermissionsByRoles(user.roles) : [];

  const hasPermission = useCallback((permission) => {
    return permissions.includes(permission);
  }, [permissions]);

  useEffect(() => {
    // Check for stored session on load
    const token = localStorage.getItem('crm_token');
    if (token) {
      // Find user by token in mock data or use a default
      const savedUser = Object.values(MOCK_USERS).find(u => u.token === token) || MOCK_USERS.ise_user;
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800)); // Delay
    
    // Simulate real login by matching both email and password
    const foundUser = Object.values(MOCK_USERS).find(
      u => u.email === email && u.password === password
    );
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('crm_token', foundUser.token);
      setLoading(false);
      return { success: true };
    }
    
    setLoading(false);
    return { 
      success: false, 
      message: 'Invalid credentials. Use arjun@stackdot.com or priya@stackdot.com and password "password123"' 
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('crm_token');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      isAuthenticated: !!user,
      permissions,
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
