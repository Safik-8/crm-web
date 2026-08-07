import React, { useEffect, useMemo, useState } from 'react';
import { Eye, RefreshCw, Users2 } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import PageHeader from '../../../shared/components/modules/PageHeader';
import Table from '../../../shared/components/elements/Table';
import SearchInput from '../../../shared/components/elements/SearchInput';
import SelectField from '../../../shared/components/elements/SelectField';
import Button from '../../../shared/components/elements/Button';
import Pagination from '../../../shared/components/elements/Pagination';
import CustomerDetailModal from '../components/CustomerDetailModal';
import { getCustomers, getCustomerById, updateCustomerStatus } from '../services/customerService';
import { formatCurrency, formatDate } from '../utils/customerUtils';
import { toast } from '../../../shared/utils/toast';
import { companyApi } from '../../company/api/companyApi';
import { branchService } from '../../branch/services/branchService';
import { userService } from '../../users/services/userService';

const CustomersPage = () => {
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
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [owners, setOwners] = useState([]);

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

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setOwnerId('');
    setCompanyId('');
    setBranchId('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = useMemo(() => Boolean(search || status || ownerId || companyId || branchId || dateFrom || dateTo), [search, status, ownerId, companyId, branchId, dateFrom, dateTo]);

  const columns = [
    { header: 'Customer Name', accessorKey: 'customerName' },
    { header: 'Contact Number', accessorKey: 'contactNumber' },
    { header: 'Email', accessorKey: 'email', cell: (row) => row.email || '—' },
    { header: 'Product', accessorKey: 'purchasedProduct', cell: (row) => row.purchasedProduct?.name || '—' },
    { header: 'Revenue', accessorKey: 'totalRevenue', cell: (row) => formatCurrency(row.totalRevenue) },
    { header: 'Owner', accessorKey: 'assignedOwner', cell: (row) => row.assignedOwner?.name || '—' },
    { header: 'Status', accessorKey: 'status', cell: (row) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{row.status}</span> },
    { header: 'Created Date', accessorKey: 'createdAt', cell: (row) => formatDate(row.createdAt) },
    {
      header: 'Actions',
      isActionColumn: true,
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="small" variant="outlined" onClick={() => openDetails(row)}>
            <span className="flex items-center gap-1.5">
              <Eye size={14} /> View
            </span>
          </Button>
          {canToggleStatus && (
            <Button size="small" variant="outlined" onClick={() => handleToggleStatus(row)} isLoading={togglingId === row.id}>
              {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Users2}
        title="Customers"
        description="Managed customer records created from won opportunities and linked revenue activity."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name, phone or email" />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-44">
              <SelectField
                label="Status"
                value={status}
                onChange={(value) => setStatus(value)}
                options={[{ id: '', name: 'All statuses' }, { id: 'ACTIVE', name: 'ACTIVE' }, { id: 'INACTIVE', name: 'INACTIVE' }]}
                allowEmptyOption={false}
              />
            </div>

            {canFilterCompany && (
              <div className="w-48">
                <SelectField
                  label="Company"
                  value={companyId}
                  onChange={(value) => setCompanyId(value)}
                  options={[{ id: '', name: 'All companies' }, ...companies.map((company) => ({ id: company.id, name: company.name }))]}
                  allowEmptyOption={false}
                />
              </div>
            )}

            {canFilterBranch && (
              <div className="w-36">
                <SelectField
                  label="Branch"
                  value={branchId}
                  onChange={(value) => setBranchId(value)}
                  options={[{ id: '', name: 'All branches' }, ...branches.map((branch) => ({ id: branch.id, name: branch.name }))]}
                  allowEmptyOption={false}
                />
              </div>
            )}

            {canFilterOwner && (
              <div className="w-36">
                <SelectField
                  label="Owner"
                  value={ownerId}
                  onChange={(value) => setOwnerId(value)}
                  options={[{ id: '', name: 'All owners' }, ...owners.map((owner) => ({ id: owner.id, name: owner.name || owner.email }))]}
                  allowEmptyOption={false}
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 lg:mt-6 grid grid-cols-12 items-center gap-4">
          <div className="col-span-12 lg:col-span-6">
            <div className="flex items-center gap-3">
              <div className="w-44">
                <label className="w-full text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  <span className="mb-1 block">From</span>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700" />
                </label>
              </div>

              <div className="w-44">
                <label className="w-full text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  <span className="mb-1 block">To</span>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700" />
                </label>
              </div>

              <div>
                <Button variant="outlined" onClick={clearFilters} disabled={!hasActiveFilters} className="mt-6">
                  <span className="flex items-center gap-2">
                    <RefreshCw size={14} /> Clear
                  </span>
                </Button>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6" />
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
    </div>
  );
};

export default CustomersPage;
