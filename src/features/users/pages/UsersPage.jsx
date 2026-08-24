// src/features/users/pages/UsersPage.jsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users2, Plus, RefreshCw, Filter, Search, List, Network } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import { useQuery } from '@tanstack/react-query';

// Import removed
import Button from '../../../shared/components/elements/Button';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import SelectField from '../../../shared/components/elements/SelectField';

import { companyApi } from '../../company/api/companyApi';
import { branchService } from '../../branch/services/branchService';
import { roleApi } from '../../roles/api/roleApi';
import { userService } from '../services/userService';

import { useUserList } from '../hooks/useUserList';
import { useUsersQuery } from '../hooks/useUsers';
import { useResetPasswordMutation } from '../hooks/useUsers';

import UserListTable from '../components/UserListTable';
import UserFormModal from '../components/UserFormModal';
import UserDetailModal from '../components/UserDetailModal';
import ResetPasswordModal from '../components/ResetPasswordModal';
import OrgChart from '../components/OrgChart';
import SearchInput from '../../../shared/components/elements/SearchInput';
import Pagination from '../../../shared/components/elements/Pagination';
import ExportMenu from '../../../shared/components/elements/ExportMenu';

const exportColumns = [
  { header: 'Employee ID', accessorKey: 'employeeId' },
  { header: 'Name', accessorKey: 'name' },
  { header: 'Email', accessorKey: 'email' },
  { header: 'Status', accessorKey: 'status' }
];

