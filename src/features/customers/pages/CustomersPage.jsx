import React, { useState, useEffect, useMemo } from 'react';
import { Eye, RefreshCw, Users2, SlidersHorizontal, UserCheck, UserX, IndianRupee, TrendingUp, Search, MoreVertical, Power } from 'lucide-react';
import { Menu, MenuItem } from '@mui/material';
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import PageHeader from '../../../shared/components/modules/PageHeader';
import Table from '../../../shared/components/elements/Table';
import SearchInput from '../../../shared/components/elements/SearchInput';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import Button from '../../../shared/components/elements/Button';
import Pagination from '../../../shared/components/elements/Pagination';
import CustomerDetailModal from '../components/CustomerDetailModal';
import { getCustomers, getCustomerById, updateCustomerStatus } from '../services/customerService';
import { useFormatters } from '../../../shared/hooks/useFormatters';
import { toast } from '../../../shared/utils/toast';
import { companyApi } from '../../company/api/companyApi';
import { branchService } from '../../branch/services/branchService';
import { userService } from '../../users/services/userService';
import Drawer from '../../../shared/components/elements/Drawer';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import Skeleton from '../../../shared/components/elements/Skeleton';

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, iconBg, valueClass = 'text-slate-900', loading }) => (
  <div className="bg-white p-4 border border-slate-200 flex items-center justify-between">
    <div>
      <span className="text-xs text-slate-500 font-medium block mb-1">{label}</span>
      {loading
        ? <Skeleton className="h-7 w-24 rounded-md" />
        : <span className={`text-xl font-bold block ${valueClass}`}>{value}</span>}
    </div>
    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${iconBg}`}>
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

const getTodayRange = () => {
  const d = new Date();
  const dateStr = d.toLocaleDateString('en-CA');
  return { from: dateStr, to: dateStr };
};

const getThisWeekRange = () => {
  const today = new Date();
  const day = today.getDay(); // 0 is Sunday
  const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diffToMonday));
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return {
    from: monday.toLocaleDateString('en-CA'),
    to: sunday.toLocaleDateString('en-CA'),
  };
};

const getThisMonthRange = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    from: firstDay.toLocaleDateString('en-CA'),
    to: lastDay.toLocaleDateString('en-CA'),
  };
};

const CustomersPage = () => {
  const { formatCurrency, formatDate } = useFormatters();
  const { user, hasPermission } = useAuth();
  const { forceHideLoader } = useLoader();

  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loadingState, setLoadingState] = useState('loading');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateRangePreset, setDateRangePreset] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [owners, setOwners] = useState([]);
  const [stats, setStats] = useState(null);
  const [showInsights, setShowInsights] = useState(false);

  const productData = useMemo(() => {
    const counts = {};
    customers.forEach(c => {
      const pName = c.purchasedProduct?.name || 'Other Course';
      const rev = Number(c.totalRevenue || 0);
      counts[pName] = (counts[pName] || 0) + rev;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [customers]);

  const statusData = useMemo(() => {
    let active = 0;
    let inactive = 0;
    customers.forEach(c => {
      if (c.status === 'ACTIVE') active++;
      else inactive++;
    });
    return [
      { name: 'Active', value: active, color: '#10B981' },
      { name: 'Inactive', value: inactive, color: '#F59E0B' }
    ];
  }, [customers]);

  const actorRank = user?.primaryRoleRank ?? 0;
  const isSuperAdmin = user?.primaryRole === 'SUPER_ADMIN';
  const isCompanyAdmin = user?.primaryRole === 'COMPANY_ADMIN' || actorRank >= 80;
  const canToggleStatus = hasPermission('CUSTOMER', 'canEdit') && (isSuperAdmin || isCompanyAdmin || actorRank >= 60);
  const canFilterOwner = isSuperAdmin || isCompanyAdmin || actorRank >= 60;
  const canFilterCompany = isSuperAdmin;
  const canFilterBranch = isSuperAdmin || isCompanyAdmin;

  const fetchCustomers = async (currentPage = page) => {
    setLoadingState('loading');
    try {
      const params = {
        page: currentPage,
        limit: 10,
        search,
        status,
        ownerId,
        companyId,
        branchId,
        dateFrom,
        dateTo,
      };
      const response = await getCustomers(params);
      const payload = response?.data && typeof response.data === 'object' && !Array.isArray(response.data) ? response.data : response;
      const items = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
      const paginationData = payload?.pagination || response?.pagination || {};
      setCustomers(items);
      setStats(payload?.stats || response?.stats || null);
      setPagination({
        page: paginationData.page || currentPage,
        limit: paginationData.limit || 10,
        total: paginationData.total || items.length,
        totalPages: paginationData.totalPages || 1,
      });
      setLoadingState(items.length ? 'success' : 'empty');
    } catch (error) {
      setLoadingState('error');
      toast.error(error?.message || 'Failed to load customers');
    }
  };

  useEffect(() => {
    fetchCustomers(1);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, ownerId, companyId, branchId, dateFrom, dateTo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      forceHideLoader();
    }, 100);
    return () => clearTimeout(timer);
  }, [forceHideLoader]);

  useEffect(() => {
    const loadCompanies = async () => {
      if (!canFilterCompany) return;
      try {
        const response = await companyApi.getCompanies();
        const list = Array.isArray(response?.data) ? response.data : Array.isArray(response?.data?.companies) ? response.data.companies : [];
        setCompanies(list);
      } catch (error) {
        console.error(error);
      }
    };
    loadCompanies();
  }, [canFilterCompany]);

  useEffect(() => {
    const loadBranches = async () => {
      if (!canFilterBranch) return;
      const targetCompanyId = canFilterCompany ? companyId : user?.companyId;
      if (!targetCompanyId) {
        setBranches([]);
        return;
      }
      try {
        const response = await branchService.getBranchesRaw(targetCompanyId);
        const list = Array.isArray(response?.data) ? response.data : Array.isArray(response?.data?.branches) ? response.data.branches : [];
        setBranches(list);
      } catch (error) {
        console.error(error);
      }
    };
    loadBranches();
  }, [canFilterBranch, canFilterCompany, companyId, user?.companyId]);

  useEffect(() => {
    const loadOwners = async () => {
      if (!canFilterOwner) return;
      try {
        const response = await userService.getUsers({ companyId: user?.companyId || '', limit: 200, status: 'ACTIVE' });
        const list = Array.isArray(response?.data?.users) ? response.data.users : Array.isArray(response?.data) ? response.data : [];
        setOwners(list);
      } catch (error) {
        console.error(error);
      }
    };
    loadOwners();
  }, [canFilterOwner, user?.companyId]);

  const openDetails = async (customer) => {
    try {
      const response = await getCustomerById(customer.id);
      const payload = response?.data || response;
      setSelectedCustomer(payload);
      setDetailOpen(true);
    } catch (error) {
      toast.error(error?.message || 'Failed to load customer details');
    }
  };

  const handleToggleStatus = async (customer) => {
    if (!canToggleStatus) {
      toast.error('You do not have permission to update customer status');
      return;
    }
    const nextStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingId(customer.id);
    try {
      const response = await updateCustomerStatus(customer.id, nextStatus);
      const updated = response?.data || response;
      setCustomers((prev) => prev.map((item) => (item.id === customer.id ? { ...item, status: updated?.status || nextStatus } : item)));
      toast.success(`Customer marked ${nextStatus.toLowerCase()}`);
    } catch (error) {
      toast.error(error?.message || 'Failed to update customer status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDateRangePresetChange = (val) => {
    setDateRangePreset(val);
    setPage(1);
    if (val === 'today') {
      const { from, to } = getTodayRange();
      setDateFrom(from);
      setDateTo(to);
    } else if (val === 'thisWeek') {
      const { from, to } = getThisWeekRange();
      setDateFrom(from);
      setDateTo(to);
    } else if (val === 'thisMonth') {
      const { from, to } = getThisMonthRange();
      setDateFrom(from);
      setDateTo(to);
    } else if (val === '') {
      setDateFrom('');
      setDateTo('');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setOwnerId('');
    setCompanyId('');
    setBranchId('');
    setDateRangePreset('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = useMemo(() => Boolean(search || status || ownerId || companyId || branchId || dateRangePreset || dateFrom || dateTo), [search, status, ownerId, companyId, branchId, dateRangePreset, dateFrom, dateTo]);

  const CustomerActionsMenu = ({ row, openDetails, handleToggleStatus, canToggleStatus, togglingId }) => {
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
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
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
            className: "mt-1 shadow-lg border border-slate-200/80 rounded-xl bg-white min-w-[150px] py-1 text-slate-700 font-sans"
          }}
        >
          <MenuItem
            onClick={() => {
              handleClose();
              openDetails(row);
            }}
            className="px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800"
            sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Eye size={14} className="text-slate-400" />
            <span>View Details</span>
          </MenuItem>

          {canToggleStatus && (
            <MenuItem
              onClick={() => {
                handleClose();
                handleToggleStatus(row);
              }}
              disabled={togglingId === row.id}
              className="px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800 border-t border-slate-100/50"
              sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <Power size={14} className={row.status === 'ACTIVE' ? 'text-amber-500' : 'text-emerald-500'} />
              <span>{row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</span>
            </MenuItem>
          )}
        </Menu>
      </>
    );
  };

  const columns = [
    {
      header: 'Customer Name',
      accessorKey: 'customerName',
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-800 text-[13px]">{row.customerName}</p>
          {row.customerCode && <p className="text-[10px] font-mono text-slate-400 mt-0.5">{row.customerCode}</p>}
        </div>
      )
    },
    {
      header: 'Contact Number',
      accessorKey: 'contactNumber',
      cell: (row) => <span className="text-slate-700 font-medium text-[13px]">{row.contactNumber || '—'}</span>
    },
    {
      header: 'Email',
      accessorKey: 'email',
      cell: (row) => <span className="text-slate-500 font-medium text-[13px]">{row.email || '—'}</span>
    },
    {
      header: 'Product',
      accessorKey: 'purchasedProduct',
      cell: (row) => <span className="text-slate-700 font-semibold text-[13px]">{row.purchasedProduct?.name || '—'}</span>
    },
    {
      header: 'Revenue',
      accessorKey: 'totalRevenue',
      cell: (row) => <span className="text-emerald-700 font-bold text-[13px]">{formatCurrency(row.totalRevenue)}</span>
    },
    {
      header: 'Owner',
      accessorKey: 'assignedOwner',
      cell: (row) => <span className="text-slate-700 font-medium text-[13px]">{row.assignedOwner?.name || '—'}</span>
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
          row.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Created Date',
      accessorKey: 'createdAt',
      cell: (row) => <span className="text-slate-500 font-medium text-[13px]">{formatDate(row.createdAt)}</span>
    },
    {
      header: 'Actions',
      isActionColumn: true,
      cell: (row) => (
        <div className="flex items-center justify-end">
          <CustomerActionsMenu
            row={row}
            openDetails={openDetails}
            handleToggleStatus={handleToggleStatus}
            canToggleStatus={canToggleStatus}
            togglingId={togglingId}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
      <PageHeader
        icon={Users2}
        title="Customers"
        description="Managed customer records created from won opportunities and linked revenue activity."
        actions={
          <button onClick={() => fetchCustomers(page)} className="text-slate-400 hover:text-orange-500 transition-colors cursor-pointer" title="Refresh">
            <RefreshCw size={15} className={loadingState === 'loading' ? 'animate-spin' : ''} />
          </button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Customers" value={stats?.total ?? '—'} icon={Users2} iconBg="bg-orange-50 text-orange-600" loading={loadingState === 'loading'} />
        <StatCard label="Active Customers" value={stats?.active ?? '—'} icon={UserCheck} iconBg="bg-emerald-50 text-emerald-600" loading={loadingState === 'loading'} valueClass="text-emerald-700" />
        <StatCard label="Inactive Customers" value={stats?.inactive ?? '—'} icon={UserX} iconBg="bg-rose-50 text-rose-600" loading={loadingState === 'loading'} valueClass="text-rose-700" />
        <StatCard label="Total Revenue" value={stats?.totalRevenue !== undefined && stats?.totalRevenue !== null ? formatCurrency(stats.totalRevenue) : '—'} icon={IndianRupee} iconBg="bg-indigo-50 text-indigo-600" loading={loadingState === 'loading'} valueClass="text-indigo-700" />
      </div>

      {/* Insights Row */}
      {showInsights && customers.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Revenue by Product Chart */}
          <div className="bg-white border border-slate-200 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Revenue Contribution by Product</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#FFF' }}
                    labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: '#FFF' }}
                    itemStyle={{ fontSize: '11px', color: '#10B981' }}
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Bar dataKey="value" fill="#F86F03" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Customer Status Ratio */}
          <div className="bg-white border border-slate-200 p-5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 w-full">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Account Segmentations</h3>
              <div className="space-y-3 mt-4">
                {statusData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-b-0">
                    <span className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name} Customers
                    </span>
                    <span className="text-xs font-black text-slate-800">{item.value} ({stats?.total ? Math.round((item.value / stats.total) * 100) : 0}%)</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-40 h-40 flex-shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#FFF' }}
                    itemStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                <span className="text-base font-black text-slate-800">{stats?.total ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3.5">
        {/* Search Input */}
        <div className="flex-1 min-w-[240px] max-w-sm">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowInsights(!showInsights)}
            className={`flex items-center gap-2 px-4 h-11 border rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              showInsights
                ? 'border-orange-200 bg-orange-50/50 text-orange-600 hover:bg-orange-100/60'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <TrendingUp size={15} />
            {showInsights ? 'Hide Insights' : 'Customer Insights'}
          </button>

          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className={`flex items-center gap-2 px-4 h-11 border rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              hasActiveFilters
                ? 'border-orange-200 bg-orange-50/50 text-orange-600 hover:bg-orange-100/60'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={15} />
            Filters
            {hasActiveFilters && (
              <span className="flex items-center justify-center bg-orange-500 text-white text-[10px] font-black h-5 w-5 rounded-full">
                {[status, companyId, branchId, ownerId, dateRangePreset, dateFrom, dateTo].filter(Boolean).length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3.5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[12px] transition-all cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <Table
        columns={columns}
        data={customers}
        loadingState={loadingState}
        errorMessage="Could not load customers."
        onRetry={() => fetchCustomers(page)}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        emptyTitle="No customer records found"
        emptyDescription="Customers appear automatically after opportunities are won and deals are closed."
      />

      <Pagination pagination={pagination} onPageChange={(nextPage) => { setPage(nextPage); fetchCustomers(nextPage); }} entityName="customers" />

      <CustomerDetailModal isOpen={detailOpen} onClose={() => setDetailOpen(false)} customer={selectedCustomer} />

      {/* Slide-over Filter Drawer */}
      <Drawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Customers"
        subtitle="Apply segmentations and user assignment filters"
        icon={SlidersHorizontal}
        iconClassName="bg-orange-50 text-orange-600 border border-orange-100"
        width={{ xs: '100%', sm: 480, md: 520 }}
        showFooter={true}
        customFooter={
          <div className="flex w-full items-center justify-between gap-3">
            <Button
              variant="outlined"
              onClick={() => {
                clearFilters();
                setIsFilterDrawerOpen(false);
              }}
              disabled={!hasActiveFilters}
              sx={{
                borderColor: '#CBD5E1',
                color: '#64748B',
                fontWeight: 600,
                fontSize: '13px',
                height: '42px',
                px: 2.5
              }}
            >
              Reset All
            </Button>
            <Button
              variant="contained"
              onClick={() => setIsFilterDrawerOpen(false)}
              sx={{
                backgroundColor: '#F86F03',
                fontWeight: 700,
                fontSize: '13px',
                height: '42px',
                px: 3,
                '&:hover': { backgroundColor: '#DE5D02' }
              }}
            >
              Apply Filters
            </Button>
          </div>
        }
      >
        <div className="space-y-5 pb-6">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
            <SelectField
              placeholder="All statuses"
              value={status}
              onChange={(value) => setStatus(value === undefined ? '' : value)}
              options={[{ id: '', name: 'All statuses' }, { id: 'ACTIVE', name: 'ACTIVE' }, { id: 'INACTIVE', name: 'INACTIVE' }]}
              allowEmptyOption={false}
            />
          </div>

          {/* Date Range Preset Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date Range</label>
            <SelectField
              placeholder="All Time"
              value={dateRangePreset}
              onChange={(v) => handleDateRangePresetChange(v === undefined ? '' : v)}
              allowEmptyOption
              options={[
                { value: 'today',     label: 'Today' },
                { value: 'thisWeek',  label: 'This Week' },
                { value: 'thisMonth', label: 'This Month' },
                { value: 'custom',    label: 'Custom Range' },
              ]}
            />
          </div>

          {/* Custom Date Pickers */}
          {dateRangePreset === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">From Date</span>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 text-slate-700" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">To Date</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 text-slate-700" />
              </div>
            </div>
          )}

          {/* Owner Filter (Admin / Manager only) */}
          {canFilterOwner && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Owner</label>
              <SelectField
                placeholder="All owners"
                value={ownerId}
                onChange={(value) => setOwnerId(value === undefined ? '' : value)}
                options={[{ value: '', label: 'All owners' }, ...owners.map((owner) => ({ value: String(owner.id), label: owner.name || owner.email }))]}
                allowEmptyOption={true}
                searchable={true}
              />
            </div>
          )}

          {/* Company Filter (Super Admin only) */}
          {canFilterCompany && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Company</label>
              <SelectField
                placeholder="All companies"
                value={companyId}
                onChange={(value) => setCompanyId(value === undefined ? '' : value)}
                options={[{ value: '', label: 'All companies' }, ...companies.map((company) => ({ value: String(company.id), label: company.name }))]}
                allowEmptyOption={true}
                searchable={true}
              />
            </div>
          )}

          {/* Branch Filter (Admin / Super Admin only) */}
          {canFilterBranch && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Branch</label>
              <SelectField
                placeholder="All branches"
                value={branchId}
                onChange={(value) => setBranchId(value === undefined ? '' : value)}
                options={[{ value: '', label: 'All branches' }, ...branches.map((branch) => ({ value: String(branch.id), label: branch.name }))]}
                allowEmptyOption={true}
                searchable={true}
              />
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
};

export default CustomersPage;
