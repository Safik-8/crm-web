import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../../shared/hooks/useSocket';
import { toast } from 'sonner';
import { queryClient } from '../../../lib/queryClient';

export const useNotificationSocket = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      // 1. Trigger Sonner toast popup
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

      // 2. Invalidate TanStack Query caches so UI updates in real-time
      queryClient.invalidateQueries({ queryKey: ['notification-badge'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-history'] });
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, navigate]);
};

