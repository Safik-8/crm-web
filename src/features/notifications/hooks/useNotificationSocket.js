import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../../shared/hooks/useSocket';
import { useAuth } from '../../../app/providers/AuthProvider';
import { toast } from 'sonner';
import { queryClient } from '../../../lib/queryClient';

export const useNotificationSocket = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    // 1. Handle incoming real-time notifications
    const handleNewNotification = (notification) => {
      // If the notification was triggered by the current user themselves, skip popup toast
      // (local UI mutations already display their own direct action toast)
      const isSelfTriggered = notification.senderId && user?.id && Number(notification.senderId) === Number(user.id);

      if (!isSelfTriggered) {
        // Trigger SaaS-grade toast for alerts from other users, assignments, or background jobs
        toast(notification.title || 'New Notification', {
          description: notification.message,
          duration: 5000,
          action: notification.actionUrl ? {
            label: 'View',
            onClick: () => {
              navigate(notification.actionUrl);
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
  }, [socket, navigate]);
};

