import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ClipboardList, 
  ShieldAlert, 
  Download, 
  RotateCcw, 
  Eye, 
  Activity, 
  Lock, 
  FileText, 
  UserCheck, 
  Calendar, 
  Filter, 
  RefreshCw,
  Globe,
  Laptop,
  Building2,
  Clock,
  User,
  ShieldCheck,
  Tag,
  FileSpreadsheet,
  FileCode,
  Cpu,
  Server
} from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import { toast, enhancedToast } from '../../../shared/utils/toast';
import { getAuditLogsApi, getAuditLogByIdApi, exportAuditLogsApi } from '../../../api/auditApi';
import { companyService } from '../../company/services/companyService';
import { useFormatters } from '../../../shared/hooks/useFormatters';

// Shared UI components from shared/components
import PageHeader from '../../../shared/components/modules/PageHeader';
import Table from '../../../shared/components/elements/Table';
import Button from '../../../shared/components/elements/Button';
import Pagination from '../../../shared/components/elements/Pagination';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import Drawer from '../../../shared/components/elements/Drawer';
import Skeleton from '../../../shared/components/elements/Skeleton';
import SearchInput from '../../../shared/components/elements/SearchInput';
import SelectField from '../../../shared/components/elements/SelectField';

// Searchable Module Options
const MODULE_OPTIONS = [
  { value: 'AUTH', label: 'Authentication (AUTH)' },
  { value: 'USER', label: 'User Management' },
  { value: 'SECURITY', label: 'Role & Permissions (RBAC)' },
  { value: 'ORGANIZATION', label: 'Company & Branch' },
  { value: 'TEAM', label: 'Team Management' },
  { value: 'LEAD', label: 'Lead & Pipeline' },
  { value: 'FOLLOWUP', label: 'Followup & Activity' },
  { value: 'SALES', label: 'Sales, Opportunity & Deals' },
  { value: 'KPI', label: 'KPI System' },
  { value: 'REPORT', label: 'Reports & Exports' },
  { value: 'SETTINGS', label: 'System Settings' },
];

// Standardized Action Type Options (With legacy AUTH mapping)
const ACTION_TYPE_OPTIONS = [
  { value: 'CREATE', label: 'CREATE (New Record)' },
  { value: 'UPDATE', label: 'UPDATE (Modified)' },
  { value: 'DELETE', label: 'DELETE (Removed)' },
  { value: 'LOGIN', label: 'LOGIN (User Login)' },
  { value: 'LOGOUT', label: 'LOGOUT (User Logout)' },
  { value: 'AUTH', label: 'AUTH (Legacy Auth)' },
  { value: 'EXPORT', label: 'EXPORT (Data Download)' },
  { value: 'SETTINGS', label: 'SETTINGS (Config Change)' },
];

// Date Range Presets for Export
const EXPORT_DATE_RANGE_OPTIONS = [
  { value: '1d', label: 'Last 1 Day' },
  { value: '1w', label: 'Last 1 Week' },
  { value: '3m', label: 'Last 3 Months' },
  { value: '6m', label: 'Last 6 Months' },
  { value: '1y', label: 'Last 1 Year' },
  { value: 'custom', label: 'Custom Range' },
];

// Export File Format Options
const EXPORT_FORMAT_OPTIONS = [
  { value: 'excel', label: 'Excel Spreadsheet (.xlsx)' },
  { value: 'csv', label: 'CSV File (.csv)' },
  { value: 'pdf', label: 'Printable Security PDF (.pdf)' },
];

// Rows per page select options using shared SelectField
const ROWS_PER_PAGE_OPTIONS = [
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
];

// Crash-safe JSON stringifier helper
const safeJsonFormat = (val, defaultMessage) => {
  if (!val || (typeof val === 'object' && Object.keys(val).length === 0)) {
    return `// ${defaultMessage}`;
  }
  try {
    return typeof val === 'string' ? val : JSON.stringify(val, null, 2);
  } catch (e) {
    return String(val);
  }
};

