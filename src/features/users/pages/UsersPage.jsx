// src/features/users/pages/UsersPage.jsx

import React, { useState, useEffect } from 'react';
import { Users2, Plus, RefreshCw, Filter, Search } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import { useQuery } from '@tanstack/react-query';

import GenericPage from '../../../shared/components/templates/GenericPage';
import Button from '../../../shared/components/elements/Button';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import SelectField from '../../../shared/components/elements/SelectField';

import { companyApi } from '../../company/api/companyApi';
import { branchService } from '../../branch/services/branchService';
import { roleApi } from '../../roles/api/roleApi';
import { userService } from '../services/userService';

import { useUserList } from '../hooks/useUserList';
import { useResetPasswordMutation } from '../hooks/useUsers';

import UserListTable from '../components/UserListTable';
import UserFormModal from '../components/UserFormModal';
import UserDetailModal from '../components/UserDetailModal';
import ResetPasswordModal from '../components/ResetPasswordModal';
import UserPagination from '../components/UserPagination';

const UsersPage = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const { forceHideLoader } = useLoader();

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
    isTogglingStatus
  } = useUserList(currentUser);

  const resetPasswordMutation = useResetPasswordMutation();

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
  const canFilterByBranch  = actorRank >= 80;  // Company-wide visibility (Company Admin+)

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

  const handleConfirmToggleStatus = () => {
    if (!selectedUserForStatus) return;
    handleToggleStatus(selectedUserForStatus.id, selectedUserForStatus.status);
    setIsConfirmStatusOpen(false);
    setSelectedUserForStatus(null);
  };

  return (
    <GenericPage
      title="User Management"
      description="Create, edit, reset passwords, and control access lifecycles of CRM employees."
      icon={Users2}
      hideHeader={true}
    >
      <div className="space-y-4">
        
        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100/80">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">User Directory</h1>
            <p className="text-slate-400 text-xs font-semibold mt-0.5">Control employee authorization, branch routing, and access scopes.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => refetch()}
              className="flex items-center gap-1.5 h-9 px-3 text-xs"
              title="Refresh List"
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </Button>

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

        {/* ── SEARCH AND FILTER BAR ── */}
        <div className="p-3 bg-white border border-slate-200/60 shadow-sm rounded-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Search name, email, employee ID..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-[13px] font-medium text-slate-800 placeholder-slate-400
                           focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
              />
            </div>

            {/* Select Dropdowns Group */}
            <div className="flex flex-wrap items-center gap-2">
              
              {canFilterByCompany && (
                <div className="w-[160px]">
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
                <div className="w-[160px]">
                  <SelectField
                    id="branchFilter"
                    value={branchId}
                    onChange={(val) => handleFilterChange('branchId', val)}
                    options={branches.map(b => ({ value: b.id, label: b.name }))}
                    placeholder="All Branches"
                    allowEmptyOption={true}
                    disabled={!targetCompanyId}
                  />
                </div>
              )}

              {canViewRoles && (
                <div className="w-[160px]">
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

              <div className="w-[140px]">
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

              {/* Inline Clear Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50/50 hover:bg-orange-50 border border-orange-100/50 rounded-xl transition-all"
                >
                  Clear Filters
                </button>
              )}
            </div>

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
        />

        {/* ── PAGINATION CONTROLS ── */}
        <UserPagination
          pagination={pagination}
          onPageChange={setPage}
          isLoading={loadingState === 'loading'}
        />

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

      </div>
    </GenericPage>
  );
};

export default UsersPage;
