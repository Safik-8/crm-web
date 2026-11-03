import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../../shared/hooks/useSocket';
import { useAuth } from '../../../app/providers/AuthProvider';
import { toast } from 'sonner';
import { queryClient } from '../../../lib/queryClient';
import { resolveNotificationActionUrl } from '../utils/resolveNotificationUrl';

export const useNotificationSocket = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    // 1. Handle incoming real-time notifications
    const handleNewNotification = (notification) => {
      // Check if notification was triggered by the current user
      const isSelfTriggered = Boolean(
        notification.senderId &&
        user?.id &&
        Number(notification.senderId) === Number(user.id)
      );

      // Suppress popup toasts for routine follow-up lifecycle events
      // (Schedule, Complete, Cancel) because local UI mutations already display
      // their own clean green toast. These notifications are still preserved in
      // the notification center drawer (bell icon).
      const isFollowupActionToast =
        notification.title === 'Follow-up Scheduled' ||
        notification.title === 'Follow-up Completed' ||
        notification.title === 'Follow-up Cancelled' ||
        notification.notificationType === 'FOLLOWUP_COMPLETED' ||
        (typeof notification.message === 'string' && (
          notification.message.startsWith('[SCHEDULED]') ||
          notification.message.startsWith('[COMPLETED]') ||
          notification.message.startsWith('[CANCELLED]')
        ));

      // Only display the floating SaaS toast for external/system alerts,
      // NOT for self-triggered actions or routine follow-up action broadcasts.
      if (!isSelfTriggered && !isFollowupActionToast) {
        const targetUrl = resolveNotificationActionUrl(notification);
        toast(notification.title || 'New Notification', {
          description: notification.message,
          duration: 5000,
          action: targetUrl ? {
            label: 'View',
            onClick: () => {
              navigate(targetUrl);
            },
          } : undefined,
        });
      }

      // Optimistically increment unread badge count (0ms UI latency)
      queryClient.setQueryData(['notification-badge'], (prev) => {
        const prevCount = typeof prev === 'number' ? prev : (prev?.unreadCount ?? 0);
        return { unreadCount: prevCount + 1 };
      });

      // Invalidate open drawer lists
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-history'] });
    };

    // 2. Handle direct unread count synchronizations from server
    const handleCountUpdate = ({ unreadCount }) => {
      if (typeof unreadCount === 'number') {
        queryClient.setQueryData(['notification-badge'], { unreadCount });
      }
    };

    // 3. Sync badge immediately on socket reconnect
    const handleReconnect = () => {
      queryClient.invalidateQueries({ queryKey: ['notification-badge'] });
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:count', handleCountUpdate);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:count', handleCountUpdate);
      socket.off('connect', handleReconnect);
    };
  }, [socket, user?.id, navigate]);
};
