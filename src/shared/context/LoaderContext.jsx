/**
 * LoaderContext
 *
 * Global loader state management using a request-counter pattern.
 * Multiple concurrent API calls each increment the counter; the loader
 * stays visible until ALL of them resolve (counter reaches 0).
 *
 * This prevents the loader from flickering off between back-to-back requests.
 */

import { createContext, useCallback, useContext, useRef, useState } from 'react';

const LoaderContext = createContext(undefined);

export const LoaderProvider = ({ children }) => {
  // Number of in-flight requests / active loading triggers
  const [requestCount, setRequestCount] = useState(0);
  const [message, setMessage] = useState('');

  // Safety timeout ref — ensures the loader never gets permanently stuck
  const safetyTimerRef = useRef(null);

  /** Show the loader. Optionally pass a contextual message. */
  const showLoader = useCallback((msg = '') => {
    setRequestCount((prev) => prev + 1);
    if (msg) setMessage(msg);

    // Reset any existing safety timer
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);

    // Hard cap: force-hide after 15 seconds no matter what
    safetyTimerRef.current = setTimeout(() => {
      setRequestCount(0);
      setMessage('');
    }, 15_000);
  }, []);

  /** Hide the loader. Decrements the counter; hides when it reaches 0. */
  const hideLoader = useCallback(() => {
    setRequestCount((prev) => {
      const next = Math.max(0, prev - 1);
      if (next === 0) {
        setMessage('');
        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current);
          safetyTimerRef.current = null;
        }
      }
      return next;
    });
  }, []);

  /** Force-hide regardless of counter (used on errors / cancellations). */
  const forceHideLoader = useCallback(() => {
    setRequestCount(0);
    setMessage('');
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const isLoading = requestCount > 0;

  return (
    <LoaderContext.Provider
      value={{ isLoading, message, showLoader, hideLoader, forceHideLoader }}
    >
      {children}
    </LoaderContext.Provider>
  );
};

/**
 * useLoader — consume the global loader from any component or hook.
 *
 * @example
 * const { showLoader, hideLoader } = useLoader();
 */
export const useLoader = () => {
  const ctx = useContext(LoaderContext);
  if (!ctx) throw new Error('useLoader must be used within a LoaderProvider');
  return ctx;
};
