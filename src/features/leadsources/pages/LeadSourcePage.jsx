// src/features/leadsources/pages/LeadSourcePage.jsx

import React, { useState } from 'react';
import { Plus, Pencil, Power, Compass, MoreVertical, RefreshCcw } from 'lucide-react';
import { Menu, MenuItem, IconButton } from '@mui/material';
import { useAuth } from '../../../app/providers/AuthProvider';
import {
  useLeadSourcesQuery,
  useToggleLeadSourceStatusMutation
} from '../hooks/useLeadSources';
import Button from '../../../shared/components/elements/Button';
import Table from '../../../shared/components/elements/Table';
import SearchInput from '../../../shared/components/elements/SearchInput';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import LeadSourceFormSlideover from '../components/LeadSourceFormSlideover';

const ActionMenu = ({ source, onEdit, onToggleStatus }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event) => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
  };

  const isActive = source.isActive;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <IconButton
        onClick={handleClick}
        size="small"
        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
      >
        <MoreVertical size={18} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 4px 20px rgba(0,0,0,0.08))',
            mt: 0.5,
            borderRadius: '12px',
            minWidth: 160,
            border: '1px solid #f1f5f9',
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
              fontSize: '13px',
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 600,
              color: '#475569',
              gap: '10px',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: '#f8fafc',
              }
            }
          }
        }}
      >
        <MenuItem onClick={(e) => { handleClose(e); onEdit(source); }} sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Pencil size={16} className="text-slate-400" />
          Edit Source
        </MenuItem>
        <MenuItem
          onClick={(e) => { handleClose(e); onToggleStatus(source); }}
          sx={{ display: 'flex', alignItems: 'center', gap: '10px', color: isActive ? '#ef4444 !important' : '#10b981 !important' }}
        >
          <Power size={16} className={isActive ? 'text-red-400' : 'text-emerald-400'} />
          {isActive ? 'Deactivate' : 'Activate'}
        </MenuItem>
      </Menu>
    </div>
  );
};

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
  const loadingState = (isLoading || isFetching)
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
        <div className="flex items-center justify-end">
          <ActionMenu
            source={row}
            onEdit={handleEditClick}
            onToggleStatus={handleToggleClick}
          />
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
    <div className="p-1 md:p-1 max-w-7xl mx-auto flex flex-col gap-4">
      {/* Header section in a white card */}
      <div className="bg-white px-5 py-4 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center text-primary shrink-0 shadow-sm">
            <Compass size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] font-bold text-slate-800 font-heading leading-tight">
                Lead Sources
              </h1>
              <button
                onClick={refetch}
                className="text-slate-400 hover:text-primary transition-colors focus:outline-none"
                title="Refresh Data"
              >
                <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            <p className="text-[13px] text-slate-500 font-medium mt-0.5">
              Manage global default and company-specific lead acquisition channels
            </p>
          </div>
        </div>

        {hasPermission('LEAD_SOURCE', 'canCreate') && (
          <Button
            onClick={handleAddClick}
            variant="contained"
            color="primary"
            startIcon={<Plus size={16} />}
            className="sm:self-center"
          >
            Add Source
          </Button>
        )}
      </div>

      {/* Main Content Area (Matches RoleManagementPage) */}
      <div className="bg-white border border-slate-200/60 p-4">

        {/* Top action bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 w-full bg-white border border-slate-200/60 p-3 mb-4">

          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl w-fit shrink-0">
            {[
              { id: 'all', label: 'All Sources' },
              { id: 'active', label: 'Active' },
              { id: 'inactive', label: 'Inactive' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === tab.id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex w-full lg:w-auto shrink-0 justify-end">
            <div className="w-full sm:w-72">
              <SearchInput
                placeholder="Search sources..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
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
          className=""
          rowClassName="border-b border-slate-100 last:border-0"
        />
      </div>

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
