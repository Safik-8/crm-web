import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Filter,
  Download,
  RotateCcw,
  CheckCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  Calendar,
  Inbox,
  Settings2,
} from 'lucide-react';
import { useNotificationHistory } from '../hooks/useNotificationHistory';
import PriorityBadge from '../components/PriorityBadge';
import ModuleBadge from '../components/ModuleBadge';
import NotificationSkeleton from '../components/NotificationSkeleton';
import NotificationConfigModal from '../components/NotificationConfigModal';
import { useLoader } from '../../../shared/context/LoaderContext';

const NotificationsPage = () => {
  const { forceHideLoader } = useLoader();
  const navigate = useNavigate();

  // Clear global loader on mount if left lingering
  useEffect(() => {
    forceHideLoader();
  }, [forceHideLoader]);

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const {
    notifications,
    pagination,
    isLoading,
    isError,
    filters,
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
    reload,
  } = useNotificationHistory();

  const {
    search, setSearch,
    status, setStatus,
    priority, setPriority,
    moduleName, setModuleName,
    scope, setScope,
    startDate, setStartDate,
    endDate, setEndDate,
    page, setPage,
  } = filters;

  const isAllSelected = notifications.length > 0 && selectedIds.length === notifications.length;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell size={20} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-heading">
                Notification History
              </h1>
              <p className="text-xs text-slate-500">
                Manage, search, and audit system notifications across all CRM events
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isSupervisor && (
            <button
              type="button"
              onClick={() => setIsConfigOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Settings2 size={14} />
              Event Rules
            </button>
          )}
          <button
            type="button"
            onClick={reload}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <RotateCcw size={14} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={notifications.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            Export Excel
          </button>
        </div>
      </div>

      {/* ── Search & Multi-Filters Toolbar ─────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by notification title or message..."
              className="w-full pl-10 pr-4 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            {['ALL', 'UNREAD', 'READ'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => { setStatus(st); setPage(1); }}
                className={[
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize',
                  status === st
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-slate-500 hover:text-slate-700',
                ].join(' ')}
              >
                {st.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Extended Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          {/* Priority Select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
            <select
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPage(1); }}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-primary"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Module Select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Module</label>
            <select
              value={moduleName}
              onChange={(e) => { setModuleName(e.target.value); setPage(1); }}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-primary"
            >
              <option value="">All Modules</option>
              <option value="LEAD">Lead</option>
              <option value="FOLLOWUP">Follow-up</option>
              <option value="OPPORTUNITY">Opportunity</option>
              <option value="KPI">KPI / Target</option>
              <option value="REVENUE">Revenue</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>

          {/* Scope Select (Supervisors only) */}
          {isSupervisor && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit Scope</label>
              <select
                value={scope}
                onChange={(e) => { setScope(e.target.value); setPage(1); }}
                className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-primary"
              >
                <option value="personal">Personal Inbox</option>
                <option value="company">Company Audit</option>
                <option value="branch">Branch Audit</option>
              </select>
            </div>
          )}

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full py-1 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-primary"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full py-1 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* ── Bulk Actions Banner ────────────────────────────────────────── */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/8 border border-primary/20 px-5 py-3 rounded-xl flex items-center justify-between gap-4 animate-fadeIn">
          <p className="text-xs font-semibold text-primary">
            {selectedIds.length} notification{selectedIds.length === 1 ? '' : 's'} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkSelectedAsRead}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-primary bg-white hover:bg-primary/5 rounded-lg border border-primary/30 transition-colors shadow-xs"
            >
              <CheckCheck size={14} />
              Mark Selected Read
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors shadow-xs"
            >
              <Trash2 size={14} />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* ── Notifications Data Table ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <NotificationSkeleton count={5} />
          </div>
        ) : isError ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700">Failed to load notification history</p>
            <button
              type="button"
              onClick={reload}
              className="px-4 py-2 text-xs font-bold text-white bg-primary rounded-xl"
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mx-auto">
              <Inbox size={26} />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No notifications found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search criteria or date filters to find older notification records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Title & Details</th>
                  <th className="py-3.5 px-4 w-28">Module</th>
                  <th className="py-3.5 px-4 w-24">Priority</th>
                  <th className="py-3.5 px-4 w-36">Date & Time</th>
                  <th className="py-3.5 px-4 w-24">Status</th>
                  <th className="py-3.5 px-4 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {notifications.map((n) => {
                  const isRead = n.isRead || n.status === 'READ';
                  const isSelected = selectedIds.includes(n.id);
                  return (
                    <tr
                      key={n.id}
                      className={[
                        'transition-colors hover:bg-slate-50/80',
                        isSelected ? 'bg-primary/4' : isRead ? 'bg-white' : 'bg-primary/2 font-semibold',
                      ].join(' ')}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(n.id)}
                          className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4 space-y-0.5 max-w-md">
                        <div className="flex items-center gap-1.5">
                          <span className={`block text-xs truncate ${isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                            {n.title || 'Notification'}
                          </span>
                          {!isRead && (
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                          {n.message}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <ModuleBadge moduleName={n.moduleName || 'SYSTEM'} />
                      </td>

                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={n.priority || 'MEDIUM'} />
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${isRead ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                          {isRead ? 'Read' : 'Unread'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {n.actionUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!isRead) handleMarkAsRead(n.id);
                                navigate(n.actionUrl);
                              }}
                              title="View related record"
                              className="p-1 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                              <ExternalLink size={14} />
                            </button>
                          )}
                          {!isRead && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(n.id)}
                              title="Mark as read"
                              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <CheckCheck size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(n.id)}
                            title="Delete notification"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination Footer ───────────────────────────────────────────── */}
        {!isLoading && !isError && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <p className="text-xs text-slate-500 font-medium">
              Showing page <span className="font-bold text-slate-700">{pagination.page}</span> of{' '}
              <span className="font-bold text-slate-700">{pagination.totalPages}</span> ({pagination.total} records)
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-xs"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-xs"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Event Configuration Modal for Supervisors */}
      {isSupervisor && (
        <NotificationConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationsPage;

