import { useState, useCallback, useEffect } from 'react';
import {
  fetchNotificationHistory,
  markNotificationRead,
  deleteNotification,
  markAllNotificationsRead,
  deleteAllNotifications,
} from '../services/notificationService';
import { useAuth } from '../../../app/providers/AuthProvider';
import * as XLSX from 'xlsx';

export const useNotificationHistory = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination]       = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading]         = useState(true);
  const [isError, setIsError]             = useState(false);

  // Filters state
  const [search, setSearch]         = useState('');
  const [status, setStatus]         = useState('ALL');
  const [priority, setPriority]     = useState('');
  const [moduleName, setModuleName] = useState('');
  const [scope, setScope]           = useState('personal');
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');
  const [page, setPage]             = useState(1);

  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);

  const isSupervisor = (user?.primaryRoleRank ?? 0) >= 60;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetchNotificationHistory({
        page,
        limit: 20,
        status,
        priority: priority || undefined,
        moduleName: moduleName || undefined,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        scope,
      });

      const list = res?.data?.notifications ?? res?.notifications ?? [];
      const pag  = res?.data?.pagination ?? res?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 };

      setNotifications(Array.isArray(list) ? list : []);
      setPagination(pag);
      setSelectedIds([]);
    } catch (err) {
      console.error('[useNotificationHistory] Fetch failed:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [page, status, priority, moduleName, search, startDate, endDate, scope]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Bulk Selection Toggles
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n.id));
    }
  }, [notifications, selectedIds]);

  const toggleSelectOne = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  // Single Actions
  const handleMarkAsRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, status: 'READ' } : n))
    );
    try {
      await markNotificationRead(id);
    } catch {
      loadData();
    }
  }, [loadData]);

  const handleDelete = useCallback(async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotification(id);
    } catch {
      loadData();
    }
  }, [loadData]);

  // Bulk Actions
  const handleMarkSelectedAsRead = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setNotifications((prev) =>
      prev.map((n) => (selectedIds.includes(n.id) ? { ...n, isRead: true, status: 'READ' } : n))
    );
    try {
      await Promise.all(selectedIds.map((id) => markNotificationRead(id)));
    } catch {
      loadData();
    }
  }, [selectedIds, loadData]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
    try {
      await Promise.all(selectedIds.map((id) => deleteNotification(id)));
    } catch {
      loadData();
    }
  }, [selectedIds, loadData]);

  const handleMarkAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, status: 'READ' })));
    try {
      await markAllNotificationsRead();
    } catch {
      loadData();
    }
  }, [loadData]);

  const handleClearAll = useCallback(async () => {
    setNotifications([]);
    try {
      await deleteAllNotifications();
    } catch {
      loadData();
    }
  }, [loadData]);

  // Export to Excel / CSV using xlsx
  const handleExport = useCallback(() => {
    if (notifications.length === 0) return;
    const exportData = notifications.map((n) => ({
      ID: n.id,
      Title: n.title || 'Notification',
      Message: n.message,
      Type: n.notificationType,
      Module: n.moduleName || 'SYSTEM',
      Priority: n.priority || 'MEDIUM',
      Status: n.isRead ? 'READ' : 'UNREAD',
      'Created At': n.createdAt ? new Date(n.createdAt).toLocaleString() : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Notification History');
    XLSX.writeFile(workbook, `Notification_History_${new Date().toISOString().slice(0,10)}.xlsx`);
  }, [notifications]);

  return {
    notifications,
    pagination,
    isLoading,
    isError,
    filters: {
      search, setSearch,
      status, setStatus,
      priority, setPriority,
      moduleName, setModuleName,
      scope, setScope,
      startDate, setStartDate,
      endDate, setEndDate,
      page, setPage,
    },
    selectedIds,
    toggleSelectAll,
    toggleSelectOne,
    handleMarkAsRead,
    handleDelete,
    handleMarkSelectedAsRead,
    handleDeleteSelected,
    handleMarkAllRead,
    handleClearAll,
    handleExport,
    isSupervisor,
    reload: loadData,
  };
};
