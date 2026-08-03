// src/features/leadsources/pages/LeadSourcePage.jsx

import React, { useState } from 'react';
import { Plus, Pencil, Power, Compass } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import {
  useLeadSourcesQuery,
  useToggleLeadSourceStatusMutation,
  useCreateLeadSourceMutation,
  useUpdateLeadSourceMutation
} from '../hooks/useLeadSources';
import Button from '../../../shared/components/elements/Button';
import Table from '../../../shared/components/elements/Table';
import SearchInput from '../../../shared/components/elements/SearchInput';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import LeadSourceFormSlideover from '../components/LeadSourceFormSlideover';
import PageHeader from '../../../shared/components/modules/PageHeader';

export const LeadSourcePage = () => {
  const { hasPermission } = useAuth();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Overlay states
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [slideoverMode, setSlideoverMode] = useState('create'); // 'create' | 'edit'
  const [selectedSource, setSelectedSource] = useState(null);
  const [sourceToToggle, setSourceToToggle] = useState(null);

  // Queries & Mutations
  const queryParams = {
    search: searchTerm,
    isActive: statusFilter === 'active' ? 'true' : statusFilter === 'inactive' ? 'false' : undefined
  };

  const { data: sourcesRes, isLoading, isFetching, isError, error, refetch } = useLeadSourcesQuery(queryParams);
  const sources = sourcesRes?.data || [];
  const toggleMutation = useToggleLeadSourceStatusMutation();
  const createMutation = useCreateLeadSourceMutation();
  const updateMutation = useUpdateLeadSourceMutation();

  // Handlers
  const handleAddClick = () => {
    setSlideoverMode('create');
    setSelectedSource(null);
    setIsSlideoverOpen(true);
  };

  const handleEditClick = (source) => {
    setSlideoverMode('edit');
    setSelectedSource(source);
    setIsSlideoverOpen(true);
  };

  const handleToggleClick = (source) => {
    if (source.isActive) {
      // Active -> Inactive requires confirmation
      setSourceToToggle(source);
    } else {
      // Inactive -> Active happens immediately
      toggleMutation.mutate(source.id);
    }
  };

  const handleConfirmToggle = async () => {
    if (sourceToToggle) {
      await toggleMutation.mutateAsync(sourceToToggle.id);
      setSourceToToggle(null);
    }
  };

  // Determine Table Loading State
  const loadingState = (isLoading || isFetching || toggleMutation.isPending || createMutation.isPending || updateMutation.isPending)
    ? 'loading'
    : isError
      ? 'error'
      : !sources || sources.length === 0
        ? 'empty'
        : 'success';

  // Columns definition
  const columns = [
    {
      header: 'Source Name',
      accessorKey: 'name',
      className: 'font-semibold text-slate-800 text-[13px]',
    },
    {
      header: 'Description',
      accessorKey: 'description',
      className: 'text-slate-500 text-[13px] max-w-xs truncate',
      cell: (row) => row.description || <span className="text-slate-300">—</span>
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

  // Render actions column only if user has EDIT permission
  if (hasPermission('LEAD_SOURCE', 'canEdit')) {
    columns.push({
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleEditClick(row)}
            className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
            title="Edit Lead Source"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => handleToggleClick(row)}
            className={`p-1.5 rounded-lg transition-all ${row.isActive
              ? 'text-red-500 hover:bg-red-50'
              : 'text-emerald-500 hover:bg-emerald-50'
              }`}
            title={row.isActive ? 'Deactivate Lead Source' : 'Activate Lead Source'}
          >
            <Power size={15} />
          </button>
        </div>
      )
    });
  }

  const activeFiltersCount = (searchTerm ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  return (
    <div className=" max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header section */}
      <PageHeader
        title="Lead Sources"
        description="Manage global default and company-specific lead acquisition channels"
        icon={Compass}
        actions={
          hasPermission('LEAD_SOURCE', 'canCreate') && (
            <Button
              onClick={handleAddClick}
              variant="contained"
              color="primary"
              startIcon={<Plus size={16} />}
              className="sm:self-center"
            >
              Add Source
            </Button>
          )
        }
      />

      <section>
        {/* Filter tab bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4  border-x border-t border-slate-200/60 ">
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl w-fit">
            {[
              { id: 'all', label: 'All Sources' },
              { id: 'active', label: 'Active' },
              { id: 'inactive', label: 'Inactive' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === tab.id
                  ? 'bg-white text-slate-800 '
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full md:w-72">
            <SearchInput
              placeholder="Search sources..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
        </div>

        {/* Table section */}
        <Table
          columns={columns}
          data={sources || []}
          loadingState={loadingState}
          errorMessage={error?.message}
          onRetry={refetch}
          hasActiveFilters={activeFiltersCount > 0}
          onClearFilters={handleClearFilters}
          emptyTitle="No lead sources found"
          emptyDescription="Get started by creating your first lead source channel, or clear filters."
          className="  border border-slate-200/60"
          rowClassName="border-b border-slate-100 last:border-0"
        />


      </section>

      {/* Overlays */}
      <LeadSourceFormSlideover
        isOpen={isSlideoverOpen}
        mode={slideoverMode}
        source={selectedSource}
        onClose={() => setIsSlideoverOpen(false)}
      />

      <ConfirmModal
        isOpen={!!sourceToToggle}
        title="Deactivate Lead Source"
        message={`Are you sure you want to deactivate "${sourceToToggle?.name}"? Inactive sources will not be selectable for new leads.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        onConfirm={handleConfirmToggle}
        onCancel={() => setSourceToToggle(null)}
        isLoading={toggleMutation.isPending}
        severity="error"
      />
    </div>
  );
};

export default LeadSourcePage;
