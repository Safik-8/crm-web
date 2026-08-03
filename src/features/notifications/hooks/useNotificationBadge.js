import { useQuery } from '@tanstack/react-query';
import { fetchUnreadCount } from '../services/notificationService';

export const useNotificationBadge = () => {
  const { data } = useQuery({
    queryKey:  ['notification-badge'],
    queryFn:   () => fetchUnreadCount(),
    staleTime:               5_000,   // 5 seconds
    refetchInterval:         15_000,  // poll every 15s

    refetchIntervalInBackground: false,
    retry: false,
    select: (res) => res?.data?.unreadCount ?? res?.unreadCount ?? 0,
  });

  return { unreadCount: data ?? 0 };
};