const UsersPage = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const { forceHideLoader } = useLoader();
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'orgchart'
  const { data: usersData } = useUsersQuery({ companyId: currentUser?.companyId, limit: 1000 });
  const allUsers = Array.isArray(usersData?.data?.users) ? usersData.data.users : (Array.isArray(usersData?.data) ? usersData.data : []);

  // Modal Open/Close states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);

  const [isConfirmStatusOpen, setIsConfirmStatusOpen] = useState(false);
  const [selectedUserForStatus, setSelectedUserForStatus] = useState(null);

  // Hook handles listing states (pagination, filters, search, status toggles)
  const {
    users,
    pagination,
    search,
    status,
    roleId,
    companyId,
    branchId,
    loadingState,
    errorMessage,
    hasActiveFilters,
    page,
    setPage,
    handleSearchChange,
    handleFilterChange,
    clearFilters,
    refetch,
    handleToggleStatus,
    isTogglingStatus,
    sortBy,
    sortOrder,
    toggleSort
  } = useUserList(currentUser);

  const resetPasswordMutation = useResetPasswordMutation();

  const location = useLocation();
  const navigate = useNavigate();

  // Sync incoming navigation filters
  useEffect(() => {
    const state = location.state;
    if (state?.filterBranchId || state?.filterCompanyId) {
      if (state.filterCompanyId) {
        handleFilterChange('companyId', state.filterCompanyId);
      }
      if (state.filterBranchId) {
        handleFilterChange('branchId', state.filterBranchId);
      } else {
        handleFilterChange('branchId', ''); // Reset branch if only filtering company
      }
      // Clear route state to prevent persistent filtering on reload
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, handleFilterChange]);

  // Hide page loader on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      forceHideLoader();
    }, 100);
    return () => clearTimeout(timer);
  }, [forceHideLoader]);

  // Can the current user edit (or reset password / toggle status)?
  const canEdit = hasPermission('USER', 'canEdit');
  const canCreate = hasPermission('USER', 'canCreate');

  // ── DROPDOWNS DATA FETCHING (TENANT AWARE) ──────────────────

  // ── Rank-based access flags — role-name agnostic, works for any custom role
  // System ranks: Super Admin=100, Company Admin=80, Branch Manager=60
  // Custom roles: company-scoped max rank=79, global max rank=99 (by design)
  const actorRank = currentUser?.primaryRoleRank ?? 0;
  const canFilterByCompany = actorRank >= 100; // No company scope (Super Admin level)
  const canFilterByBranch = actorRank >= 80;  // Company-wide visibility (Company Admin+)

  // 1. Fetch Companies list — only for actors with no company scope (rank >= 100)
  const { data: companiesRes } = useQuery({
    queryKey: ['companies-all-options'],
    queryFn: () => companyApi.getCompanies(),
    enabled: canFilterByCompany
  });
  const companies = Array.isArray(companiesRes?.data) ? companiesRes.data : (companiesRes?.data?.companies || []);

  // 2. Fetch Branches list — only for company-wide visibility roles (rank >= 80)
  const targetCompanyId = canFilterByCompany ? companyId : currentUser?.companyId;
  const { data: branchesRes } = useQuery({
    queryKey: ['branches-all-options', targetCompanyId],
    queryFn: () => branchService.getBranchesRaw(targetCompanyId),
    enabled: !!targetCompanyId && canFilterByBranch
  });
  const branches = Array.isArray(branchesRes?.data) ? branchesRes.data : (branchesRes?.data?.branches || []);

  // 3. Fetch Roles list — only if the user has ROLE_PERMISSION:canView.
  // Branch-scoped roles (rank < 80) do NOT have this permission; prevents 403 toast on mount.
  const canViewRoles = hasPermission('ROLE_PERMISSION', 'canView');
  const { data: rolesRes } = useQuery({
    queryKey: ['roles-all-options', targetCompanyId],
    queryFn: () => roleApi.getRoles({ companyId: targetCompanyId, limit: 100 }),
    enabled: !!targetCompanyId && canViewRoles
  });
  const roles = Array.isArray(rolesRes?.data?.roles) ? rolesRes.data.roles : (Array.isArray(rolesRes?.data) ? rolesRes.data : []);

  // 4. Fetch Managers list (active users in the same company)
  const { data: managersRes } = useQuery({
    queryKey: ['managers-all-options', targetCompanyId],
    queryFn: () => userService.getUsers({ companyId: targetCompanyId, limit: 150, status: 'ACTIVE' }),
    enabled: !!targetCompanyId
  });
  const managers = Array.isArray(managersRes?.data?.users) ? managersRes.data.users : (Array.isArray(managersRes?.data) ? managersRes.data : []);

  // ── TRIGGER HANDLERS ────────────────────────────────────────

  const handleOpenCreateForm = () => {
    setSelectedUserForEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (user) => {
    setSelectedUserForEdit(user);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (user) => {
    setSelectedUserForDetails(user);
    setIsDetailsOpen(true);
  };

  const handleOpenResetPassword = (user) => {
    setSelectedUserForReset(user);
    setIsResetOpen(true);
  };

  const handleConfirmReset = async (id) => {
    const res = await resetPasswordMutation.mutateAsync(id);
    return res?.data;
  };

  const handleOpenToggleStatus = (user) => {
    setSelectedUserForStatus(user);
    setIsConfirmStatusOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!selectedUserForStatus) return;
    try {
      await handleToggleStatus(selectedUserForStatus.id, selectedUserForStatus.status);
      setIsConfirmStatusOpen(false);
      setSelectedUserForStatus(null);
    } catch (err) {
      // Error toast handled by mutation
    }
  };

  return (
    <>
      <div className="space-y-4 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

        {/* ── TABS FOR VIEW MODE ── */}
        <div className="bg-white border border-slate-200 flex items-center px-6 pt-4">
          <div className="flex space-x-6 relative top-[1px]">
            <button
              onClick={() => setViewMode('list')}
              className={`pb-4 font-semibold text-sm transition-colors flex items-center gap-2 ${viewMode === 'list' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'}`}
            >
              <List size={16} /> User Manager
            </button>
            <button
              onClick={() => setViewMode('orgchart')}
              className={`pb-4 font-semibold text-sm transition-colors flex items-center gap-2 ${viewMode === 'orgchart' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'}`}
            >
              <Network size={16} /> Org Chart
            </button>
          </div>
        </div>

        {viewMode === 'orgchart' ? (
          <div className="bg-white border border-slate-200 p-4">
            <OrgChart users={allUsers || []} currentUser={currentUser} />
          </div>
        ) : (
          <>




            <div className='bg-white border border-slate-200 p-4'>
              {/* ── SEARCH AND FILTER BAR ── */}
              <div className="relative z-20 p-4 bg-white border border-slate-200 mb-4 space-y-4">

                {/* Row 1: Search & Main Actions */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
                  <SearchInput
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search name, email, employee ID..."
                    isLoading={loadingState === 'loading'}
                    className="w-full lg:max-w-md"
                  />

                  <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => refetch()}
                      disabled={loadingState === 'loading'}
                      className="flex items-center gap-1.5 h-9 px-3 text-xs"
                      title="Refresh List"
                    >
                      <RefreshCw size={14} className={loadingState === 'loading' ? 'animate-spin' : ''} />
                      <span>Refresh</span>
                    </Button>

                    <ExportMenu
                      data={users}
                      columns={exportColumns}
                      fileName="users"
                    />

                    {canCreate && (
                      <Button
                        onClick={handleOpenCreateForm}
                        className="flex items-center gap-1.5 h-9 px-3 text-xs"
                      >
                        <Plus size={14} />
                        <span>Onboard User</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Divider Line */}
                <div className="border-t border-slate-100/80" />

                {/* Row 2: Select Filters group */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 flex-1">

                    {/* Visual Label */}
                    <div className="flex items-center gap-1.5 h-[42px] px-5 bg-slate-100/60 rounded-[10px] border border-slate-200/40 text-slate-500 font-semibold text-[13px] uppercase tracking-wider">
                      <Filter size={16} className="text-primary" />
                      <span>Filters</span>
                    </div>

                    {canFilterByCompany && (
                      <div className="w-full sm:w-[160px]">
                        <SelectField
                          id="companyFilter"
                          value={companyId}
                          onChange={(val) => handleFilterChange('companyId', val)}
                          options={companies.map(c => ({ value: c.id, label: c.name }))}
                          placeholder="All Companies"
                          allowEmptyOption={true}
                        />
                      </div>
                    )}

                    {canFilterByBranch && (
                      <div className="w-full sm:w-[160px]">
                        <SelectField
                          id="branchFilter"
                          value={branchId}
                          onChange={(val) => handleFilterChange('branchId', val)}
                          options={branches.map(b => ({ value: b.id, label: b.name }))}
                          placeholder="All Branches"
                          allowEmptyOption={true}
                          disabled={!targetCompanyId}
                          searchable={true}
                        />
                      </div>
                    )}

                    {canViewRoles && (
                      <div className="w-full sm:w-[160px]">
                        <SelectField
                          id="roleFilter"
                          value={roleId}
                          onChange={(val) => handleFilterChange('roleId', val)}
                          options={roles.map(r => ({ value: r.id, label: r.name }))}
                          placeholder="All Roles"
                          allowEmptyOption={true}
                          disabled={!targetCompanyId}
                        />
                      </div>
                    )}

                    <div className="w-full sm:w-[140px]">
                      <SelectField
                        id="statusFilter"
                        value={status}
                        onChange={(val) => handleFilterChange('status', val)}
                        options={[
                          { value: 'ACTIVE', label: 'Active' },
                          { value: 'INACTIVE', label: 'Inactive' }
                        ]}
                        placeholder="All Statuses"
                        allowEmptyOption={true}
                      />
                    </div>

                  </div>

                  {/* Reset trigger */}
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="flex items-center justify-center h-[42px] px-5 text-[13px] font-semibold uppercase tracking-wider text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-[10px] transition-all self-end lg:self-auto"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
              {/* ── USERS DATA TABLE ── */}
              <UserListTable
                users={users}
                loadingState={loadingState}
                errorMessage={errorMessage}
                onRetry={() => refetch()}
                onViewDetails={handleOpenDetails}
                onEdit={handleOpenEditForm}
                onResetPassword={handleOpenResetPassword}
                onToggleStatus={handleOpenToggleStatus}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
                canEdit={canEdit}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={toggleSort}
              />

              {/* ── PAGINATION CONTROLS ── */}
              <Pagination
                pagination={pagination}
                onPageChange={setPage}
                isLoading={loadingState === 'loading'}
                entityName="users"
              />

            </div>

            {/* ── MODALS & DRAWER PORTALS ── */}

            {/* Form Modal (Create / Edit Slide-over) */}
            <UserFormModal
              isOpen={isFormOpen}
              onClose={() => setIsFormOpen(false)}
              initialValues={selectedUserForEdit}
              companies={companies}
              branches={branches}
              roles={roles}
              managers={managers}
              currentUser={currentUser}
            />

            {/* User Details Sliding Panel */}
            <UserDetailModal
              isOpen={isDetailsOpen}
              onClose={() => setIsDetailsOpen(false)}
              user={selectedUserForDetails}
            />

            {/* Reset Password Confirmation Dialog */}
            <ResetPasswordModal
              isOpen={isResetOpen}
              onClose={() => setIsResetOpen(false)}
              user={selectedUserForReset}
              onConfirm={handleConfirmReset}
              isLoading={resetPasswordMutation.isPending}
            />

            {/* Status Toggle (Deactivation/Activation) Confirmation Modal */}
            <ConfirmModal
              isOpen={isConfirmStatusOpen}
              onClose={() => setIsConfirmStatusOpen(false)}
              title={selectedUserForStatus?.status === 'ACTIVE' ? 'Deactivate Employee Account?' : 'Activate Employee Account?'}
              message={
                selectedUserForStatus?.status === 'ACTIVE'
                  ? `Are you sure you want to deactivate ${selectedUserForStatus?.name}? This will instantly revoke all their active sessions and prevent them from logging into the system.`
                  : `Are you sure you want to activate ${selectedUserForStatus?.name}? This will restore their system permissions and login access.`
              }
              warningMessage={
                selectedUserForStatus?.status === 'ACTIVE'
                  ? 'Active leads, logs, and historical data assigned to this employee will remain unchanged, but they can no longer access the CRM.'
                  : null
              }
              type={selectedUserForStatus?.status === 'ACTIVE' ? 'error' : 'success'}
              onConfirm={handleConfirmToggleStatus}
              confirmText={selectedUserForStatus?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              isLoading={isTogglingStatus}
            />
          </>
        )}

      </div>
    </>
  );
};

export default UsersPage;
