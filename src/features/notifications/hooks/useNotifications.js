/**
 * useNotifications
 *
 * Isolated state management for the notification panel.
 * Completely decoupled from the global LoaderContext — loading state
 * lives only inside this hook and surfaces only inside the panel.
 *
 * Features:
 *  - Fetch on panel open (lazy — no background polling on mount)
 *  - Default 3-day window; "Load Older" fetches all-time via daysLimit=0
 *  - AbortController cleanup on unmount / panel close
 *  - Optimistic mark-as-read (instant UI, background API)
 *  - Optimistic mark-all-read
 *  - Optimistic delete with rollback on failure
 *  - hasMore / loadMore for infinite scroll pagination
 *  - Race-condition safe via in-flight ref guard
 */

import { useState, useCallback, useRef } from 'react';
import {
  fetchNotifications,
  fetchOlderNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../services/notificationService';
import { queryClient } from '../../../lib/queryClient';


export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading]         = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasError, setHasError]           = useState(false);
  const [hasFetched, setHasFetched]       = useState(false);
  const [hasMore, setHasMore]             = useState(false);
  const [currentPage, setCurrentPage]     = useState(1);

  // AbortController ref — cancelled when panel closes or component unmounts
  const abortRef = useRef(null);
  // Guard against duplicate in-flight fetches
  const fetchingRef = useRef(false);

  const [serverUnreadCount, setServerUnreadCount] = useState(null);

  // ── Derived state ──────────────────────────────────────────────────────────
  const localUnreadCount = notifications.filter((n) => n.status === 'UNREAD' && !n.isRead).length;
  const unreadCount      = serverUnreadCount !== null ? serverUnreadCount : localUnreadCount;

  // ── Normaliser (shared) ────────────────────────────────────────────────────
  const normalise = (raw) =>
    raw.map((n) => ({
      ...n,
      isRead: n.status === 'READ' || n.isRead === true,
      status: n.status || (n.isRead ? 'READ' : 'UNREAD'),
    }));

  // ── Fetch (initial / forced refresh) ──────────────────────────────────────
  /**
   * Load notifications. Safe to call multiple times — skips if already
   * fetching. Pass `force: true` to refresh even if already fetched.
   * Always fetches with daysLimit=3 (past 3 days default).
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
      const res = await fetchNotifications({
        page: 1,
        limit: 50,
        daysLimit: 3,
        signal: abortRef.current.signal,
      });

      // Normalise: backend may return { data: [...] } or { data: { notifications: [...] } }
      const list =
        res?.data?.notifications ??
        res?.data ??
        res?.notifications ??
        [];

      const rawList = Array.isArray(list) ? list : [];
      setNotifications(normalise(rawList));
      setHasFetched(true);
      setCurrentPage(1);

      // Server unread count sync
      const serverCount = res?.data?.unreadCount ?? res?.unreadCount ?? null;
      if (typeof serverCount === 'number') {
        setServerUnreadCount(serverCount);
      }

      // hasMore comes from backend pagination metadata
      const pagination = res?.data?.pagination ?? res?.pagination ?? null;
      setHasMore(pagination?.hasMore ?? false);
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


  // ── Load More (append older pages, daysLimit=0) ────────────────────────────
  /**
   * Fetches the next page with daysLimit=0 (all-time) and APPENDS results.
   * Deduplicates by id to avoid duplicates if the 3-day window overlaps
   * with the all-time query on the same records.
   */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    const nextPage = currentPage + 1;
    setIsLoadingMore(true);

    try {
      const res = await fetchOlderNotifications({ page: nextPage, limit: 50 });

      const list =
        res?.data?.notifications ??
        res?.data ??
        res?.notifications ??
        [];

      const rawList = Array.isArray(list) ? list : [];
      const incoming = normalise(rawList);

      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const deduped = incoming.filter((n) => !existingIds.has(n.id));
        return [...prev, ...deduped];
      });

      setCurrentPage(nextPage);
      const pagination = res?.data?.pagination ?? res?.pagination ?? null;
      setHasMore(pagination?.hasMore ?? false);
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.error('[useNotifications] loadMore failed:', err);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, currentPage]);


  // ── Cancel in-flight request (call when panel closes) ─────────────────────
  const cancelFetch = useCallback(() => {
    abortRef.current?.abort();
    fetchingRef.current = false;
  }, []);

  // ── Mark single as read (optimistic) ──────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    const target = notifications.find((n) => n.id === id || n._id === id);
    const wasUnread = target && !target.isRead && target.status !== 'READ';

    // Optimistic update first
    setNotifications((prev) =>
      prev.map((n) => (n.id === id || n._id === id ? { ...n, status: 'READ', isRead: true } : n))
    );
    if (wasUnread) {
      setServerUnreadCount((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
    }

    try {
      await markNotificationRead(id);
      queryClient.invalidateQueries({ queryKey: ['notification-badge'] });
    } catch {
      // Rollback on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id || n._id === id ? { ...n, status: 'UNREAD', isRead: false } : n))
      );
      if (wasUnread) {
        setServerUnreadCount((prev) => (prev !== null ? prev + 1 : null));
      }
    }
  }, [notifications]);

  // ── Mark all as read (optimistic) ─────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    const previous = notifications;
    const previousUnread = serverUnreadCount;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, status: 'READ', isRead: true })));
    setServerUnreadCount(0);

    try {
      await markAllNotificationsRead();
      queryClient.invalidateQueries({ queryKey: ['notification-badge'] });
    } catch {
      // Rollback
      setNotifications(previous);
      setServerUnreadCount(previousUnread);
    }
  }, [notifications, serverUnreadCount]);

  // ── Delete single notification (optimistic) ───────────────────────────────
  /**
   * Instantly removes the item from the UI.
   * If the API call fails, the item is restored and the user sees it again.
   * Badge count is invalidated on success to keep the topbar in sync.
   */
  const deleteItem = useCallback(async (id) => {
    const previous = notifications;
    const previousUnread = serverUnreadCount;
    const target = notifications.find((n) => n.id === id || n._id === id);
    const wasUnread = target && !target.isRead && target.status !== 'READ';

    // Optimistic removal
    setNotifications((prev) => prev.filter((n) => n.id !== id && n._id !== id));
    if (wasUnread) {
      setServerUnreadCount((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
    }

    try {
      await deleteNotification(id);
      queryClient.invalidateQueries({ queryKey: ['notification-badge'] });
    } catch {
      // Rollback — restore previous state
      setNotifications(previous);
      setServerUnreadCount(previousUnread);
    }
  }, [notifications, serverUnreadCount]);

  // ── Delete ALL notifications (optimistic) ─────────────────────────────────
  const deleteAllItems = useCallback(async () => {
    const previous = notifications;
    const previousUnread = serverUnreadCount;

    // Optimistic clear
    setNotifications([]);
    setServerUnreadCount(0);

    try {
      await deleteAllNotifications();
      queryClient.invalidateQueries({ queryKey: ['notification-badge'] });
    } catch {
      // Rollback on failure
      setNotifications(previous);
      setServerUnreadCount(previousUnread);
    }
  }, [notifications, serverUnreadCount]);

  // ── Refresh ────────────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    loadNotifications({ force: true });
  }, [loadNotifications]);

  return {
    notifications,
    isLoading,
    isLoadingMore,
    hasError,
    hasFetched,
    hasMore,
    unreadCount,
    loadNotifications,
    cancelFetch,
    markAsRead,
    markAllAsRead,
    deleteItem,
    deleteAllItems,
    loadMore,
    refresh,
  };
};
