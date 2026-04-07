import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored session on load
    const token = localStorage.getItem('crm_token');
    if (token) {
      // Simulate real user data
      setUser({ name: 'Jane Smith', role: 'Sales Administrator', email: 'jane@example.com' });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Simulate real login
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800)); // Delay
    
    if (email && password) {
      const newUser = { name: 'Jane Smith', role: 'Sales Administrator', email };
      setUser(newUser);
      localStorage.setItem('crm_token', 'mock_token_123');
      setLoading(false);
      return { success: true };
    }
    setLoading(false);
    return { success: false, message: 'Invalid credentials' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('crm_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
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
