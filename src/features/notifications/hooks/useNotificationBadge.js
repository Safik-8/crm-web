import { useQuery } from '@tanstack/react-query';
import { fetchUnreadCount } from '../services/notificationService';
import { useSocket } from '../../../shared/hooks/useSocket';

/**
 * useNotificationBadge Hook
 * Tier-1 Production Event-Driven Pattern:
 * - When WebSocket is connected: Zero polling overhead; updates are pushed directly via WebSockets.
 * - When WebSocket is disconnected: Graceful lazy fallback interval (120s).
 */
export const useNotificationBadge = () => {
  const { isConnected } = useSocket();

  const { data } = useQuery({
    queryKey: ['notification-badge'],
    queryFn: () => fetchUnreadCount(),
    staleTime: Infinity, // Pure event-driven updates while socket is connected
    refetchInterval: isConnected ? false : 120_000, // 2-minute fallback only if disconnected
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false,
    select: (res) => (typeof res === 'number' ? res : (res?.data?.unreadCount ?? res?.unreadCount ?? 0)),
  });

  return { unreadCount: typeof data === 'number' ? data : (data?.unreadCount ?? 0) };
};
