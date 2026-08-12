// src/features/deals/pages/DealsPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Handshake, Search, Filter, RefreshCcw, IndianRupee,
  TrendingUp, TrendingDown, XCircle, Eye, X, Calendar,
  User, Building2, GitBranch, ChevronDown, ChevronUp,
  SlidersHorizontal, Briefcase, Phone, Mail, Tag, Award,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useDealsQuery, useDealsStatsQuery, useDealDetailQuery } from '../hooks/useDeals';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import { companyApi } from '../../company/api/companyApi';
import { apiClient } from '../../../lib/api/api';
import Table from '../../../shared/components/elements/Table';
import Button from '../../../shared/components/elements/Button';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import Skeleton from '../../../shared/components/elements/Skeleton';
import PageHeader from '../../../shared/components/modules/PageHeader';
import Drawer from '../../../shared/components/elements/Drawer';
import { Dialog } from '@mui/material';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(v || 0));

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

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

const OUTCOME_META = {
  WON       : { label: 'Won',       bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  LOST      : { label: 'Lost',      bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200' },
  CANCELLED : { label: 'Cancelled', bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200' },
};

const OutcomeBadge = ({ outcome }) => {
  const m = OUTCOME_META[outcome] || OUTCOME_META.CANCELLED;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${m.bg} ${m.text} ${m.border}`}>
      {m.label}
    </span>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, iconBg, valueClass = 'text-slate-900', loading }) => (
  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
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

// ── Detail Modal ──────────────────────────────────────────────────────────────
const DealDetailModal = ({ dealId, onClose }) => {
  const { data: deal, isLoading } = useDealDetailQuery(dealId);

  const Row = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-2.5 p-3 bg-slate-50/60 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
      {Icon && (
        <div className="p-1.5 bg-white text-slate-400 rounded-lg border border-slate-100 mt-0.5">
          <Icon size={14} className="text-slate-500" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{label}</span>
        <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate" title={value}>{value || '—'}</span>
      </div>
    </div>
  );

  return (
    <Drawer
      isOpen={!!dealId}
      onClose={onClose}
      title="Deal Profile"
      subtitle={deal?.dealNumber || 'Deal Record'}
    >
      <div className="space-y-6 pb-20">
        {deal && (
          <div className={`h-2.5 w-full rounded-md ${
            deal.outcome === 'WON' ? 'bg-emerald-500' : deal.outcome === 'LOST' ? 'bg-rose-500' : 'bg-slate-400'
          }`} />
        )}

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          </div>
        ) : !deal ? (
          <div className="text-center py-10 space-y-2">
            <XCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-500">Deal record could not be loaded.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Premium Outcome & Value Banner */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              deal.outcome === 'WON'
                ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
                : deal.outcome === 'LOST'
                  ? 'bg-rose-50/50 border-rose-100 text-rose-800'
                  : 'bg-slate-50/50 border-slate-100 text-slate-800'
            }`}>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">Deal Outcome</span>
                <div className="flex items-center gap-2 mt-1">
                  <OutcomeBadge outcome={deal.outcome} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">Closing Value</span>
                <span className="text-2xl font-black text-slate-900 block mt-0.5">₹{fmt(deal.finalAmount)}</span>
              </div>
            </div>

            {/* Core Information Grid */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Core Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <Row label="Deal Number"       value={deal.dealNumber}        icon={Tag} />
                <Row label="Closing Date"      value={fmtDate(deal.closingDate)} icon={Calendar} />
                <Row label="Opportunity"       value={deal.opportunity?.opportunityName} icon={Briefcase} />
                <Row label="Assigned Owner"    value={deal.closedBy?.name}    icon={User} />
                <Row label="Customer Name"     value={deal.customer?.customerName || deal.lead?.name} icon={User} />
                <Row label="Contact Info"      value={deal.lead?.mobile || deal.lead?.email} icon={Phone} />

                {deal.outcome === 'LOST' && deal.reason && (
                  <div className="col-span-2">
                    <Row label="Loss Reason"   value={deal.reason.reasonName} icon={XCircle} />
                  </div>
                )}
              </div>
            </div>

            {/* Linked Revenue (WON only) */}
            {deal.outcome === 'WON' && deal.revenueLog && (
              <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/60 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                  <TrendingUp size={14} />
                  <span>Revenue Transaction Log</span>
                </div>
                <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-emerald-100/40 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Amount</span>
                    <strong className="text-slate-800 text-[13px]">₹{fmt(deal.revenueLog.revenueAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Status</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold mt-0.5">
                      {deal.revenueLog.paymentStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Log Date</span>
                    <strong className="text-slate-800 text-[13px]">{fmtDate(deal.revenueLog.revenueDate)}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Account (WON only) */}
            {deal.customer && (
              <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100/60 space-y-3">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
                  <User size={14} />
                  <span>Linked Customer Account</span>
                </div>
                <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-amber-100/40 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Account Name</span>
                    <strong className="text-slate-800 text-[13px] truncate block">{deal.customer.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Customer Code</span>
                    <strong className="text-slate-800 text-[13px] font-mono">{deal.customer.customerCode}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Remarks */}
            {deal.remarks && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Remarks / Notes</span>
                <div className="p-3 bg-slate-50 text-xs font-medium text-slate-600 rounded-xl border border-slate-100 leading-relaxed">
                  {deal.remarks}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100">
          <Button onClick={onClose} variant="outlined" color="primary" className="w-full">
            Close Profile
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const DealsPage = () => {
  const { user } = useAuth();
  const { forceHideLoader } = useLoader();

  const isSuperAdmin   = user?.primaryRole === 'SUPER_ADMIN';
  const isCompanyAdmin = !isSuperAdmin && (user?.primaryRoleRank ?? 0) >= 80;
  const canSeeAll      = isSuperAdmin || isCompanyAdmin;

  // ── filter state ──────────────────────────────────────────────────────────
  const [search,      setSearch]      = useState('');
  const [debouncedQ,  setDebouncedQ]  = useState('');
  const [outcome,     setOutcome]     = useState('');
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');
  const [dateRangePreset, setDateRangePreset] = useState('');
  const [minAmount,   setMinAmount]   = useState('');
  const [maxAmount,   setMaxAmount]   = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [branchFilter,  setBranchFilter]  = useState('');
  const [sortBy,    setSortBy]    = useState('closingDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const debounceRef = useRef(null);
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedQ(search); setPage(1); }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => { forceHideLoader(); }, [forceHideLoader]);
  useEffect(() => { setBranchFilter(''); }, [companyFilter]);

  // ── companies / branches (SA only) ───────────────────────────────────────
  const { data: companiesRaw } = useQuery({
    queryKey : ['companies-raw-deals'],
    queryFn  : () => companyApi.getCompanies(),
    enabled  : isSuperAdmin,
    staleTime: 60000,
  });
  const companies = Array.isArray(companiesRaw?.data) ? companiesRaw.data : [];

  const { data: branchesRaw } = useQuery({
    queryKey : ['branches-raw-deals', companyFilter || user?.companyId],
    queryFn  : async () => {
      const cid = companyFilter || user?.companyId;
      if (!cid) return [];
      const res = await apiClient(`/branches?company_id=${cid}`, { method: 'GET' });
      return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    },
    enabled  : canSeeAll,
    staleTime: 30000,
  });
  const branches = branchesRaw || [];

  // ── active users for owner filter ────────────────────────────────────────
  const { data: usersRaw } = useQuery({
    queryKey : ['users-active-deals', user?.companyId],
    queryFn  : async () => {
      if ((user?.primaryRoleRank ?? 0) < 60) return [];
      const res = await apiClient(`/users?status=ACTIVE&limit=100`, { method: 'GET' });
      const items = res?.data?.items || res?.data || res?.items || res || [];
      return Array.isArray(items) ? items : [];
    },
    enabled  : !!user && (user?.primaryRoleRank ?? 0) >= 60,
    staleTime: 60000,
  });
  const activeUsers = usersRaw || [];

  // ── query params ─────────────────────────────────────────────────────────
  const queryParams = {
    search   : debouncedQ,
    outcome,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    sortBy,
    sortOrder,
    page,
    limit    : 20,
    ...(ownerFilter   && { ownerId   : ownerFilter }),
    ...(companyFilter && { companyId : companyFilter }),
    ...(branchFilter  && { branchId  : branchFilter }),
  };

  const { data, isLoading, isError, refetch } = useDealsQuery(queryParams);
  const { data: stats, isLoading: statsLoading } = useDealsStatsQuery({
    search: debouncedQ,
    outcome,
    dateFrom,
    dateTo,
    ...(companyFilter && { companyId: companyFilter }),
    ...(branchFilter  && { branchId:  branchFilter }),
    ...(ownerFilter   && { ownerId:   ownerFilter }),
  });

  const deals      = data?.items      || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  const hasFilters = !!(debouncedQ || outcome || dateRangePreset || dateFrom || dateTo || minAmount || maxAmount || ownerFilter || companyFilter || branchFilter);

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
    setSearch(''); setDebouncedQ(''); setOutcome('');
    setDateRangePreset(''); setDateFrom(''); setDateTo(''); setMinAmount(''); setMaxAmount('');
    setOwnerFilter(''); setCompanyFilter(''); setBranchFilter('');
    setPage(1);
  };

  // ── sort toggle helper ────────────────────────────────────────────────────
  const handleSort = useCallback((field) => {
    if (sortBy === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('desc'); }
    setPage(1);
  }, [sortBy]);

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ChevronDown className="w-3 h-3 text-slate-300 ml-1 inline" />;
    return sortOrder === 'asc'
      ? <ChevronUp   className="w-3 h-3 text-orange-500 ml-1 inline" />
      : <ChevronDown className="w-3 h-3 text-orange-500 ml-1 inline" />;
  };

  // ── loading state ─────────────────────────────────────────────────────────
  const loadingState = isLoading ? 'loading' : isError ? 'error' : deals.length === 0 ? 'empty' : 'success';

  // ── table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      header    : <button onClick={() => handleSort('dealNumber')} className="flex items-center text-left">Deal No <SortIcon field="dealNumber" /></button>,
      skeleton  : () => <Skeleton className="h-5 w-28" />,
      cell      : (row) => (
        <div>
          <p className="font-bold text-slate-800 text-[13px]">{row.dealNumber}</p>
        </div>
      ),
    },
    {
      header    : <button onClick={() => handleSort('customerName')} className="flex items-center">Customer <SortIcon field="customerName" /></button>,
      skeleton  : () => <Skeleton className="h-5 w-32" />,
      cell      : (row) => (
        <div>
          <p className="font-semibold text-slate-800 text-[13px] truncate max-w-[140px]">
            {row.customer?.customerName || row.lead?.name || '—'}
          </p>
          {row.lead?.mobile && <p className="text-[11px] text-slate-400">{row.lead.mobile}</p>}
        </div>
      ),
    },
    {
      header    : 'Opportunity',
      skeleton  : () => <Skeleton className="h-5 w-36" />,
      cell      : (row) => (
        <span className="text-[13px] text-slate-700 font-medium truncate block max-w-[160px]" title={row.opportunity?.opportunityName}>
          {row.opportunity?.opportunityName || '—'}
        </span>
      ),
    },
    {
      header    : 'Outcome',
      align     : 'center',
      skeleton  : () => <Skeleton className="h-6 w-20 rounded-md mx-auto" />,
      cell      : (row) => <OutcomeBadge outcome={row.outcome} />,
    },
    {
      header    : <button onClick={() => handleSort('finalAmount')} className="flex items-center">Amount <SortIcon field="finalAmount" /></button>,
      align     : 'right',
      skeleton  : () => <Skeleton className="h-5 w-20 ml-auto" />,
      cell      : (row) => (
        <span className="font-bold text-slate-900 text-[13px] tabular-nums">₹{fmt(row.finalAmount)}</span>
      ),
    },
    {
      header    : <button onClick={() => handleSort('closingDate')} className="flex items-center">Close Date <SortIcon field="closingDate" /></button>,
      skeleton  : () => <Skeleton className="h-5 w-24" />,
      cell      : (row) => <span className="text-[13px] text-slate-600">{fmtDate(row.closingDate)}</span>,
    },
    {
      header    : 'Owner',
      skeleton  : () => <Skeleton className="h-5 w-24" />,
      cell      : (row) => (
        <span className="text-[13px] text-slate-700 font-medium truncate block max-w-[110px]">
          {row.closedBy?.name || '—'}
        </span>
      ),
    },
    {
      header         : 'Actions',
      isActionColumn : true,
      align          : 'right',
      skeleton       : () => <Skeleton className="h-8 w-16 rounded-lg ml-auto" />,
      cell           : (row) => (
        <button
          onClick={() => setSelectedDealId(row.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50 hover:text-orange-800 rounded-lg transition-all border border-orange-100 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" /> View
        </button>
      ),
    },
  ];

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">

      {/* Header */}
      <PageHeader
        title="Deal Management"
        description="Track sales outcomes, revenue performance, and deal history."
        icon={Handshake}
        actions={
          <button onClick={refetch} className="text-slate-400 hover:text-orange-500 transition-colors" title="Refresh">
            <RefreshCcw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Deals"   value={stats?.total ?? '—'}     icon={Handshake}    iconBg="bg-orange-50 text-orange-600"  loading={statsLoading} />
        <StatCard label="Won Deals"     value={stats?.won ?? '—'}       icon={TrendingUp}   iconBg="bg-emerald-50 text-emerald-600" loading={statsLoading} valueClass="text-emerald-700" />
        <StatCard label="Lost Deals"    value={stats?.lost ?? '—'}      icon={TrendingDown} iconBg="bg-rose-50 text-rose-600"       loading={statsLoading} valueClass="text-rose-700" />
        <StatCard label="Won Revenue"   value={`₹${fmt(stats?.wonRevenue)}`} icon={IndianRupee} iconBg="bg-indigo-50 text-indigo-600"  loading={statsLoading} valueClass="text-indigo-700" />
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
        {/* Search Input */}
        <div className="flex-1 min-w-[240px] max-w-sm">
          <TextField
            placeholder="Search deal, customer, opportunity…"
            value={search}
            onChange={setSearch}
            startIcon={Search}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className={`flex items-center gap-2 px-4 h-11 border rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              hasFilters
                ? 'border-orange-200 bg-orange-50/50 text-orange-600 hover:bg-orange-100/60'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={15} />
            Filters
            {hasFilters && (
              <span className="flex items-center justify-center bg-orange-500 text-white text-[10px] font-black h-5 w-5 rounded-full">
                {[outcome, dateRangePreset, dateFrom, dateTo, minAmount, maxAmount, ownerFilter, companyFilter, branchFilter].filter(Boolean).length}
              </span>
            )}
          </button>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3.5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[12px] transition-all cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={deals}
        loadingState={loadingState}
        hasActiveFilters={hasFilters}
        onClearFilters={clearFilters}
        emptyTitle="No Deals Found"
        emptyDescription="Deals are created automatically when an opportunity is closed as Won, Lost, or Cancelled."
        emptyIcon={Handshake}
        skeletonRows={8}
        onRetry={refetch}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-500">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} deals)
          </p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
              Previous
            </button>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selectedDealId && (
        <DealDetailModal dealId={selectedDealId} onClose={() => setSelectedDealId(null)} />
      )}

      {/* Slide-over Filter Drawer */}
      <Drawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Deals"
        subtitle="Segment outcomes and revenue analytics"
      >
        <div className="flex flex-col h-full justify-between pb-10">
          <div className="space-y-5">
            {/* Outcome Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Outcome</label>
              <SelectField
                placeholder="All Outcomes"
                value={outcome}
                onChange={(v) => { setOutcome(v === undefined ? '' : v); setPage(1); }}
                allowEmptyOption
                options={[
                  { value: 'WON',       label: 'Won' },
                  { value: 'LOST',      label: 'Lost' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                ]}
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
                  <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 text-slate-700" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">To Date</span>
                  <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 text-slate-700" />
                </div>
              </div>
            )}

            {/* Revenue / Amount Range */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Revenue / Amount Range</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Min Amount</span>
                  <input type="number" placeholder="Min ₹" value={minAmount} onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 text-slate-700" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Max Amount</span>
                  <input type="number" placeholder="Max ₹" value={maxAmount} onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 text-slate-700" />
                </div>
              </div>
            </div>

            {/* Owner Filter (Admin / Manager only) */}
            {(user?.primaryRoleRank ?? 0) >= 60 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Owner</label>
                <SelectField
                  placeholder="All Owners"
                  value={ownerFilter}
                  onChange={(v) => { setOwnerFilter(v === undefined ? '' : v); setPage(1); }}
                  allowEmptyOption
                  searchable
                  options={activeUsers.map((u) => ({ value: String(u.id), label: u.name }))}
                />
              </div>
            )}

            {/* Company Filter (Super Admin only) */}
            {isSuperAdmin && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Company</label>
                <SelectField
                  placeholder="All Companies"
                  value={companyFilter}
                  onChange={(v) => { setCompanyFilter(v === undefined ? '' : v); setPage(1); }}
                  allowEmptyOption
                  searchable
                  options={companies.map((c) => ({ value: String(c.id), label: c.name }))}
                />
              </div>
            )}

            {/* Branch Filter (Admin / Super Admin only) */}
            {canSeeAll && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Branch</label>
                <SelectField
                  placeholder="All Branches"
                  value={branchFilter}
                  onChange={(v) => { setBranchFilter(v === undefined ? '' : v); setPage(1); }}
                  allowEmptyOption
                  searchable
                  options={branches.map((b) => ({ value: String(b.id), label: b.name }))}
                />
              </div>
            )}
          </div>

          {/* Drawer Actions */}
          <div className="flex gap-3 border-t border-slate-100 pt-6 mt-8">
            <button
              onClick={() => {
                clearFilters();
                setIsFilterDrawerOpen(false);
              }}
              disabled={!hasFilters}
              className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset All
            </button>
            <button
              onClick={() => setIsFilterDrawerOpen(false)}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all cursor-pointer text-center"
            >
              Close
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default DealsPage;
