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
  
  // 1. Fetch Companies list (Super Admin only)
  const { data: companiesRes } = useQuery({
    queryKey: ['companies-all-options'],
    queryFn: () => companyApi.getCompanies(),
    enabled: currentUser?.primaryRole === 'SUPER_ADMIN'
  });
  const companies = Array.isArray(companiesRes?.data) ? companiesRes.data : (companiesRes?.data?.companies || []);

  // 2. Fetch Branches list (scoped by company)
  const targetCompanyId = currentUser?.primaryRole === 'SUPER_ADMIN' ? companyId : currentUser?.companyId;
  const { data: branchesRes } = useQuery({
    queryKey: ['branches-all-options', targetCompanyId],
    queryFn: () => branchService.getBranchesRaw(targetCompanyId),
    enabled: !!targetCompanyId
  });
  const branches = Array.isArray(branchesRes?.data) ? branchesRes.data : (branchesRes?.data?.branches || []);

  // 3. Fetch Roles list (scoped by company)
  const { data: rolesRes } = useQuery({
    queryKey: ['roles-all-options', targetCompanyId],
    queryFn: () => roleApi.getRoles({ companyId: targetCompanyId, limit: 100 }),
    enabled: !!targetCompanyId
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
    >
      <div className="space-y-4">
        
        {/* ── SEARCH AND FILTER BAR ── */}
        <div className="p-4 bg-white border border-slate-200/60 shadow-sm rounded-2xl flex flex-col gap-3">
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Filter size={15} className="text-orange-500" />
              <span>Search & Filters</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => refetch()}
                className="flex items-center gap-1.5 h-9 px-3 text-xs"
                title="Refresh List"
              >
                <RefreshCw size={14} />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Search name, email, code..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-800 placeholder-slate-400
                           focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
              />
            </div>

            {/* Company Filter (Super Admin only) */}
            {currentUser?.primaryRole === 'SUPER_ADMIN' && (
              <SelectField
                id="companyFilter"
                value={companyId}
                onChange={(val) => handleFilterChange('companyId', val)}
                options={companies.map(c => ({ value: c.id, label: c.name }))}
                placeholder="All Companies"
                allowEmptyOption={true}
              />
            )}

            {/* Branch Filter (Locked for Branch Manager) */}
            {currentUser?.primaryRole !== 'BRANCH_MANAGER' && (
              <SelectField
                id="branchFilter"
                value={branchId}
                onChange={(val) => handleFilterChange('branchId', val)}
                options={branches.map(b => ({ value: b.id, label: b.name }))}
                placeholder="All Branches"
                allowEmptyOption={true}
                disabled={!targetCompanyId}
              />
            )}

            {/* Role Filter */}
            <SelectField
              id="roleFilter"
              value={roleId}
              onChange={(val) => handleFilterChange('roleId', val)}
              options={roles.map(r => ({ value: r.id, label: r.name }))}
              placeholder="All Roles"
              allowEmptyOption={true}
              disabled={!targetCompanyId}
            />

            {/* Status Filter */}
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

          {/* Active filters clear button */}
          {hasActiveFilters && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={clearFilters}
                className="text-[12px] font-bold text-orange-600 hover:text-orange-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}

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
