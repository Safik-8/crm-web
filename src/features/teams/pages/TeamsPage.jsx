// src/features/teams/pages/TeamsPage.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users2, Plus, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../../shared/components/elements/Button';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import SelectField from '../../../shared/components/elements/SelectField';
import { companyService } from '../../company/services/companyService';
import { branchService } from '../../branch/services/branchService';
import { useTeamsQuery, useToggleTeamStatusMutation, useDeleteTeamMutation } from '../hooks/useTeams';
import TeamListTable from '../components/TeamListTable';
import TeamFormModal from '../components/TeamFormModal';
import TeamDetailModal from '../components/TeamDetailModal';
import TeamPagination from '../components/TeamPagination';

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
    if (currentUser?.primaryRole === 'SUPER_ADMIN') {
      setCompanyId('');
      setBranchId('');
    } else if (currentUser?.primaryRole === 'COMPANY_ADMIN') {
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

  // Query Teams List
  const {
    data: teamsData,
    isLoading,
    isError,
    error,
    refetch
  } = useTeamsQuery({
    page,
    limit,
    search: debouncedSearch,
    status,
    companyId: currentUser?.primaryRole === 'SUPER_ADMIN' ? companyId : undefined,
    branchId,
    view
  });

  const teams = teamsData?.teams || [];
  const pagination = teamsData?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  // Mutations
  const toggleTeamStatusMutation = useToggleTeamStatusMutation();
  const deleteTeamMutation = useDeleteTeamMutation();

  // Fetch Companies (for Super Admin Filter)
  const canFilterByCompany = currentUser?.primaryRole === 'SUPER_ADMIN';
  const { data: companiesRes } = useQuery({
    queryKey: ['companies-all-options'],
    queryFn: () => companyService.getCompaniesRaw(),
    enabled: canFilterByCompany
  });
  const companies = companiesRes?.data || [];

  // Fetch Branches for selected company
  const canFilterByBranch = currentUser?.primaryRole === 'SUPER_ADMIN' || currentUser?.primaryRole === 'COMPANY_ADMIN';
  const targetCompanyId = canFilterByCompany ? companyId : currentUser?.companyId;
  const { data: branchesRes } = useQuery({
    queryKey: ['branches-all-options', targetCompanyId],
    queryFn: () => branchService.getBranchesRaw(targetCompanyId),
    enabled: !!targetCompanyId && canFilterByBranch
  });
  const branches = Array.isArray(branchesRes?.data) ? branchesRes.data : (branchesRes?.data?.branches || []);

  // Handlers for Table Row Actions
  const handleOpenCreateForm = () => {
    setSelectedTeamForEdit(null);
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

  // Determine page loading state
  const loadingState = isLoading
    ? 'loading'
    : isError
    ? 'error'
    : teams.length === 0
    ? 'empty'
    : 'success';

  const hasActiveFilters = !!(debouncedSearch || status || view !== 'active' || (canFilterByCompany && companyId) || (canFilterByBranch && branchId && currentUser?.primaryRole !== 'BRANCH_MANAGER'));

  return (
    <>
      <div className="space-y-4 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        
        {/* Header Title Section */}
        <div className="bg-white border border-slate-200/60 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
              <Users2 size={24} className="stroke-[2]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Team Manager</h1>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed mt-1">
                Organize, delegate, and manage branch level business execution teams
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-10 px-4 flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Sync</span>
            </Button>
            {canCreate && (
              <Button
                onClick={handleOpenCreateForm}
                className="h-10 px-4 flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                <span>Add Team</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Search name, code..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-[13px] font-medium text-slate-800 placeholder-slate-400
                     focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* View Toggle Tabs */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => { setView('active'); setPage(1); }}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none ${
                    view === 'active'
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200/30'
                      : 'text-slate-400 hover:text-slate-600 border border-transparent'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => { setView('archived'); setPage(1); }}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none ${
                    view === 'archived'
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200/30'
                      : 'text-slate-400 hover:text-slate-600 border border-transparent'
                  }`}
                >
                  Archived
                </button>
                <button
                  type="button"
                  onClick={() => { setView('all'); setPage(1); }}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none ${
                    view === 'all'
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200/30'
                      : 'text-slate-400 hover:text-slate-600 border border-transparent'
                  }`}
                >
                  All
                </button>
              </div>

              {/* Company Filter (Super Admin only) */}
              {canFilterByCompany && (
                <SelectField
                  id="companyFilter"
                  value={companyId}
                  onChange={(val) => handleFilterChange('companyId', val)}
                  options={[{ value: '', label: 'All Companies' }, ...companies.map(c => ({ value: c.id, label: c.name }))]}
                  className="min-w-[150px] !py-1"
                />
              )}

              {/* Branch Filter */}
              {canFilterByBranch && currentUser?.primaryRole !== 'BRANCH_MANAGER' && (
                <SelectField
                  id="branchFilter"
                  value={branchId}
                  onChange={(val) => handleFilterChange('branchId', val)}
                  options={[{ value: '', label: 'All Branches' }, ...branches.map(b => ({ value: b.id, label: b.name }))]}
                  className="min-w-[150px] !py-1"
                />
              )}

              {/* Status Filter */}
              <SelectField
                id="statusFilter"
                value={status}
                onChange={(val) => handleFilterChange('status', val)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'ACTIVE', label: 'ACTIVE' },
                  { value: 'INACTIVE', label: 'INACTIVE' }
                ]}
                className="min-w-[130px] !py-1"
              />

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

          </div>
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
        <TeamPagination
          pagination={pagination}
          onPageChange={setPage}
          isLoading={isLoading}
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
