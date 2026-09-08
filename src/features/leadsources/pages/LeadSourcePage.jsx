// src/features/leadsources/pages/LeadSourcePage.jsx

import React, { useState } from 'react';
import { Plus, Pencil, Power, Compass, MoreVertical } from 'lucide-react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
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
import Pagination from '../../../shared/components/elements/Pagination';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import LeadSourceFormSlideover from '../components/LeadSourceFormSlideover';
import PageHeader from '../../../shared/components/modules/PageHeader';

export const LeadSourcePage = () => {
  const { hasPermission } = useAuth();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Overlay states
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [slideoverMode, setSlideoverMode] = useState('create'); // 'create' | 'edit'
  const [selectedSource, setSelectedSource] = useState(null);
  const [sourceToToggle, setSourceToToggle] = useState(null);

  // Queries & Mutations
  const queryParams = {
    page,
    limit,
    search: searchTerm,
    isActive: statusFilter === 'active' ? 'true' : statusFilter === 'inactive' ? 'false' : undefined
  };

  const { data: sourcesRes, isLoading, isFetching, isError, error, refetch } = useLeadSourcesQuery(queryParams);
  const rawSources = sourcesRes?.sources || sourcesRes?.data?.sources || (Array.isArray(sourcesRes?.data) ? sourcesRes.data : []);
  const sources = Array.isArray(rawSources) ? rawSources : [];
  const pagination = sourcesRes?.pagination || sourcesRes?.data?.pagination || { page, limit, total: sources.length, totalPages: Math.ceil(sources.length / limit) || 1 };
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

  const SourceActionsMenu = ({ source }) => {
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
              handleEditClick(source);
            }}
            className="px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800"
            sx={{ display: 'flex', items: 'center', gap: '10px' }}
          >
            <Pencil size={14} className="text-slate-400" />
            <span>Edit Source</span>
          </MenuItem>

          <MenuItem
            onClick={() => {
              handleClose();
              handleToggleClick(source);
            }}
            className="px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800 border-t border-slate-100/50"
            sx={{ display: 'flex', items: 'center', gap: '10px' }}
          >
            <Power size={14} className={source.isActive ? 'text-amber-500' : 'text-emerald-500'} />
            <span>{source.isActive ? 'Deactivate Source' : 'Activate Source'}</span>
          </MenuItem>
        </Menu>
      </>
    );
  };

  // Render actions column only if user has EDIT permission
  if (hasPermission('LEAD_SOURCE', 'canEdit')) {
    columns.push({
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end">
          <SourceActionsMenu source={row} />
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
    <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Header section */}
      <PageHeader
        title="Lead Sources"
        description="Manage global default and company-specific lead acquisition channels"
        icon={Compass}
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
              { id: 'all', label: 'All Sources' },
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
          {hasPermission('LEAD_SOURCE', 'canCreate') && (
            <Button
              onClick={handleAddClick}
              variant="contained"
              color="primary"
              size="medium"
              startIcon={<Plus size={16} />}
              className="group shadow-sm hover:shadow-md transition-all"
            >
              Add Source
            </Button>
          )}
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
        className="border border-slate-200"
        rowClassName="border-b border-slate-100 last:border-0"
      />

      {/* Pagination */}
      <Pagination
        pagination={pagination}
        onPageChange={setPage}
        isLoading={isLoading || isFetching}
        entityName="lead sources"
      />

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
