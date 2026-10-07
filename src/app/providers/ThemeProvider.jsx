import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useAuth } from './AuthProvider';
import { applyBrandTheme, resetBrandTheme } from '../../shared/utils/brandColorManager';
import { buildDynamicMuiTheme } from '../../shared/theme/muiTheme';

const ThemeContext = createContext({
  currentBrandColor: '#F86F03',
  previewBrandColor: (hex) => {},
  revertBrandColor: () => {},
  commitBrandColor: (hex) => {},
});

export const DynamicThemeProvider = ({ children }) => {
  const { user } = useAuth();

  // 1. Resolve company brand from authenticated user
  const savedBrandColor = useMemo(() => {
    // If Super Admin without company scope, default to platform #F86F03
    return user?.companySettings?.primaryColor || user?.company?.settings?.primaryColor || '#F86F03';
  }, [user]);

  const [activeColor, setActiveColor] = useState(savedBrandColor);
  const activeColorRef = useRef(savedBrandColor);

  // 2. Sync state when auth hydrates, changes, or user logs out
  useEffect(() => {
    if (user) {
      applyBrandTheme(savedBrandColor);
      setActiveColor(savedBrandColor);
      activeColorRef.current = savedBrandColor;
    } else {
      // Reset to platform default on logout
      resetBrandTheme();
      setActiveColor('#F86F03');
      activeColorRef.current = '#F86F03';
    }
  }, [user, savedBrandColor]);

  // 3. Live Preview & Rollback Handlers
  const previewBrandColor = (hex) => {
    if (/^#([A-Fa-f0-9]{6})$/.test(hex)) {
      applyBrandTheme(hex);
      setActiveColor(hex);
    }
  };

  const revertBrandColor = () => {
    applyBrandTheme(activeColorRef.current);
    setActiveColor(activeColorRef.current);
  };

  const commitBrandColor = (hex) => {
    if (/^#([A-Fa-f0-9]{6})$/.test(hex)) {
      applyBrandTheme(hex);
      setActiveColor(hex);
      activeColorRef.current = hex;
    }
  };

  // 4. Reactive MUI Theme with preserved component overrides
  const muiTheme = useMemo(() => {
    return buildDynamicMuiTheme(activeColor);
  }, [activeColor]);

  return (
    <ThemeContext.Provider
      value={{
        currentBrandColor: activeColor,
        previewBrandColor,
        revertBrandColor,
        commitBrandColor,
      }}
    >
      <MuiThemeProvider theme={muiTheme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useBrandTheme = () => useContext(ThemeContext);
