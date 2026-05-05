/**
 * useRouteLoader
 *
 * Detects route/page transitions and drives the global loader accordingly.
 *
 * Strategy:
 *  - Watch `useLocation` and show the global loader whenever pathname changes.
 *  - Loader hide is handled by page-level readiness (initial data complete),
 *    not by timeout-based auto-hide.
 *
 * Usage: call once inside a component that is always mounted (e.g. BaseLayout).
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useLoader } from '../context/LoaderContext';

// Module-level guard to avoid duplicate show calls during strict-mode remounts.
let lastTriggeredPathname = null;

const useRouteLoader = () => {
  const { showLoader } = useLoader();
  const location = useLocation();

  // ── Location change (catches initial render + hash/search changes) ────────
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      // Show loader for route transition; destination page decides when to hide.
      if (lastTriggeredPathname !== location.pathname) {
        showLoader();
        lastTriggeredPathname = location.pathname;
      }
    }
  }, [location.pathname, showLoader]);
};

export default useRouteLoader;
