/**
 * useRouteLoader
 *
 * Detects route/page transitions and drives the global loader accordingly.
 *
 * Strategy:
 *  - Watch `useLocation` and show the global loader whenever pathname changes.
 *  - Use a module-level guard to prevent duplicate triggers during StrictMode or remounts.
 *  - useLayoutEffect is used to ensure showLoader runs BEFORE child component useEffects
 *    (where forceHideLoader is typically called), avoiding race conditions.
 *  - useRef is maintained to ensure hook count remains consistent for HMR stability.
 *
 * Usage: call once inside a component that is always mounted (e.g. BaseLayout).
 */

import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useLoader } from '../context/LoaderContext';

// Module-level guard to avoid duplicate show calls during strict-mode remounts.
let lastTriggeredPathname = null;

const useRouteLoader = () => {
  const { showLoader } = useLoader();
  const location = useLocation();
  
  // Track previous path to maintain hook count and detect changes.
  const prevPathRef = useRef(location.pathname);

  useLayoutEffect(() => {
    if (prevPathRef.current !== location.pathname || lastTriggeredPathname !== location.pathname) {
      if (lastTriggeredPathname !== location.pathname) {
        showLoader();
        lastTriggeredPathname = location.pathname;
      }
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname, showLoader]);
};

export default useRouteLoader;
