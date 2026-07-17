import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  Kanban,
  SearchX,
  User,
  ShieldAlert,
  Compass,
  Award,
  Activity,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import useListManager from '../../../shared/hooks/useListManager';
import {
  useLeadsQuery,
  useLeadFormDataQuery,
  useDeleteLeadMutation
} from '../hooks/useLeads';

// Shared UI elements
import Button from '../../../shared/components/elements/Button';
import Table from '../../../shared/components/elements/Table';
import Pagination from '../../../shared/components/elements/Pagination';
import SearchInput from '../../../shared/components/elements/SearchInput';
import SelectField from '../../../shared/components/elements/SelectField';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';

// Feature overlays
import LeadCreateModal from '../components/LeadCreateModal';
import LeadEditModal from '../components/LeadEditModal';
import LeadDetailDrawer from '../components/LeadDetailDrawer';

export const LeadsPage = () => {
  const navigate = useNavigate();
  const { user: currentUser, hasPermission } = useAuth();
  const { forceHideLoader } = useLoader();

  // Overlay states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState(null);
  const [selectedLeadForView, setSelectedLeadForView] = useState(null);
  const [selectedLeadForDelete, setSelectedLeadForDelete] = useState(null);

  // List filter manager hook
  const {
    search,
    handleSearchChange,
    page,
    setPage,
    filters,
    handleFilterChange,
    clearFilters,
    sortBy,
    sortOrder,
    toggleSort,
    hasActiveFilters,
    queryParams,
    getLoadingState
  } = useListManager({
    defaultSort: { field: 'createdAt', order: 'desc' },
    defaultLimit: 10,
    initialFilters: {
      sourceId: '',
      courseId: '',
      statusId: '',
      priority: '',
      assignedToId: ''
    }
  });

  // Query leads & drop options
  const { data: leadsData, isLoading, isFetching, isError, error, refetch } = useLeadsQuery(queryParams);
  const { data: formDataRes, isLoading: isLoadingFormData } = useLeadFormDataQuery();
  const deleteLeadMutation = useDeleteLeadMutation();

  const leads = leadsData?.data?.leads || [];
  const paginationRaw = leadsData?.data?.pagination || {};

  // Map backend pages count to Pagination totalPages format
  const pagination = useMemo(() => {
    return {
      page: paginationRaw.page || 1,
      limit: paginationRaw.limit || 10,
      total: paginationRaw.total || 0,
      totalPages: paginationRaw.pages || 1
    };
  }, [paginationRaw]);

  // Derived loading state
  const loadingState = getLoadingState(isLoading || isFetching, isError, leads.length);

  // Handlers
  const handleDeleteConfirm = () => {
    if (!selectedLeadForDelete) return;
    deleteLeadMutation.mutate(selectedLeadForDelete.id, {
      onSuccess: () => {
        setSelectedLeadForDelete(null);
      }
    });
  };

  // Format dropdown items
  const formData = formDataRes?.data || formDataRes || {};
  const sourcesOptions = (formData.sources || []).map((s) => ({ value: s.id.toString(), label: s.name }));
  const coursesOptions = (formData.courses || []).map((c) => ({ value: c.id.toString(), label: c.name }));
  const statusesOptions = (formData.statuses || []).map((s) => ({ value: s.id.toString(), label: s.name }));

  const priorityOptions = [
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' }
  ];

  const assigneeOptions = (formData.users || []).map((u) => ({ value: u.id.toString(), label: u.name }));

  // Table Columns
  const columns = [
    {
      header: '#',
      cell: (row, i) => (
        <span className="text-[11px] text-slate-400 font-semibold font-mono">
          {(page - 1) * pagination.limit + i + 1}
        </span>
      )
    },
    {
      header: 'Lead Name',
      sortable: true,
      accessorKey: 'name',
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-slate-900 hover:text-primary transition-colors cursor-pointer" onClick={() => setSelectedLeadForView(row)}>
            {row.name}
          </p>
          {row.email ? (
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium truncate max-w-[200px]">
              {row.email}
            </p>
          ) : null}
        </div>
      )
    },
    {
      header: 'Mobile',
      cell: (row) => (
        <div className="text-[12px] font-semibold text-slate-700">
          <p>{row.mobile}</p>
          {row.alternateMobile ? (
            <p className="text-[10px] text-slate-400 font-medium">Alt: {row.alternateMobile}</p>
          ) : null}
        </div>
      )
    },
    {
      header: 'Source',
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-lg border border-slate-200/50">
          <Compass size={11} className="text-slate-400" />
          {row.source?.name || '—'}
        </span>
      )
    },
    {
      header: 'Course/Product',
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-lg border border-slate-200/50">
          <Award size={11} className="text-slate-400" />
          {row.course?.name || '—'}
        </span>
      )
    },
    {
      header: 'Status',
      cell: (row) => {
        if (!row.status) return <span className="text-slate-400 text-[12px]">—</span>;
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
            style={{
              backgroundColor: row.status.displayColor + '16',
              color: row.status.displayColor,
              borderColor: row.status.displayColor + '30'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: row.status.displayColor }} />
            {row.status.name}
          </span>
        );
      }
    },
    {
      header: 'Priority',
      sortable: true,
      accessorKey: 'priority',
      cell: (row) => {
        const priorityColors = {
          HIGH: 'text-red-700 bg-red-50 border-red-200/50',
          MEDIUM: 'text-amber-700 bg-amber-50 border-amber-200/50',
          LOW: 'text-green-700 bg-green-50 border-green-200/50'
        };
        const style = priorityColors[row.priority] || priorityColors.MEDIUM;
        return (
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${style}`}>
            <ShieldAlert size={10} />
            {row.priority || 'MEDIUM'}
          </span>
        );
      }
    },
    {
      header: 'Assigned To',
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600">
          <User size={11} className="text-slate-400" />
          {row.assignedTo?.name || <span className="text-slate-400 italic font-normal">Unassigned</span>}
        </span>
      )
    },
    {
      header: 'Created',
      sortable: true,
      accessorKey: 'createdAt',
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-500">
          <Calendar size={11} className="text-slate-400" />
          {new Date(row.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
          <button
            onClick={() => setSelectedLeadForView(row)}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all"
            title="View Details"
          >
            <Eye size={15} />
          </button>
          {hasPermission('LEAD', 'canEdit') && (
            <button
              onClick={() => setSelectedLeadForEdit(row)}
              className="p-1 text-slate-400 hover:text-primary hover:bg-orange-50 rounded-md transition-all"
              title="Edit Lead"
            >
              <Pencil size={15} />
            </button>
          )}
          {hasPermission('LEAD', 'canDelete') && (
            <button
              onClick={() => setSelectedLeadForDelete(row)}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
              title="Delete Lead"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-1 max-w-7xl mx-auto flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Header section in a white card */}
      <div className="bg-white px-5 py-4 border border-slate-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center text-primary shrink-0 shadow-sm">
            <User size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] font-bold text-slate-800 font-heading leading-tight">
                Leads Registry
              </h1>
              <button
                onClick={refetch}
                className="text-slate-400 hover:text-primary transition-colors focus:outline-none"
                title="Refresh Data"
              >
                <RefreshCw size={14} className={isLoading || isFetching ? 'animate-spin' : ''} />
              </button>
            </div>
            <p className="text-[13px] text-slate-500 font-medium mt-0.5">
              Capture, organize, segment, and route sales pipeline contacts dynamically.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outlined"
            onClick={() => navigate('/pipelines')}
            startIcon={<Kanban size={16} />}
            sx={{
              borderColor: '#E2E8F0',
              color: '#475569',
              '&:hover': {
                borderColor: '#CBD5E1',
                bgcolor: '#F8FAFC'
              }
            }}
          >
            Kanban Boards
          </Button>

          {hasPermission('LEAD', 'canCreate') && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsCreateOpen(true)}
              startIcon={<Plus size={16} />}
            >
              Add Lead
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area (Matches LeadSourcePage) */}
      <div className="bg-white border border-slate-200/60 p-4">
        {/* Top action bar */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 w-full bg-white border border-slate-200/60 p-3 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name, mobile, email..."
              className="flex-1 min-w-[280px]"
            />

            <div className="flex flex-wrap items-center gap-2">
              <div className="w-[150px]">
                <SelectField
                  id="filter-source"
                  placeholder="All Sources"
                  allowEmptyOption
                  value={filters.sourceId}
                  onChange={(val) => handleFilterChange('sourceId', val)}
                  options={sourcesOptions}
                  searchable={true}
                  isLoading={isLoadingFormData}
                />
              </div>
              <div className="w-[150px]">
                <SelectField
                  id="filter-course"
                  placeholder="All Courses"
                  allowEmptyOption
                  value={filters.courseId}
                  onChange={(val) => handleFilterChange('courseId', val)}
                  options={coursesOptions}
                  searchable={true}
                  isLoading={isLoadingFormData}
                />
              </div>
              <div className="w-[150px]">
                <SelectField
                  id="filter-status"
                  placeholder="All Statuses"
                  allowEmptyOption
                  value={filters.statusId}
                  onChange={(val) => handleFilterChange('statusId', val)}
                  options={statusesOptions}
                  searchable={true}
                  isLoading={isLoadingFormData}
                />
              </div>
              <div className="w-[130px]">
                <SelectField
                  id="filter-priority"
                  placeholder="All Priorities"
                  allowEmptyOption
                  value={filters.priority}
                  onChange={(val) => handleFilterChange('priority', val)}
                  options={priorityOptions}
                  searchable={false}
                />
              </div>
              <div className="w-[150px]">
                <SelectField
                  id="filter-assignee"
                  placeholder="All Assignees"
                  allowEmptyOption
                  value={filters.assignedToId}
                  onChange={(val) => handleFilterChange('assignedToId', val)}
                  options={assigneeOptions}
                  searchable={true}
                  isLoading={isLoadingFormData}
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() =>
                    clearFilters({
                      sourceId: '',
                      courseId: '',
                      statusId: '',
                      priority: '',
                      assignedToId: ''
                    })
                  }
                  className="flex items-center gap-1.5 px-3.5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[12px] transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <SearchX size={14} />
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              className="flex items-center justify-center h-11 w-11 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh List"
            >
              <RefreshCw size={15} className={`${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Main Table Content */}
        <Table
          columns={columns}
          data={leads}
          loadingState={loadingState}
          errorMessage={error?.message || 'Something went wrong.'}
          onRetry={refetch}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() =>
            clearFilters({
              sourceId: '',
              courseId: '',
              statusId: '',
              priority: '',
              assignedToId: ''
            })
          }
          emptyTitle="No leads registered"
          emptyDescription="Manually add a lead or import them from Excel to get started."
          className=""
          rowClassName="group border-b border-slate-100 last:border-0"
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={toggleSort}
        />

        {/* Pagination Footer */}
        {leads.length > 0 && (
          <div className="flex justify-end mt-4">
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
              isLoading={isLoading || isFetching}
              entityName="leads"
            />
          </div>
        )}
      </div>

      {/* Dialog Overlays */}
      <LeadCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => refetch()}
      />

      {selectedLeadForEdit && (
        <LeadEditModal
          lead={selectedLeadForEdit}
          onClose={() => setSelectedLeadForEdit(null)}
          onUpdated={() => refetch()}
        />
      )}

      {selectedLeadForView && (
        <LeadDetailDrawer
          lead={selectedLeadForView}
          onClose={() => setSelectedLeadForView(null)}
        />
      )}

      <ConfirmModal
        isOpen={!!selectedLeadForDelete}
        onClose={() => setSelectedLeadForDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Lead"
        message={`Are you sure you want to delete lead "${selectedLeadForDelete?.name}"? All related notes and activity records will be archived.`}
        confirmText="Archive Lead"
        cancelText="Cancel"
        danger
        isLoading={deleteLeadMutation.isPending}
      />
    </div>
  );
};

export default LeadsPage;
