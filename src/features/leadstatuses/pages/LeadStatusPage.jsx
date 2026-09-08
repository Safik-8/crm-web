// src/features/leadstatuses/pages/LeadStatusPage.jsx
import React, { useState } from 'react';
import { Plus, Pencil, Power, Trash2, Tags, ArrowUpDown, Lock, Check } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import {
  useLeadStatusesQuery,
  useToggleLeadStatusMutation,
  useDeleteLeadStatusMutation
} from '../hooks/useLeadStatuses';
import Button from '../../../shared/components/elements/Button';
import Table from '../../../shared/components/elements/Table';
import SearchInput from '../../../shared/components/elements/SearchInput';
import Pagination from '../../../shared/components/elements/Pagination';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import LeadStatusFormSlideover from '../components/LeadStatusFormSlideover';
import LeadStatusReorderModal from '../components/LeadStatusReorderModal';
import PageHeader from '../../../shared/components/modules/PageHeader';

export const LeadStatusPage = () => {
  const { user, hasPermission } = useAuth();
  const isSuperAdmin = user?.companyId === null;

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Overlay states
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [slideoverMode, setSlideoverMode] = useState('create'); // 'create' | 'edit'
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [statusToToggle, setStatusToToggle] = useState(null);
  const [statusToDelete, setStatusToDelete] = useState(null);
  const [isReorderOpen, setIsReorderOpen] = useState(false);

  // Queries & Mutations
  const queryParams = {
    page,
    limit,
    search: searchTerm,
    isActive: statusFilter === 'active' ? 'true' : statusFilter === 'inactive' ? 'false' : undefined
  };

  const { data: statusesRes, isLoading, isFetching, isError, error, refetch } = useLeadStatusesQuery(queryParams);
  const rawStatuses = Array.isArray(statusesRes) ? statusesRes : (statusesRes?.statuses || statusesRes?.data?.statuses || []);
  const statuses = Array.isArray(rawStatuses) ? rawStatuses : [];
  const pagination = statusesRes?.pagination || statusesRes?.data?.pagination || { page, limit, total: statuses.length, totalPages: Math.ceil(statuses.length / limit) || 1 };
  const toggleMutation = useToggleLeadStatusMutation();
  const deleteMutation = useDeleteLeadStatusMutation();

  // Handlers
  const handleAddClick = () => {
    setSlideoverMode('create');
    setSelectedStatus(null);
    setIsSlideoverOpen(true);
  };

  const handleEditClick = (status) => {
    setSlideoverMode('edit');
    setSelectedStatus(status);
    setIsSlideoverOpen(true);
  };

  const handleToggleClick = (status) => {
    // Safety check: Cannot deactivate default status
    if (status.isDefault && status.isActive) {
      return;
    }
    if (status.isActive) {
      // Active -> Inactive requires confirmation
      setStatusToToggle(status);
    } else {
      // Inactive -> Active happens immediately
      toggleMutation.mutate(status.id);
    }
  };

  const handleConfirmToggle = async () => {
    if (statusToToggle) {
      await toggleMutation.mutateAsync(statusToToggle.id);
      setStatusToToggle(null);
    }
  };

  const handleDeleteClick = (status) => {
    if (status.isSystem || status.isDefault) return;
    setStatusToDelete(status);
  };

  const handleConfirmDelete = async () => {
    if (statusToDelete) {
      await deleteMutation.mutateAsync(statusToDelete.id);
      setStatusToDelete(null);
    }
  };

  // Determine Table Loading State
  const loadingState = (isLoading || isFetching || toggleMutation.isPending || deleteMutation.isPending)
    ? 'loading'
    : isError
      ? 'error'
      : !statuses || statuses.length === 0
        ? 'empty'
        : 'success';

  // Columns definition
  const columns = [
    {
      header: 'Color',
      accessorKey: 'displayColor',
      align: 'center',
      className: 'w-16',
      cell: (row) => (
        <div
          className="h-5 w-5 rounded-full border border-slate-200  mx-auto"
          style={{ background: row.displayColor }}
        />
      )
    },
    {
      header: 'Status Name',
      accessorKey: 'name',
      className: 'font-semibold text-slate-800 text-[13px]',
    },
    {
      header: 'System Code',
      accessorKey: 'code',
      cell: (row) => (
        <code className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">
          {row.code}
        </code>
      )
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${row.type === 'GLOBAL'
            ? 'bg-blue-50 text-blue-700 border border-blue-100'
            : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}
        >
          {row.type}
        </span>
      )
    },
    {
      header: 'Badges',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {row.isSystem && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200" title="System Locked Status">
              <Lock size={10} />
              System
            </span>
          )}
          {row.isDefault && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100" title="Default Status for New Leads">
              <Check size={10} />
              Default
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${row.isActive
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  // Render actions column if user has EDIT or DELETE permission
  const canEdit = hasPermission('LEAD_STATUS', 'canEdit');
  const canDelete = hasPermission('LEAD_STATUS', 'canDelete');

  if (canEdit || canDelete) {
    columns.push({
      header: 'Actions',
      align: 'right',
      cell: (row) => {
        const isGlobal = row.companyId === null;
        const canUserEdit = isSuperAdmin || (!isGlobal && canEdit);
        const canUserDelete = isSuperAdmin || (!isGlobal && canDelete);

        return (
          <div className="flex items-center justify-end gap-2">
            {canUserEdit && (
              <>
                <button
                  onClick={() => handleEditClick(row)}
                  className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
                  title="Edit Lead Status"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleToggleClick(row)}
                  disabled={row.isDefault && row.isActive}
                  className={`p-1.5 rounded-lg transition-all ${row.isDefault && row.isActive
                    ? 'text-slate-300 cursor-not-allowed opacity-40'
                    : row.isActive
                      ? 'text-red-500 hover:bg-red-50'
                      : 'text-emerald-500 hover:bg-emerald-50'
                    }`}
                  title={
                    row.isDefault && row.isActive
                      ? 'Cannot deactivate default status'
                      : row.isActive
                        ? 'Deactivate Lead Status'
                        : 'Activate Lead Status'
                  }
                >
                  <Power size={15} />
                </button>
              </>
            )}
            {canUserDelete && !row.isSystem && (
              <button
                onClick={() => handleDeleteClick(row)}
                disabled={row.isDefault}
                className={`p-1.5 rounded-lg transition-all ${row.isDefault
                  ? 'text-slate-300 cursor-not-allowed opacity-40'
                  : 'text-red-500 hover:bg-red-50 hover:text-red-700'
                  }`}
                title={row.isDefault ? 'Cannot delete default status' : 'Delete Lead Status'}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        );
      }
    });
  }

  const activeFiltersCount = (searchTerm ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Header section */}
      <PageHeader
        title="Lead Statuses"
        description="Manage global default and company-specific lead stages for the sales pipeline"
        icon={Tags}
      />

      {/* Filter, Search & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3.5">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
          {/* Search Input */}
          <div className="w-full sm:w-64">
            <SearchInput
              placeholder="Search..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {[
              { id: 'all', label: 'All Statuses' },
              { id: 'active', label: 'Active' },
              { id: 'inactive', label: 'Inactive' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          {canEdit && statuses && statuses.length > 0 && (isSuperAdmin || statuses.some(s => s.companyId !== null)) && (
            <Button
              onClick={() => setIsReorderOpen(true)}
              variant="outlined"
              size="medium"
              startIcon={<ArrowUpDown size={16} />}
              className="px-3.5 py-2 text-slate-600 border-slate-200 hover:bg-slate-50 font-bold"
            >
              Reorder
            </Button>
          )}
          {hasPermission('LEAD_STATUS', 'canCreate') && (
            <Button
              onClick={handleAddClick}
              variant="contained"
              color="primary"
              size="medium"
              startIcon={<Plus size={16} />}
              className="group shadow-sm hover:shadow-md transition-all"
            >
              Add Status
            </Button>
          )}
        </div>
      </div>

      {/* Table section */}
      <Table
        columns={columns}
        data={statuses || []}
        loadingState={loadingState}
        errorMessage={error?.message}
        onRetry={refetch}
        hasActiveFilters={activeFiltersCount > 0}
        onClearFilters={handleClearFilters}
        emptyTitle="No lead statuses found"
        emptyDescription="Get started by creating your first lead status, or clear filters."
        className="border border-slate-200"
        rowClassName="border-b border-slate-100 last:border-0"
      />

      {/* Pagination */}
      <Pagination
        pagination={pagination}
        onPageChange={setPage}
        isLoading={isLoading || isFetching}
        entityName="lead statuses"
      />


      {/* Overlays */}
      <LeadStatusFormSlideover
        isOpen={isSlideoverOpen}
        mode={slideoverMode}
        status={selectedStatus}
        onClose={() => setIsSlideoverOpen(false)}
      />

      <LeadStatusReorderModal
        isOpen={isReorderOpen}
        onClose={() => setIsReorderOpen(false)}
        statuses={statuses || []}
        isSuperAdmin={isSuperAdmin}
      />

      <ConfirmModal
        isOpen={!!statusToToggle}
        title="Deactivate Lead Status"
        message={`Are you sure you want to deactivate "${statusToToggle?.name}"? Inactive statuses will not be selectable for leads.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        onConfirm={handleConfirmToggle}
        onCancel={() => setStatusToToggle(null)}
        isLoading={toggleMutation.isPending}
        severity="warning"
      />

      <ConfirmModal
        isOpen={!!statusToDelete}
        title="Delete Lead Status"
        message={`Are you sure you want to delete "${statusToDelete?.name}"? This action cannot be undone and will permanently remove this status configuration.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setStatusToDelete(null)}
        isLoading={deleteMutation.isPending}
        severity="error"
      />
    </div>
  );
};

export default LeadStatusPage;
