// src/features/teams/pages/TeamsPage.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users2, Plus, RefreshCw, Search, RotateCcw } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import { useQuery, useIsMutating } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../../shared/components/elements/Button';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import SelectField from '../../../shared/components/elements/SelectField';
import SearchInput from '../../../shared/components/elements/SearchInput';
import PageHeader from '../../../shared/components/modules/PageHeader';
import { companyService } from '../../company/services/companyService';
import { branchService } from '../../branch/services/branchService';
import { useTeamsQuery, useToggleTeamStatusMutation, useDeleteTeamMutation, TEAM_KEYS } from '../hooks/useTeams';
import TeamListTable from '../components/TeamListTable';
import TeamFormModal from '../components/TeamFormModal';
import TeamDetailModal from '../components/TeamDetailModal';
import Pagination from '../../../shared/components/elements/Pagination';

const TeamsPage = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const { forceHideLoader } = useLoader();
  const location = useLocation();
  const navigate = useNavigate();

  // Search & Pagination State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const debounceTimer = useRef(null);

  // Filters State
  const [status, setStatus] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [view, setView] = useState('active');

  // Modals Open/Close States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeamForEdit, setSelectedTeamForEdit] = useState(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedTeamIdForDetails, setSelectedTeamIdForDetails] = useState(null);

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedTeamForDelete, setSelectedTeamForDelete] = useState(null);

  // Permissions
  const canEdit = hasPermission('TEAM', 'canEdit');
  const canCreate = hasPermission('TEAM', 'canCreate');
  const canDelete = hasPermission('TEAM', 'canDelete');

  // Multi-tenancy scopes synchronization
  useEffect(() => {
    if (currentUser) {
      if (currentUser.primaryRole !== 'SUPER_ADMIN') {
        setCompanyId(currentUser.companyId || '');
      }
      if (currentUser.primaryRole !== 'SUPER_ADMIN' && currentUser.primaryRole !== 'COMPANY_ADMIN') {
        setBranchId(currentUser.branchId || '');
      }
    }
  }, [currentUser]);

  // Handle auto-opening of Create Team form or auto-filtering from other pages (e.g. Branch Table)
  useEffect(() => {
    if (location.state?.filterBranchId) {
      if (location.state.filterCompanyId) {
        setCompanyId(location.state.filterCompanyId);
      }
      setBranchId(location.state.filterBranchId);
      // Clear route state to prevent persistent filtering on reload
      navigate(location.pathname, { replace: true, state: {} });
    } else if (location.state?.openCreate) {
      const targetBranchId = location.state.branchId;
      const targetCompanyId = location.state.companyId;
      setSelectedTeamForEdit({ branchId: targetBranchId, companyId: targetCompanyId });
      setIsFormOpen(true);

      // Clear the router state using navigate to prevent reopening on reload
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Debounced search logic
  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  const handleFilterChange = useCallback((field, value) => {
    setPage(1);
    if (field === 'status') setStatus(value);
    if (field === 'companyId') {
      setCompanyId(value);
      setBranchId(''); // Reset branch on company change
    }
    if (field === 'branchId') setBranchId(value);
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
    setStatus('');
    setView('active');
    const actorRank = currentUser?.primaryRoleRank ?? 0;
    const isSuper = currentUser?.primaryRole === 'SUPER_ADMIN' || actorRank >= 100;
    const isComp = currentUser?.primaryRole === 'COMPANY_ADMIN' || (!isSuper && actorRank >= 80);
    if (isSuper) {
      setCompanyId('');
      setBranchId('');
    } else if (isComp) {
      setBranchId('');
    }
  }, [currentUser]);

  // Hide page loader on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      forceHideLoader();
    }, 100);
    return () => clearTimeout(timer);
  }, [forceHideLoader]);

  const actorRank = currentUser?.primaryRoleRank ?? 0;
  const isSuperAdmin = currentUser?.primaryRole === 'SUPER_ADMIN' || actorRank >= 100;
  const isCompanyAdmin = currentUser?.primaryRole === 'COMPANY_ADMIN' || (!isSuperAdmin && actorRank >= 80);
  const isBranchManager = currentUser?.primaryRole === 'BRANCH_MANAGER' || (!isSuperAdmin && !isCompanyAdmin && actorRank >= 60);

  // Query Teams List
  const {
    data: teamsData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useTeamsQuery({
    page,
    limit,
    search: debouncedSearch,
    status,
    companyId: isSuperAdmin ? companyId : undefined,
    branchId,
    view
  });

  const teams = teamsData?.teams || [];
  const pagination = teamsData?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  // Mutations
  const toggleTeamStatusMutation = useToggleTeamStatusMutation();
  const deleteTeamMutation = useDeleteTeamMutation();

  // Fetch Companies (for Super Admin Filter)
  const canFilterByCompany = isSuperAdmin;
  const { data: companiesRes } = useQuery({
    queryKey: ['companies-all-options'],
    queryFn: () => companyService.getCompaniesRaw(),
    enabled: canFilterByCompany
  });
  const companies = companiesRes?.data || [];

  // Fetch Branches for selected company
  const canFilterByBranch = isSuperAdmin || isCompanyAdmin;
  const targetCompanyId = canFilterByCompany ? companyId : currentUser?.companyId;
  const { data: branchesRes } = useQuery({
    queryKey: ['branches-all-options', targetCompanyId],
    queryFn: () => branchService.getBranchesRaw(targetCompanyId),
    enabled: !!targetCompanyId && canFilterByBranch
  });
  const branches = Array.isArray(branchesRes?.data) ? branchesRes.data : (branchesRes?.data?.branches || []);

  // Handlers for Table Row Actions
  const handleOpenCreateForm = () => {
    setSelectedTeamForEdit({
      companyId: companyId || currentUser?.companyId || '',
      branchId: branchId || (isBranchManager ? currentUser.branchId : '')
    });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (team) => {
    setSelectedTeamForEdit(team);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (team) => {
    setSelectedTeamIdForDetails(team.id);
    setIsDetailsOpen(true);
  };

  const handleToggleStatus = (team) => {
    const nextStatus = team.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    toggleTeamStatusMutation.mutate({ id: team.id, status: nextStatus });
  };

  const handleOpenDelete = (team) => {
    setSelectedTeamForDelete(team);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedTeamForDelete) return;
    deleteTeamMutation.mutate(selectedTeamForDelete.id, {
      onSuccess: () => {
        setIsConfirmDeleteOpen(false);
        setSelectedTeamForDelete(null);
      }
    });
  };

  const isMutatingTeams = useIsMutating({ mutationKey: TEAM_KEYS.all }) > 0;

  // Determine page loading state
  const loadingState = (isLoading || isFetching || isMutatingTeams)
    ? 'loading'
    : isError
      ? 'error'
      : teams.length === 0
        ? 'empty'
        : 'success';

  const hasActiveFilters = !!(debouncedSearch || status || view !== 'active' || (canFilterByCompany && companyId) || (canFilterByBranch && branchId && currentUser?.primaryRole !== 'BRANCH_MANAGER'));

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
        {/* Header Title Section with Primary Action */}
        <PageHeader
          title="Team Manager"
          description="Organize, delegate, and manage branch level business execution teams"
          icon={Users2}
          actions={
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={() => refetch()}
                className="p-2.5 text-slate-400 hover:text-orange-500 hover:bg-slate-100 transition-all focus:outline-none cursor-pointer border border-slate-200/80 bg-slate-50 rounded-xl"
                title="Refresh Data"
              >
                <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
              </button>

              {canCreate && (
                <button
                  type="button"
                  onClick={handleOpenCreateForm}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 h-[40px] px-5 bg-[#F97316] hover:bg-[#EA580C] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:shadow transition-all duration-150 active:scale-[0.98] cursor-pointer whitespace-nowrap"
                >
                  <Plus size={16} />
                  <span>Add Team</span>
                </button>
              )}
            </div>
          }
        />

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white border border-slate-200 p-3.5 flex-wrap">
          {/* Search Input */}
          <div className="w-full sm:w-64">
            <SearchInput
              placeholder="Search teams..."
              value={search}
              onChange={handleSearchChange}
              className="w-full"
            />
          </div>

          {/* View Toggle Tabs */}
          <div className="flex items-center w-full sm:w-auto h-[40px] bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => { setView('active'); setPage(1); }}
              className={`flex-1 sm:flex-initial h-full px-3.5 flex items-center justify-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                view === 'active'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => { setView('archived'); setPage(1); }}
              className={`flex-1 sm:flex-initial h-full px-3.5 flex items-center justify-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                view === 'archived'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Archived
            </button>
            <button
              type="button"
              onClick={() => { setView('all'); setPage(1); }}
              className={`flex-1 sm:flex-initial h-full px-3.5 flex items-center justify-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                view === 'all'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All
            </button>
          </div>

          {/* Company Filter (Super Admin only) */}
          {canFilterByCompany && (
            <div className="w-full sm:w-44">
              <SelectField
                id="companyFilter"
                value={companyId}
                onChange={(val) => handleFilterChange('companyId', val)}
                options={companies.map(c => ({ value: c.id, label: c.name }))}
                placeholder="All Companies"
                allowEmptyOption={true}
                searchable
              />
            </div>
          )}

          {/* Branch Filter */}
          {canFilterByBranch && currentUser?.primaryRole !== 'BRANCH_MANAGER' && (
            <div className="w-full sm:w-44">
              <SelectField
                id="branchFilter"
                value={branchId}
                onChange={(val) => handleFilterChange('branchId', val)}
                options={branches.map(b => ({ value: b.id, label: b.name }))}
                placeholder="All Branches"
                allowEmptyOption={true}
                searchable
              />
            </div>
          )}

          {/* Status Filter */}
          <div className="w-full sm:w-36">
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

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 h-[42px] px-3 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-[10px] transition-all cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Data Table */}
        <TeamListTable
          teams={teams}
          loadingState={loadingState}
          errorMessage={error?.message}
          onRetry={refetch}
          onViewDetails={handleOpenDetails}
          onEdit={handleOpenEditForm}
          onToggleStatus={handleToggleStatus}
          onDelete={handleOpenDelete}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />

        {/* Pagination */}
        <Pagination
          pagination={pagination}
          onPageChange={setPage}
          isLoading={isLoading}
          entityName="teams"
        />
      </div>



      {/* ── MODAL AND SLIDE-OVER PORTALS ── */}

      {/* Form Slideover (Create / Edit) */}
      <TeamFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialValues={selectedTeamForEdit}
        companies={companies}
        currentUser={currentUser}
      />

      {/* Detail Slideover */}
      <TeamDetailModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTeamIdForDetails(null);
        }}
        teamId={selectedTeamIdForDetails}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => {
          setIsConfirmDeleteOpen(false);
          setSelectedTeamForDelete(null);
        }}
        title="Archive Team Record?"
        message={`Are you sure you want to delete the team "${selectedTeamForDelete?.name}" (${selectedTeamForDelete?.code})?`}
        warningMessage="This action soft-deletes the team. Historical membership and assignment logs will remain fully intact for audits."
        onConfirm={handleConfirmDelete}
        confirmText="Archive Team"
        danger
        isLoading={deleteTeamMutation.isPending}
      />
    </>
  );
};

export default TeamsPage;