const AuditPage = () => {
  const { user } = useAuth();
  const { forceHideLoader } = useLoader();
  const { formatDate, formatDateTime } = useFormatters();

  // Role Checks
  const userRole = (
    user?.primaryRole || 
    user?.role || 
    user?.roleName || 
    user?.userRoles?.find((ur) => ur?.isPrimary)?.role?.name || 
    user?.userRoles?.[0]?.role?.name || 
    ''
  ).toUpperCase().replace(/\s+/g, '_');

  const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const isCompanyAdmin = userRole === 'COMPANY_ADMIN' || userRole === 'COMPANY_MANAGER';
  const hasAccess = isSuperAdmin || isCompanyAdmin;

  // Filter State
  const [filters, setFilters] = useState({
    search: '',
    companyId: '',
    moduleName: '',
    actionType: '',
    startDate: '',
    endDate: '',
    ipAddress: '',
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Companies state for Super Admin dropdown
  const [companies, setCompanies] = useState([]);

  // Data & Loading State
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Right Side Drawer State
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Export Drawer State
  const [isExportDrawerOpen, setIsExportDrawerOpen] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportFilters, setExportFilters] = useState({
    dateRange: '1w',
    startDate: '',
    endDate: '',
    companyId: '',
    moduleName: '',
    actionType: '',
    format: 'excel',
  });

  // Auto hide loader on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      forceHideLoader();
    }, 100);
    return () => clearTimeout(timer);
  }, [forceHideLoader]);

  // Load Companies list for Super Admin
  useEffect(() => {
    if (isSuperAdmin) {
      companyService.getCompaniesRaw()
        .then((res) => {
          const rawData = res.data?.data || res.data || [];
          setCompanies(Array.isArray(rawData) ? rawData : []);
        })
        .catch((err) => {
          console.error('Failed to load companies:', err);
        });
    }
  }, [isSuperAdmin]);

  // Fetch Audit Logs Function (Supports Partial & Range Date Filtering: Only Start, Only End, or Both)
  const fetchAuditLogs = useCallback(async () => {
    if (!hasAccess) return;

    setLoading(true);
    try {
      const query = {
        page,
        limit,
        companyId: isSuperAdmin ? (filters.companyId || undefined) : undefined,
        search: filters.search || undefined,
        moduleName: filters.moduleName || undefined,
        actionType: filters.actionType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        ipAddress: filters.ipAddress || undefined,
      };

      const res = await getAuditLogsApi(query);
      if (res?.success) {
        setLogs(res.data || []);
        setPagination(res.pagination || { total: 0, totalPages: 1 });
      } else {
        setLogs([]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [hasAccess, isSuperAdmin, page, limit, filters]);

  // Fetch on filter or page change
  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Handle Search / Filter Change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  // Handle Date Filter Change with Chronology Validation
  const handleDateChange = (type, val) => {
    if (type === 'startDate') {
      if (val && filters.endDate && new Date(val) > new Date(filters.endDate)) {
        toast.error('Start date cannot be after end date.');
        return;
      }
      setFilters((prev) => ({ ...prev, startDate: val }));
    } else if (type === 'endDate') {
      if (val && filters.startDate && new Date(val) < new Date(filters.startDate)) {
        toast.error('End date cannot be earlier than start date.');
        return;
      }
      setFilters((prev) => ({ ...prev, endDate: val }));
    }
    setPage(1);
  };

  // Handle Company Filter Change
  const handleCompanyChange = (companyIdVal) => {
    setFilters((prev) => ({
      ...prev,
      companyId: companyIdVal,
    }));
    setPage(1);
  };

  // Reset All Filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      companyId: '',
      moduleName: '',
      actionType: '',
      startDate: '',
      endDate: '',
      ipAddress: '',
    });
    setPage(1);
  };

  // View Detail Right-Side Drawer
  const handleViewDetail = async (logId) => {
    setIsDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res = await getAuditLogByIdApi(logId);
      if (res?.success) {
        setSelectedLog(res.data);
      }
    } catch (err) {
      toast.error('Failed to fetch audit log detail');
    } finally {
      setDrawerLoading(false);
    }
  };

  // Export Audit Logs Reports with Drawer Filters
  const handleExportSubmit = async () => {
    if (!isSuperAdmin) {
      toast.error('Access Denied: Exporting audit log reports is strictly restricted to Super Admin.');
      return;
    }

    if (exportFilters.dateRange === 'custom') {
      if (!exportFilters.startDate || !exportFilters.endDate) {
        setExportError('Custom date range requires both start date and end date.');
        return;
      }
    }

    setExportError('');
    setExporting(true);

    try {
      const format = exportFilters.format || 'excel';
      const params = {
        dateRange: exportFilters.dateRange,
        moduleName: exportFilters.moduleName || undefined,
        actionType: exportFilters.actionType || undefined,
      };

      if (exportFilters.dateRange === 'custom') {
        params.startDate = exportFilters.startDate;
        params.endDate = exportFilters.endDate;
      }

      if (isSuperAdmin) {
        if (exportFilters.companyId) {
          params.companyId = exportFilters.companyId;
        } else if (filters.companyId) {
          params.companyId = filters.companyId;
        }
      }

      const response = await exportAuditLogsApi(params, format);

      let mimeType = 'text/csv';
      let ext = 'csv';
      if (format === 'excel' || format === 'xlsx') {
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        ext = 'xlsx';
      } else if (format === 'pdf') {
        mimeType = 'text/html';
        ext = 'html';
      }

      // Build descriptive filename from active export filters
      const today = new Date().toISOString().slice(0, 10); // e.g. 2026-08-27

      // Date range label for filename
      const dateRangeLabels = {
        '1d': 'last_1_day',
        '1w': 'last_1_week',
        '3m': 'last_3_months',
        '6m': 'last_6_months',
        '1y': 'last_1_year',
        'custom': exportFilters.startDate && exportFilters.endDate
          ? `${exportFilters.startDate}_to_${exportFilters.endDate}`
          : 'custom_range',
      };
      const dateLabel = dateRangeLabels[exportFilters.dateRange] || 'all';

      // Optional filter segments
      const moduleSegment = exportFilters.moduleName ? `_${exportFilters.moduleName.toLowerCase()}` : '';
      const actionSegment = exportFilters.actionType ? `_${exportFilters.actionType.toLowerCase()}` : '';

      // Company segment — look up name from companyOptions list
      let companySegment = '';
      if (exportFilters.companyId) {
        const selectedCompany = companyOptions.find((c) => String(c.value) === String(exportFilters.companyId));
        if (selectedCompany?.label) {
          companySegment = `_${selectedCompany.label.toLowerCase().replace(/\s+/g, '_')}`;
        }
      }

      const filename = `audit_logs${companySegment}${moduleSegment}${actionSegment}_${dateLabel}_${today}.${ext}`;

      const blob = new Blob([response.data || response], { type: mimeType });

      // All formats: direct file download (no new window or print dialog)
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      let formatLabel = 'Excel (.xlsx)';
      if (format === 'csv') formatLabel = 'CSV (.csv)';
      else if (format === 'pdf') formatLabel = 'PDF Report (.html)';

      toast.success(`Audit logs downloaded as ${formatLabel} — ${filename}`);
      setIsExportDrawerOpen(false);
    } catch (err) {
      let msg = 'Failed to export audit log report';
      if (err.response?.data) {
        if (err.response.data instanceof Blob) {
          try {
            const text = await err.response.data.text();
            const parsed = JSON.parse(text);
            msg = parsed.message || parsed.error || msg;
          } catch (e) {
            // text parsing fallback
          }
        } else if (typeof err.response.data === 'string') {
          try {
            const parsed = JSON.parse(err.response.data);
            msg = parsed.message || msg;
          } catch (e) {
            msg = err.response.data;
          }
        } else if (err.response.data.message) {
          msg = err.response.data.message;
        }
      } else if (err.message) {
        msg = err.message;
      }

      setExportError(msg);
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  };

  // Action Badges with Pill Styling & Human-Readable Code Rendering
  const getActionBadge = (actionType, actionCode) => {
    const typeUpper = (actionType || 'UPDATE').toUpperCase().trim();
    const typeLower = typeUpper.toLowerCase();
    let bg = 'bg-slate-100 text-slate-700 border-slate-200';
    
    if (typeLower === 'create') bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (typeLower === 'update') bg = 'bg-blue-50 text-blue-700 border-blue-200';
    if (typeLower === 'delete') bg = 'bg-red-50 text-red-700 border-red-200';
    if (typeLower === 'auth' || typeLower === 'login' || typeLower === 'logout') bg = 'bg-purple-50 text-purple-700 border-purple-200';
    if (typeLower === 'export') bg = 'bg-amber-50 text-amber-700 border-amber-200';

    // Readable label mapping for standard action codes
    let displayCode = actionCode || 'EVENT';
    const codeUpper = displayCode.toUpperCase().trim();

    if (codeUpper === typeUpper || codeUpper === 'UPDATE' || codeUpper === 'RECORD_UPDATED') {
      if (typeUpper === 'CREATE') displayCode = 'New Record';
      else if (typeUpper === 'UPDATE') displayCode = 'Record Update';
      else if (typeUpper === 'DELETE') displayCode = 'Record Deleted';
      else if (typeUpper === 'LOGIN') displayCode = 'User Login';
      else if (typeUpper === 'LOGOUT') displayCode = 'User Logout';
      else if (typeUpper === 'EXPORT') displayCode = 'Data Exported';
      else if (typeUpper === 'AUTH') displayCode = 'Authentication';
      else displayCode = `${typeUpper} Event`;
    } else if (codeUpper === 'RECORD_CREATED') {
      displayCode = 'New Record';
    } else if (codeUpper === 'RECORD_DELETED') {
      displayCode = 'Record Deleted';
    } else if (codeUpper === 'LOGIN_SUCCESS') {
      displayCode = 'User Login';
    } else if (codeUpper === 'USER_LOGOUT') {
      displayCode = 'User Logout';
    } else if (codeUpper === 'DATA_EXPORTED') {
      displayCode = 'Data Exported';
    } else if (codeUpper === 'SYSTEM_EVENT') {
      displayCode = 'System Process';
    } else {
      // Convert snake_case or SCREAMING_SNAKE to Title Case
      displayCode = displayCode
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase());
    }

    return (
      <div className="flex flex-col gap-0.5">
        <span className={`px-2 py-0.5 text-[10px] font-semibold border uppercase tracking-wider w-fit rounded-md ${bg}`}>
          {typeUpper}
        </span>
        <span className="text-xs font-medium text-slate-700 tracking-tight truncate max-w-[170px]" title={displayCode}>
          {displayCode}
        </span>
      </div>
    );
  };

  // Options formatted for Company dropdown
  const companyOptions = useMemo(
    () => companies.map((c) => ({ value: c.id, label: c.name })),
    [companies]
  );

  // Table Columns Definition (1st Column: Company for Super Admin, 2nd Column: User / Actor)
  const columns = useMemo(() => {
    const cols = [];

    // 1ST COLUMN (SUPER ADMIN ONLY): Company Column
    if (isSuperAdmin) {
      cols.push({
        header: 'Company',
        isActionColumn: false,
        className: 'w-[140px]',
        headerClassName: 'w-[140px]',
        cell: (row) => (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 border border-slate-200 rounded-md">
            {row.company?.name || 'Global / System'}
          </span>
        ),
      });
    }

    // 2ND COLUMN: User / Actor
    cols.push({
      header: 'User / Actor',
      isActionColumn: false,
      className: 'min-w-[220px]',
      headerClassName: 'min-w-[220px]',
      cell: (row) => {
        const isSystem = !row.performedBy;
        return (
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs overflow-hidden shrink-0 border ${
              isSystem ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}>
              {isSystem ? (
                <Cpu size={15} />
              ) : row.performedBy?.profilePhoto ? (
                <img src={row.performedBy.profilePhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                row.performedBy?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-800 truncate flex items-center gap-1">
                {row.performedBy?.name || 'System Event'}
              </span>
              <span className="text-[11px] text-slate-500 font-normal truncate">
                {row.performedBy?.email || 'system@crm.internal'}
              </span>
            </div>
          </div>
        );
      },
    });

    // SUBSEQUENT COLUMNS: Module, Action, Date & Time, IP Address, Device & Browser, Actions
    cols.push(
      {
        header: 'Module',
        isActionColumn: false,
        className: 'w-[120px]',
        headerClassName: 'w-[120px]',
        cell: (row) => (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 border border-slate-200 rounded-md">
            {row.moduleName || 'SYSTEM'}
          </span>
        ),
      },
      {
        header: 'Action',
        isActionColumn: false, // Prevents Table.jsx from applying sticky right-0 border-l line!
        className: 'w-[170px]',
        headerClassName: 'w-[170px]',
        cell: (row) => getActionBadge(row.actionType, row.action),
      },
      {
        header: 'Date & Time',
        isActionColumn: false,
        className: 'w-[160px]',
        headerClassName: 'w-[160px]',
        cell: (row) => (
          <div className="flex flex-col text-xs text-slate-700">
            <span className="font-semibold text-slate-800">{formatDate(row.createdAt)}</span>
            <span className="text-slate-500 font-mono text-[11px] font-normal">{new Date(row.createdAt).toLocaleTimeString()}</span>
          </div>
        ),
      },
      {
        header: 'IP Address',
        isActionColumn: false,
        className: 'w-[140px]',
        headerClassName: 'w-[140px]',
        cell: (row) => {
          // Show "Internal System" only when IP is literally stored as "SYSTEM" (pure background process)
          // Anonymous HTTP requests may have performedBy=null but still have a real IP
          const isSystemIp = row.ipAddress === 'SYSTEM';
          const displayIp = isSystemIp ? 'Internal System' : (row.ipAddress || 'Unknown');
          return (
            <span className={`text-xs font-mono font-medium px-2.5 py-1 border rounded-md ${
              isSystemIp
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : row.ipAddress === 'Localhost'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              {displayIp}
            </span>
          );
        },
      },
      {
        header: 'Device & Browser',
        isActionColumn: false,
        className: 'min-w-[180px]',
        headerClassName: 'min-w-[180px]',
        cell: (row) => {
          const isSystem = !row.performedBy || row.deviceInfo === 'SYSTEM' || row.browserInfo === 'SYSTEM' || row.deviceInfo === 'System Process' || row.browserInfo === 'System Process';
          if (isSystem) {
            return (
              <span className="text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit">
                <Server size={12} />
                <span>System Process</span>
              </span>
            );
          }
          return (
            <div className="flex flex-col text-xs text-slate-600 gap-0.5 min-w-0">
              <span className="text-slate-800 font-semibold truncate max-w-[150px]">{row.deviceInfo || 'Unknown Device'}</span>
              <span className="text-[11px] text-slate-500 font-normal truncate max-w-[150px]">{row.browserInfo || 'Unknown Browser'}</span>
            </div>
          );
        },
      },
      {
        header: 'Actions',
        isActionColumn: true,
        className: 'w-[90px]',
        headerClassName: 'w-[90px]',
        cell: (row) => (
          <button
            type="button"
            onClick={() => handleViewDetail(row.id)}
            className="px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition-all flex items-center gap-1.5 border border-primary/30 bg-primary/5 rounded-lg"
            title="View Details"
          >
            <Eye size={13} />
            <span>View</span>
          </button>
        ),
      }
    );

    return cols;
  }, [isSuperAdmin]);

  // Access Denied View
  if (!hasAccess) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 p-8 text-center shadow-lg rounded-2xl">
          <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-slate-600 text-sm mb-6">
            Audit logging & activity monitoring is strictly restricted to <span className="text-red-600 font-semibold">Super Admin</span> and <span className="text-red-600 font-semibold">Company Admin</span> roles.
          </p>
          <Button variant="secondary" onClick={() => window.history.back()} className="mx-auto">
            Return to Safety
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── UNIFORM CRM PAGE HEADER ── */}
      <PageHeader
        icon={ClipboardList}
        title="Audit Logs & Activity Monitor"
        description="Enterprise security trail recording real-time data mutations, user access, and system configurations."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchAuditLogs()}
              disabled={loading}
              className="flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-2xs"
              title="Refresh Audit Logs"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            {/* SUPER ADMIN ONLY: Export Report Button (Opens Right-Side Export Filter Drawer) */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => {
                  setExportError('');
                  setIsExportDrawerOpen(true);
                }}
                disabled={exporting}
                className="flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-xs active:scale-95 disabled:opacity-50"
                title="Export Audit Logs Report"
              >
                <Download size={14} />
                <span>Export Report</span>
              </button>
            )}
          </div>
        }
      />

      {/* ── KPI METRICS OVERVIEW CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Recorded Logs</p>
            <p className="text-xl font-semibold text-slate-900 mt-0.5">{pagination.total.toLocaleString()}</p>
          </div>
          <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg">
            <Activity size={18} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Scope Access</p>
            <p className="text-sm font-semibold text-emerald-600 mt-0.5">
              {isSuperAdmin ? 'All Companies' : (user?.company?.name || user?.companyName || logs?.[0]?.company?.name || 'Company Access')}
            </p>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg">
            <UserCheck size={18} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Current Page</p>
            <p className="text-xl font-semibold text-slate-900 mt-0.5">
              {page} / {pagination.totalPages}
            </p>
          </div>
          <div className="p-2.5 bg-purple-50 border border-purple-200 text-purple-600 rounded-lg">
            <Calendar size={18} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Audit Security Stream</p>
            <p className="text-sm font-semibold mt-0.5 text-emerald-600">
              Real-time Active
            </p>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg">
            <ShieldCheck size={18} />
          </div>
        </div>
      </div>

      {/* ── SEPARATE FILTER & SEARCH CARD (WITH VISUAL SPACING) ── */}
      <div className="bg-white border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Row 1: Search Input & Reset Button */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          <SearchInput
            value={filters.search}
            onChange={(val) => handleFilterChange('search', val)}
            placeholder="Search action, IP, or user..."
            className="w-full flex-1"
          />
          {hasAccess && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 h-9 px-3 text-xs font-semibold text-slate-500 hover:text-primary transition-colors shrink-0"
            >
              <RotateCcw size={14} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Divider Line */}
        <div className="border-t border-slate-100" />

        {/* Row 2: Aligned Filter Controls (flex items-end ensures pixel-perfect bottom baseline alignment) */}
        <div className="flex flex-wrap items-end gap-2.5">
          {/* Filters Badge */}
          <div className="flex items-center gap-1.5 h-[38px] px-3.5 bg-slate-100/70 border border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider shrink-0 rounded-xl">
            <Filter size={14} className="text-primary" />
            <span>Filters</span>
          </div>

          {/* SUPER ADMIN ONLY FILTER: Company Dropdown */}
          {isSuperAdmin && (
            <div className="flex-1 min-w-[160px] sm:max-w-[200px]">
              <SelectField
                id="companyFilter"
                value={filters.companyId}
                onChange={handleCompanyChange}
                options={companyOptions}
                placeholder="All Companies"
                allowEmptyOption={true}
                searchable={true}
              />
            </div>
          )}

          {/* Searchable Module Dropdown */}
          <div className="flex-1 min-w-[160px] sm:max-w-[200px]">
            <SelectField
              id="moduleFilter"
              value={filters.moduleName}
              onChange={(val) => handleFilterChange('moduleName', val)}
              options={MODULE_OPTIONS}
              placeholder="All Modules"
              allowEmptyOption={true}
              searchable={true}
            />
          </div>

          {/* Searchable Action Type Dropdown */}
          <div className="flex-1 min-w-[160px] sm:max-w-[200px]">
            <SelectField
              id="actionTypeFilter"
              value={filters.actionType}
              onChange={(val) => handleFilterChange('actionType', val)}
              options={ACTION_TYPE_OPTIONS}
              placeholder="All Action Types"
              allowEmptyOption={true}
              searchable={true}
            />
          </div>

          {/* IP Address Filter Input */}
          <div className="flex-1 min-w-[140px] sm:max-w-[170px]">
            <input
              type="text"
              placeholder="IP Address..."
              value={filters.ipAddress}
              onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
              className="w-full h-[38px] px-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[12px] text-slate-800 font-semibold outline-none hover:bg-slate-100 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all placeholder:text-slate-400 font-normal"
            />
          </div>

          {/* Start Date Input */}
          <div className="flex-1 min-w-[140px] sm:max-w-[160px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              max={filters.endDate || undefined}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="w-full h-[38px] px-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[12px] text-slate-800 font-semibold outline-none hover:bg-slate-100 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
            />
          </div>

          {/* End Date Input */}
          <div className="flex-1 min-w-[140px] sm:max-w-[160px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              min={filters.startDate || undefined}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="w-full h-[38px] bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 text-[12px] text-slate-800 font-semibold outline-none hover:bg-slate-100 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── SEPARATE AUDIT LOG TABLE CARD ── */}
      <section className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div>
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full bg-slate-100" />
              <Skeleton className="h-10 w-full bg-slate-50" />
              <Skeleton className="h-10 w-full bg-slate-50" />
              <Skeleton className="h-10 w-full bg-slate-50" />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
                <ClipboardList size={28} />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No Audit Logs Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                There are no audit records matching your current search or date range filters.
              </p>
            </div>
          ) : (
            <Table columns={columns} data={logs} onRowClick={(row) => handleViewDetail(row.id)} />
          )}

          {/* Pagination Footer */}
          {logs.length > 0 && (
            <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Left Side: Rows per page selector using shared SelectField (opens UPWARDS/TOP) */}
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span>Rows per page:</span>
                <div className="w-20 relative [&_.absolute]:bottom-full [&_.absolute]:top-auto [&_.absolute]:mb-2 [&_.absolute]:mt-0">
                  <SelectField
                    id="rowsPerPageSelect"
                    value={String(limit)}
                    onChange={(val) => {
                      setLimit(Number(val));
                      setPage(1);
                    }}
                    options={ROWS_PER_PAGE_OPTIONS}
                    allowEmptyOption={false}
                    searchable={false}
                  />
                </div>
              </div>

              {/* Right Side: Page navigation controls & Record summary */}
              <div className="flex items-center gap-4">
                <Pagination
                  pagination={{
                    page,
                    totalPages: pagination.totalPages,
                    total: pagination.total,
                    limit
                  }}
                  onPageChange={(newPage) => setPage(newPage)}
                  entityName="records"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── SHARED RIGHT-SIDE SLIDE-OVER DRAWER (EXACT DRAWER USED IN LEADS PAGE) ── */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Audit Log Details"
        subtitle={selectedLog ? `Log ID #${selectedLog.id} • Action Code: ${selectedLog.action}` : 'Inspect activity details'}
        icon={ClipboardList}
        showFooter={true}
        showSubmit={false}
        cancelText="Close Details"
        width={{ xs: '100%', sm: 540 }}
      >
        {drawerLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full bg-slate-100" />
            <Skeleton className="h-32 w-full bg-slate-100" />
            <Skeleton className="h-32 w-full bg-slate-100" />
          </div>
        ) : selectedLog ? (
          <div className="space-y-5 py-2">
            {/* Event Header Banner Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 flex items-center justify-between rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center font-bold">
                  <Activity size={20} />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Action Event Code</span>
                  <span className="text-base font-bold text-slate-900 font-mono">{selectedLog.action}</span>
                </div>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 border border-primary/20 rounded-md">
                {selectedLog.moduleName || 'SYSTEM'}
              </span>
            </div>

            {/* Metadata Summary Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-white border border-slate-200 text-xs shadow-2xs rounded-xl">
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold uppercase flex items-center gap-1">
                  <Tag size={12} /> Log ID
                </span>
                <span className="font-mono text-slate-900 font-bold mt-1 block">#{selectedLog.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold uppercase flex items-center gap-1">
                  <ShieldCheck size={12} /> Action Type
                </span>
                <span className="font-bold text-emerald-600 mt-1 block">{selectedLog.actionType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold uppercase flex items-center gap-1">
                  <FileText size={12} /> Record ID
                </span>
                <span className="font-mono text-slate-800 mt-1 block">#{selectedLog.recordId || selectedLog.entityId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold uppercase flex items-center gap-1">
                  <Clock size={12} /> Timestamp
                </span>
                <span className="text-slate-800 font-semibold mt-1 block">
                  {formatDateTime(selectedLog.createdAt)}
                </span>
              </div>
            </div>

            {/* Actor & Organization Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white border border-slate-200 text-xs shadow-2xs rounded-xl">
              <div className="space-y-1.5 min-w-0">
                <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <User size={13} className="text-slate-500" />
                  Performed By Actor
                </span>
                <div className="flex items-center gap-2.5 pt-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 ${
                    !selectedLog.performedBy ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}>
                    {!selectedLog.performedBy ? (
                      <Cpu size={16} />
                    ) : selectedLog.performedBy?.profilePhoto ? (
                      <img src={selectedLog.performedBy.profilePhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      selectedLog.performedBy?.name?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-900 font-bold text-sm truncate leading-tight">{selectedLog.performedBy?.name || 'System Event'}</p>
                    <p className="text-slate-500 text-[11px] truncate mt-0.5">{selectedLog.performedBy?.email || 'system@crm.internal'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-500" />
                  Company Scope
                </span>
                <div className="pt-1 space-y-0.5 min-w-0">
                  <p className="text-slate-900 font-bold text-sm truncate leading-tight">{selectedLog.company?.name || 'Global System'}</p>
                  {selectedLog.branch?.name && (
                    <p className="text-slate-500 text-[11px] font-medium truncate mt-0.5">Branch: {selectedLog.branch.name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Network & Client Telemetry */}
            <div className="p-4 bg-white border border-slate-200 text-xs shadow-2xs rounded-xl space-y-2.5">
              <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Laptop size={13} className="text-slate-500" />
                Network & Client Telemetry
              </span>
              <div className="grid grid-cols-3 gap-3 pt-1 text-slate-700 items-start">
                <div className="flex items-start gap-2">
                  <Globe size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block leading-none">IP Address</span>
                    <span className={`inline-block font-mono font-semibold text-xs px-2 py-0.5 rounded border mt-1 ${
                      selectedLog.ipAddress === 'SYSTEM' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      selectedLog.ipAddress === 'Localhost' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {selectedLog.ipAddress === 'SYSTEM' ? 'Internal System' : (selectedLog.ipAddress || 'Unknown')}
                    </span>
                  </div>
                </div>

                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block leading-none">Device</span>
                  <span className="text-slate-800 font-bold text-xs truncate block mt-1">
                    {selectedLog.deviceInfo === 'SYSTEM' ? 'System Process' : (selectedLog.deviceInfo || 'Unknown Device')}
                  </span>
                </div>

                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block leading-none">Browser</span>
                  <span className="text-slate-700 font-semibold text-xs truncate block mt-1">
                    {selectedLog.browserInfo === 'SYSTEM' ? 'System Process' : (selectedLog.browserInfo || 'Unknown Browser')}
                  </span>
                </div>
              </div>
            </div>

            {/* Side-by-Side Data Snapshot Comparison (Crash-Safe JSON Rendering) */}
            <div className="space-y-4 pt-1">
              <div className="border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Data Snapshot Comparison (Before & After)
                </h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Compare the exact record data before the change occurred vs. the updated data saved to the database.
                </p>
              </div>

              {/* Previous Data (Before Change) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    Previous State (Data Before Change)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Original Record Values</span>
                </div>
                <pre className="p-4 bg-[#0F172A] text-slate-100 border border-slate-800 text-[11px] font-mono max-h-64 overflow-auto whitespace-pre-wrap leading-relaxed shadow-inner rounded-xl">
                  {safeJsonFormat(selectedLog.oldValue, 'No Data Available (Initial creation or system event)')}
                </pre>
              </div>

              {/* Updated Data (After Change) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    Updated State (Data After Change)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Saved Database Values</span>
                </div>
                <pre className="p-4 bg-[#0F172A] text-slate-100 border border-slate-800 text-[11px] font-mono max-h-64 overflow-auto whitespace-pre-wrap leading-relaxed shadow-inner rounded-xl">
                  {safeJsonFormat(selectedLog.newValue, 'No Data Available (Deletion or read event)')}
                </pre>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* ── EXPORT FILTER DRAWER (RIGHT-SIDE DRAWER) ── */}
      <Drawer
        isOpen={isExportDrawerOpen}
        onClose={() => setIsExportDrawerOpen(false)}
        title="Export Audit Logs Report"
        subtitle="Configure date range & filters to download structured audit report"
        icon={Download}
        showFooter={true}
        showSubmit={true}
        submitText={exporting ? 'Generating Report...' : 'Apply & Export'}
        cancelText="Close"
        onSubmit={handleExportSubmit}
        submitDisabled={exporting}
        width={{ xs: '100%', sm: 480 }}
      >
        <div className="space-y-5 py-2">
          {/* Validation / Limit Exceeded Banner */}
          {exportError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2.5 shadow-2xs">
              <ShieldAlert size={18} className="shrink-0 mt-0.5 text-red-500" />
              <div>
                <span className="font-bold block text-red-800 text-xs uppercase tracking-wider">Export Validation Error</span>
                <span className="mt-1 block leading-relaxed">{exportError}</span>
              </div>
            </div>
          )}

          {/* Date Range Selection (REQUIRED) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Date Range <span className="text-red-500">*</span>
            </label>
            <SelectField
              id="exportDateRangeSelect"
              value={exportFilters.dateRange}
              onChange={(val) => setExportFilters((prev) => ({ ...prev, dateRange: val, exportError: '' }))}
              options={EXPORT_DATE_RANGE_OPTIONS}
              allowEmptyOption={false}
              searchable={false}
            />
          </div>

          {/* Custom Date Pickers (Shown when Custom Range is selected) */}
          {exportFilters.dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">From Date</label>
                <input
                  type="date"
                  value={exportFilters.startDate}
                  onChange={(e) => setExportFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full h-[38px] px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">To Date</label>
                <input
                  type="date"
                  value={exportFilters.endDate}
                  onChange={(e) => setExportFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full h-[38px] px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
          )}

          {/* SUPER ADMIN ONLY: Company Filter (Optional) */}
          {isSuperAdmin && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Company Scope <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <SelectField
                id="exportCompanySelect"
                value={exportFilters.companyId}
                onChange={(val) => setExportFilters((prev) => ({ ...prev, companyId: val }))}
                options={companyOptions}
                placeholder="All Companies"
                allowEmptyOption={true}
                searchable={true}
              />
            </div>
          )}

          {/* Module Filter (Optional) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Module Filter <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <SelectField
              id="exportModuleSelect"
              value={exportFilters.moduleName}
              onChange={(val) => setExportFilters((prev) => ({ ...prev, moduleName: val }))}
              options={MODULE_OPTIONS}
              placeholder="All Modules"
              allowEmptyOption={true}
              searchable={true}
            />
          </div>

          {/* Action Type Filter (Optional) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Action Type <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <SelectField
              id="exportActionTypeSelect"
              value={exportFilters.actionType}
              onChange={(val) => setExportFilters((prev) => ({ ...prev, actionType: val }))}
              options={ACTION_TYPE_OPTIONS}
              placeholder="All Action Types"
              allowEmptyOption={true}
              searchable={true}
            />
          </div>

          {/* Export File Format */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              File Format
            </label>
            <SelectField
              id="exportFormatSelect"
              value={exportFilters.format}
              onChange={(val) => setExportFilters((prev) => ({ ...prev, format: val }))}
              options={EXPORT_FORMAT_OPTIONS}
              allowEmptyOption={false}
              searchable={false}
            />
          </div>

          {/* Reset Action */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setExportFilters({
                  dateRange: '1w',
                  startDate: '',
                  endDate: '',
                  companyId: '',
                  moduleName: '',
                  actionType: '',
                  format: 'excel',
                });
                setExportError('');
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={14} />
              <span>Reset to Default Filters</span>
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default AuditPage;
