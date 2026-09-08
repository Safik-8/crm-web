import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
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
  MoreVertical,
} from 'lucide-react';
import { useNotificationHistory } from '../hooks/useNotificationHistory';
import PriorityBadge from '../components/PriorityBadge';
import ModuleBadge from '../components/ModuleBadge';
import NotificationSkeleton from '../components/NotificationSkeleton';
import { resolveNotificationActionUrl } from '../utils/resolveNotificationUrl';
import NotificationConfigModal from '../components/NotificationConfigModal';
import { useLoader } from '../../../shared/context/LoaderContext';

import PageHeader from '../../../shared/components/modules/PageHeader';
import SearchInput from '../../../shared/components/elements/SearchInput';
import SelectField from '../../../shared/components/elements/SelectField';
import Pagination from '../../../shared/components/elements/Pagination';

const NotificationRowActions = ({ n, isRead, navigate, handleMarkAsRead, handleDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
        title="Actions"
      >
        <MoreVertical size={16} />
      </button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        elevation={0}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          className: "mt-1 shadow-lg border border-slate-200 rounded-lg bg-white min-w-[160px] py-1 text-slate-700 font-sans"
        }}
      >
        {Boolean(n.actionUrl || n.leadId || n.relatedRecordId) && (
          <MenuItem
            onClick={() => {
              handleClose();
              if (!isRead) handleMarkAsRead(n.id);
              const targetUrl = resolveNotificationActionUrl(n);
              if (targetUrl) navigate(targetUrl);
            }}
            className="px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors text-slate-700"
            sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ExternalLink size={14} className="text-orange-500" />
            <span>View Related Record</span>
          </MenuItem>
        )}
        {!isRead && (
          <MenuItem
            onClick={() => {
              handleClose();
              handleMarkAsRead(n.id);
            }}
            className="px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors text-emerald-700"
            sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <CheckCheck size={14} className="text-emerald-600" />
            <span>Mark as Read</span>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            handleClose();
            handleDelete(n.id);
          }}
          className="px-3.5 py-2 text-xs font-semibold hover:bg-rose-50 transition-colors text-rose-600"
          sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Trash2 size={14} className="text-rose-500" />
          <span>Delete Notification</span>
        </MenuItem>
      </Menu>
    </>
  );
};

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

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'URGENT', label: 'Urgent' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
  ];

  const moduleOptions = [
    { value: '', label: 'All Modules' },
    { value: 'LEAD', label: 'Lead' },
    { value: 'FOLLOWUP', label: 'Follow-up' },
    { value: 'OPPORTUNITY', label: 'Opportunity' },
    { value: 'KPI', label: 'KPI / Target' },
    { value: 'REVENUE', label: 'Revenue' },
    { value: 'SYSTEM', label: 'System' },
  ];

  const scopeOptions = [
    { value: 'personal', label: 'Personal Inbox' },
    { value: 'company', label: 'Company Audit' },
    { value: 'branch', label: 'Branch Audit' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <PageHeader
        icon={Bell}
        iconClassName="bg-orange-50 text-orange-600 border border-orange-100"
        title="Notification History"
        description="Manage, search, and audit system notifications across all CRM events"
        actions={
          <button
            type="button"
            onClick={reload}
            className="p-2 text-slate-400 hover:text-orange-500 transition-colors focus:outline-none cursor-pointer"
            title="Refresh Data"
          >
            <RotateCcw size={14} />
          </button>
        }
      />

      {/* ── Search & Multi-Filters Toolbar ─────────────────────────────── */}
      <div className="bg-white p-3.5 border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search & Status Pills */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="w-full md:w-72">
              <SearchInput
                value={search}
                onChange={(val) => { setSearch(val); setPage(1); }}
                placeholder="Search by notification title..."
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 border border-slate-200 rounded-lg shrink-0">
              {['ALL', 'UNREAD', 'READ'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => { setStatus(st); setPage(1); }}
                  className={[
                    'px-3 py-1 text-xs font-bold transition-all capitalize rounded-md cursor-pointer',
                    status === st
                      ? 'bg-white text-slate-800 border border-slate-200/80 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700',
                  ].join(' ')}
                >
                  {st.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons: Event Rules & Export Excel */}
          <div className="flex items-center gap-2 shrink-0">
            {isSupervisor && (
              <button
                type="button"
                onClick={() => setIsConfigOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer h-[38px] rounded-lg"
              >
                <Settings2 size={14} />
                Event Rules
              </button>
            )}
            <button
              type="button"
              onClick={handleExport}
              disabled={notifications.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#F86F03] hover:bg-[#E06202] transition-colors disabled:opacity-50 cursor-pointer h-[38px] rounded-lg"
            >
              <Download size={14} />
              Export Excel
            </button>
          </div>
        </div>

        {/* Extended Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
          {/* Priority Select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
            <SelectField
              value={priority}
              onChange={(val) => { setPriority(val); setPage(1); }}
              options={priorityOptions}
              searchable={true}
            />
          </div>

          {/* Module Select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Module</label>
            <SelectField
              value={moduleName}
              onChange={(val) => { setModuleName(val); setPage(1); }}
              options={moduleOptions}
              searchable={true}
            />
          </div>

          {/* Scope Select (Supervisors only) */}
          {isSupervisor && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit Scope</label>
              <SelectField
                value={scope}
                onChange={(val) => { setScope(val); setPage(1); }}
                options={scopeOptions}
                searchable={true}
              />
            </div>
          )}

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-primary rounded-lg h-[38px]"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-primary rounded-lg h-[38px]"
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
      <div className="bg-white border border-slate-200 overflow-hidden">
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
                  <th className="py-3.5 px-4 w-28 text-center">Actions</th>
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

                      <td className="py-3.5 px-4 text-center">
                        <NotificationRowActions
                          n={n}
                          isRead={isRead}
                          navigate={navigate}
                          handleMarkAsRead={handleMarkAsRead}
                          handleDelete={handleDelete}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── PAGINATION CONTROLS ── */}
      {!isLoading && !isError && pagination && (
        <Pagination
          pagination={pagination}
          onPageChange={setPage}
          isLoading={isLoading}
          entityName="notifications"
        />
      )}

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

