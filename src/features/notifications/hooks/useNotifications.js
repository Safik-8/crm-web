/**
 * useNotifications
 *
 * Isolated state management for the notification panel.
 * Completely decoupled from the global LoaderContext — loading state
 * lives only inside this hook and surfaces only inside the panel.
 *
 * Features:
 *  - Fetch on panel open (lazy — no background polling on mount)
 *  - AbortController cleanup on unmount / panel close
 *  - Optimistic mark-as-read (instant UI, background API)
 *  - Optimistic mark-all-read
 *  - Unread count derived from local state (no extra request)
 *  - Race-condition safe via in-flight ref guard
 */

import { useState, useCallback, useRef } from 'react';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading]         = useState(false);
  const [hasError, setHasError]           = useState(false);
  const [hasFetched, setHasFetched]       = useState(false);

  // AbortController ref — cancelled when panel closes or component unmounts
  const abortRef = useRef(null);
  // Guard against duplicate in-flight fetches
  const fetchingRef = useRef(false);

  // ── Derived state ──────────────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  /**
   * Load notifications. Safe to call multiple times — skips if already
   * fetching. Pass `force: true` to refresh even if already fetched.
   */
  const loadNotifications = useCallback(async ({ force = false } = {}) => {
    if (fetchingRef.current) return;
    if (hasFetched && !force) return;

    // Cancel any previous in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    fetchingRef.current = true;
    setIsLoading(true);
    setHasError(false);

    try {
      const res = await fetchNotifications({ signal: abortRef.current.signal });

      // Normalise: backend may return { data: [...] } or { data: { notifications: [...] } }
      const list =
        res?.data?.notifications ??
        res?.data ??
        res?.notifications ??
        [];

      setNotifications(Array.isArray(list) ? list : []);
      setHasFetched(true);
    } catch (err) {
      // AbortError means the panel was closed — not a real error
      if (err?.name !== 'AbortError') {
        setHasError(true);
      }
    } finally {
      fetchingRef.current = false;
      setIsLoading(false);
    }
  }, [hasFetched]);

  // ── Cancel in-flight request (call when panel closes) ─────────────────────
  const cancelFetch = useCallback(() => {
    abortRef.current?.abort();
    fetchingRef.current = false;
  }, []);

  // ── Mark single as read (optimistic) ──────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    // Optimistic update first
    setNotifications((prev) =>
      prev.map((n) => (n.id === id || n._id === id ? { ...n, isRead: true } : n))
    );

    try {
      await markNotificationRead(id);
    } catch {
      // Rollback on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id || n._id === id ? { ...n, isRead: false } : n))
      );
    }
  }, []);

  // ── Mark all as read (optimistic) ─────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    const previous = notifications;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await markAllNotificationsRead();
    } catch {
      // Rollback
      setNotifications(previous);
    }
  }, [notifications]);

  // ── Refresh ────────────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    loadNotifications({ force: true });
  }, [loadNotifications]);

  return {
    notifications,
    isLoading,
    hasError,
    hasFetched,
    unreadCount,
    loadNotifications,
    cancelFetch,
    markAsRead,
    markAllAsRead,
    refresh,
  };
};
