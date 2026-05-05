/**
 * useRouteLoader
 *
 * Detects route/page transitions and drives the global loader accordingly.
 *
 * Strategy:
 *  - Listen to React Router's `useNavigation` hook (v7 / v6.4+).
 *    When navigation state is "loading", show the loader.
 *    When it returns to "idle", hide it.
 *  - Additionally watch `useLocation` so that hard navigations (e.g. initial
 *    load, browser back/forward) also trigger a brief loader flash.
 *
 * Usage: call once inside a component that is always mounted (e.g. BaseLayout).
 */

import { useEffect, useRef } from 'react';
import { useLocation, useNavigation } from 'react-router-dom';
import { useLoader } from '../context/LoaderContext';

const useRouteLoader = () => {
  const { showLoader, hideLoader } = useLoader();
  const navigation = useNavigation();
  const location = useLocation();

  // Track whether we already showed the loader for the current navigation
  const isShowingRef = useRef(false);

  // ── React Router navigation state (data router transitions) ──────────────
  useEffect(() => {
    if (navigation.state === 'loading') {
      if (!isShowingRef.current) {
        isShowingRef.current = true;
        showLoader();
      }
    } else if (navigation.state === 'idle') {
      if (isShowingRef.current) {
        isShowingRef.current = false;
        hideLoader();
      }
    }
  }, [navigation.state, showLoader, hideLoader]);

  // ── Location change (catches initial render + hash/search changes) ────────
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;

      // Show a brief loader flash on every page change
      showLoader();
      const timer = setTimeout(() => hideLoader(), 400);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, showLoader, hideLoader]);
};

export default useRouteLoader;
