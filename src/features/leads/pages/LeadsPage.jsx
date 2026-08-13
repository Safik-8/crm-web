import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Dialog, Checkbox, Menu, MenuItem } from '@mui/material';
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
  Calendar,
  FileSpreadsheet,
  Download,
  SlidersHorizontal,
  BookmarkPlus,
  Bookmark,
  X,
  MoreVertical,
  UserCheck,
  ClipboardList,
  HelpCircle,
  Users
} from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import useListManager from '../../../shared/hooks/useListManager';
import {
  useLeadsQuery,
  useLeadFormDataQuery,
  useDeleteLeadMutation,
  useDeleteAllLeadsMutation,
  useUserPreferencesQuery,
  useUpdateUserPreferencesMutation
} from '../hooks/useLeads';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '../../company/services/companyService';
import { branchService } from '../../branch/services/branchService';
import { teamService } from '../../teams/services/teamService';

// Shared UI elements
import Button from '../../../shared/components/elements/Button';

import PageHeader from '../../../shared/components/modules/PageHeader';
import Table from '../../../shared/components/elements/Table';
import Pagination from '../../../shared/components/elements/Pagination';
import SearchInput from '../../../shared/components/elements/SearchInput';
import SelectField from '../../../shared/components/elements/SelectField';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import Drawer from '../../../shared/components/elements/Drawer';
import TextField from '../../../shared/components/elements/TextField';

// Feature overlays
import LeadCreateModal from '../components/LeadCreateModal';
import LeadEditModal from '../components/LeadEditModal';
import LeadDetailDrawer from '../components/LeadDetailDrawer';
import LeadImportModal from '../components/LeadImportModal';
import AssignLeadDrawer from '../components/AssignLeadDrawer';

const RowActionsMenu = ({
  row,
  onViewDetails,
  onEdit,
  onAssign,
  onDelete,
  hasPermission
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (callback) => {
    handleClose();
    callback(row);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
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
          onClick={() => handleAction(onViewDetails)}
          className="px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800"
          sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <Eye size={14} className="text-slate-400" />
          <span>View Details</span>
        </MenuItem>

        {hasPermission('LEAD', 'canEdit') && (
          <MenuItem
            onClick={() => handleAction(onEdit)}
            className="px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800 border-t border-slate-100/50"
            sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Pencil size={13} className="text-slate-400" />
            <span>Edit Lead</span>
          </MenuItem>
        )}

        {(hasPermission('LEAD_ASSIGNMENT', 'canCreate') || hasPermission('LEAD_ASSIGNMENT', 'canEdit')) && (
          <MenuItem
            onClick={() => handleAction(onAssign)}
            className="px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800 border-t border-slate-100/50"
            sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <UserCheck size={14} className="text-slate-400" />
            <span>Assign Lead</span>
          </MenuItem>
        )}

        {hasPermission('LEAD', 'canDelete') && (
          <MenuItem
            onClick={() => handleAction(onDelete)}
            className="px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-rose-600 hover:text-rose-700 hover:bg-rose-50/30 border-t border-slate-100/50"
            sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Trash2 size={13} className="text-rose-400" />
            <span>Delete Lead</span>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export const LeadsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user: currentUser, hasPermission } = useAuth();
  const { forceHideLoader } = useLoader();

  // Overlay states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState(null);
  const [selectedLeadForView, setSelectedLeadForView] = useState(null);
  const [selectedLeadForDelete, setSelectedLeadForDelete] = useState(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);

  // Auto-open lead detail drawer if navigated from Opportunity or external link with detailId/leadId
  useEffect(() => {
    const targetLeadId = searchParams.get('detailId') || searchParams.get('leadId') || location.state?.openLeadId;
    if (targetLeadId) {
      const numericId = Number(targetLeadId);
      if (!isNaN(numericId) && numericId > 0) {
        setSelectedLeadForView((prev) => (prev?.id === numericId ? prev : { id: numericId }));
      }
    }
  }, [searchParams, location.state]);

  // Lead assignment states
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [leadsToAssign, setLeadsToAssign] = useState([]);

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
      companyId: '',
      branchId: '',
      teamId: '',
      sourceId: '',
      courseId: '',
      statusId: '',
      priority: '',
      assignedToId: '',
      dateFrom: '',
      dateTo: ''
    }
  });

  // Local temporary filter states (does not trigger backend query until Apply is clicked)
  const [tempFilters, setTempFilters] = useState({
    companyId: '',
    branchId: '',
    teamId: '',
    sourceId: '',
    courseId: '',
    statusId: '',
    priority: '',
    assignedToId: '',
    dateFrom: '',
    dateTo: ''
  });

  // Sync tempFilters with current filters when Drawer opens
  useEffect(() => {
    if (isFilterOpen) {
      setTempFilters({
        companyId: filters.companyId || '',
        branchId: filters.branchId || '',
        teamId: filters.teamId || '',
        sourceId: filters.sourceId || '',
        courseId: filters.courseId || '',
        statusId: filters.statusId || '',
        priority: filters.priority || '',
        assignedToId: filters.assignedToId || '',
        dateFrom: filters.dateFrom || '',
        dateTo: filters.dateTo || ''
      });
    }
  }, [isFilterOpen, filters]);

  const handleTempFilterChange = (field, val) => {
    setTempFilters((prev) => ({
      ...prev,
      [field]: val
    }));
  };

  // User preferences (Saved filters)
  const { data: preferencesRes } = useUserPreferencesQuery();
  const updatePreferencesMutation = useUpdateUserPreferencesMutation();

  const sessionPreferences = preferencesRes?.data?.sessionPreferences || preferencesRes?.sessionPreferences || {};
  const savedFiltersList = sessionPreferences?.savedLeadFilters || [];

  const [filterName, setFilterName] = useState('');
  const [filterModalConfig, setFilterModalConfig] = useState({ isOpen: false, mode: 'save', filterId: null });
  const [deletingFilterId, setDeletingFilterId] = useState(null);

  // Save or Rename filter handler
  const handleSaveOrRenameFilter = () => {
    const trimmedName = filterName.trim();
    if (!trimmedName) return;

    if (filterModalConfig.mode === 'save') {
      // Check duplicate name
      const nameExists = savedFiltersList.some(
        (sf) => sf.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (nameExists) {
        toast.error(`A saved filter with the name "${trimmedName}" already exists.`);
        return;
      }

      const newSavedFilter = {
        id: crypto.randomUUID(),
        name: trimmedName,
        filters: {
          companyId: filters.companyId || '',
          branchId: filters.branchId || '',
          teamId: filters.teamId || '',
          sourceId: filters.sourceId || '',
          courseId: filters.courseId || '',
          statusId: filters.statusId || '',
          priority: filters.priority || '',
          assignedToId: filters.assignedToId || '',
          dateFrom: filters.dateFrom || '',
          dateTo: filters.dateTo || ''
        }
      };

      const updatedFilters = [...savedFiltersList, newSavedFilter];

      updatePreferencesMutation.mutate({
        ...sessionPreferences,
        savedLeadFilters: updatedFilters
      }, {
        onSuccess: () => {
          toast.success(`Filter "${trimmedName}" saved successfully`);
          setFilterName('');
          setFilterModalConfig({ isOpen: false, mode: 'save', filterId: null });
        }
      });
    } else if (filterModalConfig.mode === 'rename') {
      // Check duplicate name except itself
      const nameExists = savedFiltersList.some(
        (sf) => sf.id !== filterModalConfig.filterId && sf.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (nameExists) {
        toast.error(`A saved filter with the name "${trimmedName}" already exists.`);
        return;
      }

      const updatedFilters = savedFiltersList.map(sf =>
        sf.id === filterModalConfig.filterId ? { ...sf, name: trimmedName } : sf
      );

      updatePreferencesMutation.mutate({
        ...sessionPreferences,
        savedLeadFilters: updatedFilters
      }, {
        onSuccess: () => {
          toast.success('Filter renamed successfully');
          setFilterName('');
          setFilterModalConfig({ isOpen: false, mode: 'save', filterId: null });
        }
      });
    }
  };

  // Delete saved filter handler
  const handleDeleteFilter = () => {
    if (!deletingFilterId) return;
    const targetId = deletingFilterId;
    setDeletingFilterId(null); // Close modal instantly

    const updatedFilters = savedFiltersList.filter(sf => String(sf.id) !== String(targetId));

    updatePreferencesMutation.mutate({
      ...sessionPreferences,
      savedLeadFilters: updatedFilters
    }, {
      onSuccess: () => {
        toast.success('Saved filter removed');
        // Clear filters to show all data
        const cleared = {
          companyId: '',
          branchId: '',
          teamId: '',
          sourceId: '',
          courseId: '',
          statusId: '',
          priority: '',
          assignedToId: '',
          dateFrom: '',
          dateTo: ''
        };
        clearFilters(cleared);
        setTempFilters(cleared);
      }
    });
  };

  // Update saved filter preset with current active filters
  const handleUpdateFilterValues = (filterId) => {
    const selected = savedFiltersList.find((sf) => String(sf.id) === String(filterId));
    if (!selected) return;

    const updatedFilters = savedFiltersList.map(sf =>
      String(sf.id) === String(filterId) ? {
        ...sf,
        filters: {
          companyId: filters.companyId || '',
          branchId: filters.branchId || '',
          teamId: filters.teamId || '',
          sourceId: filters.sourceId || '',
          courseId: filters.courseId || '',
          statusId: filters.statusId || '',
          priority: filters.priority || '',
          assignedToId: filters.assignedToId || '',
          dateFrom: filters.dateFrom || '',
          dateTo: filters.dateTo || ''
        }
      } : sf
    );

    updatePreferencesMutation.mutate({
      ...sessionPreferences,
      savedLeadFilters: updatedFilters
    }, {
      onSuccess: () => {
        toast.success(`Filter "${selected.name}" updated successfully`);
      }
    });
  };

  // Query leads & drop options
  const { data: leadsData, isLoading, isFetching, isError, error, refetch } = useLeadsQuery(queryParams);
  const { data: formDataRes, isLoading: isLoadingFormData } = useLeadFormDataQuery();
  const deleteLeadMutation = useDeleteLeadMutation();
  const deleteAllLeadsMutation = useDeleteAllLeadsMutation();

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

  // Active saved filter matching current active filters
  const activeSavedFilterId = useMemo(() => {
    const filterKeys = ['companyId', 'branchId', 'teamId', 'sourceId', 'courseId', 'statusId', 'priority', 'assignedToId', 'dateFrom', 'dateTo'];
    const hasAnyFilter = filterKeys.some(key => filters[key] !== '' && filters[key] !== null && filters[key] !== undefined);
    if (!hasAnyFilter) return '';

    const active = savedFiltersList.find((sf) => {
      return filterKeys.every((key) => {
        const filterVal = filters[key];
        const savedVal = sf.filters?.[key];
        const normalizedFilterVal = (filterVal === null || filterVal === undefined) ? '' : String(filterVal).trim().toLowerCase();
        const normalizedSavedVal = (savedVal === null || savedVal === undefined) ? '' : String(savedVal).trim().toLowerCase();
        return normalizedFilterVal === normalizedSavedVal;
      });
    });
    return active ? String(active.id) : '';
  }, [savedFiltersList, filters]);

  // Handlers
  const handleDeleteConfirm = () => {
    if (!selectedLeadForDelete) return;
    deleteLeadMutation.mutate(selectedLeadForDelete.id, {
      onSuccess: () => {
        setSelectedLeadForDelete(null);
      }
    });
  };

  const handleDeleteAllConfirm = () => {
    deleteAllLeadsMutation.mutate(null, {
      onSuccess: () => {
        setIsDeleteAllOpen(false);
      }
    });
  };



  // Role-based scope permissions
  const role = currentUser?.primaryRole;
  const canSelectCompany = role === 'SUPER_ADMIN';
  const canSelectBranch = role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN';

  // Fetch Companies (for Super Admin)
  const { data: companiesRes } = useQuery({
    queryKey: ['companies-filter-options'],
    queryFn: () => companyService.getCompaniesRaw(),
    enabled: canSelectCompany
  });

  const rawCompanies = Array.isArray(companiesRes)
    ? companiesRes
    : (Array.isArray(companiesRes?.data) ? companiesRes.data : (companiesRes?.data?.companies || []));

  const companyOptions = rawCompanies.map(c => ({
    value: c.id.toString(),
    label: `${c.name} (${c.code})`
  }));

  // Target company ID for branch query
  const targetCompanyId = canSelectCompany ? tempFilters.companyId : currentUser?.companyId;

  // Fetch Branches
  const { data: branchesRes } = useQuery({
    queryKey: ['branches-filter-options', targetCompanyId],
    queryFn: () => branchService.getBranchesRaw(targetCompanyId),
    enabled: !!targetCompanyId && canSelectBranch
  });

  const rawBranches = Array.isArray(branchesRes)
    ? branchesRes
    : (Array.isArray(branchesRes?.data) ? branchesRes.data : (branchesRes?.data?.branches || []));

  const branchOptions = rawBranches.map(b => ({
    value: b.id.toString(),
    label: `${b.name} (${b.code})`
  }));

  // Fetch Teams
  const { data: teamsRes } = useQuery({
    queryKey: ['teams-filter-options'],
    queryFn: () => teamService.getTeams({ limit: 1000 })
  });

  const rawTeams = Array.isArray(teamsRes)
    ? teamsRes
    : (Array.isArray(teamsRes?.data) ? teamsRes.data : (teamsRes?.data?.teams || []));

  const teamOptions = rawTeams.map(t => ({
    value: t.id.toString(),
    label: t.name
  }));

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
        if ((row.opportunities && row.opportunities.length > 0) || row.isConverted) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              CONVERTED
            </span>
          );
        }
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
      cell: (row) => {
        if (row.assignedTo) {
          const roleName = row.assignedTo.userRoles?.[0]?.role?.name || row.assignedTo.primaryRole || 'Sales Rep';
          return (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-700">
              <User size={12} className="text-slate-400" />
              <span>Person: {row.assignedTo.name} ({roleName})</span>
            </span>
          );
        } else if (row.team) {
          return (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-orange-600">
              <Users size={12} className="text-orange-400" />
              <span>Team: {row.team.name}</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-400 italic">
            <HelpCircle size={12} className="text-slate-300" />
            <span>Unassigned</span>
          </span>
        );
      }
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
      header: (() => {
        const unassignedLeads = leads.filter(l => !l.assignedToId && !l.teamId);
        const isAllSelected = unassignedLeads.length > 0 && unassignedLeads.every(l => selectedLeadIds.includes(l.id));
        const isSomeSelected = selectedLeadIds.length > 0 && !isAllSelected;
        return (
          <Checkbox
            checked={isAllSelected}
            indeterminate={isSomeSelected}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedLeadIds(unassignedLeads.map(l => l.id));
              } else {
                setSelectedLeadIds([]);
              }
            }}
            size="small"
          />
        );
      })(),
      cell: (row) => {
        const isAssigned = !!row.assignedToId || !!row.teamId;
        return (
          <Checkbox
            checked={selectedLeadIds.includes(row.id)}
            disabled={isAssigned}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedLeadIds(prev => [...prev, row.id]);
              } else {
                setSelectedLeadIds(prev => prev.filter(id => id !== row.id));
              }
            }}
            size="small"
          />
        );
      }
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <RowActionsMenu
            row={row}
            onViewDetails={setSelectedLeadForView}
            onEdit={setSelectedLeadForEdit}
            onAssign={(r) => {
              setLeadsToAssign([r]);
              setIsAssignOpen(true);
            }}
            onDelete={setSelectedLeadForDelete}
            hasPermission={hasPermission}
          />
        </div>
      )
    }
  ];

  return (
    <div className=" max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHeader
        title="Leads Registry"
        description="Capture, track, and convert leads."
        icon={ClipboardList}
        actions={
          <>
            {selectedLeadIds.length > 0 && (hasPermission('LEAD_ASSIGNMENT', 'canCreate') || hasPermission('LEAD_ASSIGNMENT', 'canEdit')) && (
              <Button
                variant="contained"
                onClick={() => {
                  const selectedLeads = leads.filter(l => selectedLeadIds.includes(l.id));
                  setLeadsToAssign(selectedLeads);
                  setIsAssignOpen(true);
                }}
                startIcon={<UserCheck size={16} />}
                sx={{
                  backgroundColor: '#F86F03',
                  '&:hover': { backgroundColor: '#DE5D02' }
                }}
              >
                Assign Selected ({selectedLeadIds.length})
              </Button>
            )}

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

            {hasPermission('LEAD', 'canDelete') && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setIsDeleteAllOpen(true)}
                startIcon={<Trash2 size={16} />}
                sx={{
                  borderColor: '#FEE2E2',
                  color: '#EF4444',
                  '&:hover': {
                    borderColor: '#FCA5A5',
                    bgcolor: '#FEF2F2'
                  }
                }}
              >
                Delete All
              </Button>
            )}

            {hasPermission('LEAD', 'canCreate') && (
              <div className="flex gap-2">
                <Button
                  variant="outlined"
                  onClick={() => setIsImportOpen(true)}
                  startIcon={<FileSpreadsheet size={16} />}
                  sx={{
                    borderColor: '#E2E8F0',
                    color: '#475569',
                    '&:hover': {
                      borderColor: '#CBD5E1',
                      bgcolor: '#F8FAFC'
                    }
                  }}
                >
                  Import Leads
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setIsCreateOpen(true)}
                  startIcon={<Plus size={16} />}
                >
                  Add Lead
                </Button>
              </div>
            )}
          </>
        }
      />



      <section className=''>

        {/* Toolbar Filter Panel */}
        <div className="bg-white border-x border-t border-slate-200/60  p-4 ">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name, mobile, email..."
              className="flex-1 min-w-[280px]"
            />

            <div className="flex items-center gap-2">
              {savedFiltersList.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-[160px]">
                    <SelectField
                      id="apply-saved-filter-select"
                      placeholder="Saved Filters"
                      allowEmptyOption
                      value={activeSavedFilterId}
                      onChange={(val) => {
                        if (val) {
                          const selected = savedFiltersList.find((sf) => String(sf.id) === String(val));
                          if (selected) {
                            const defaultEmptyFilters = {
                              companyId: '',
                              branchId: '',
                              teamId: '',
                              sourceId: '',
                              courseId: '',
                              statusId: '',
                              priority: '',
                              assignedToId: '',
                              dateFrom: '',
                              dateTo: ''
                            };
                            handleFilterChange({
                              ...defaultEmptyFilters,
                              ...selected.filters
                            });
                            toast.success(`Applied filter "${selected.name}"`);
                          }
                        } else {
                          clearFilters({
                            companyId: '',
                            branchId: '',
                            teamId: '',
                            sourceId: '',
                            courseId: '',
                            statusId: '',
                            priority: '',
                            assignedToId: '',
                            dateFrom: '',
                            dateTo: ''
                          });
                        }
                      }}
                      options={savedFiltersList.map((sf) => ({ value: sf.id, label: sf.name }))}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsFilterOpen(true)}
                className={`flex items-center gap-2 px-4 h-11 border rounded-xl text-sm font-semibold transition-all cursor-pointer ${hasActiveFilters
                    ? 'border-orange-200 bg-orange-50/50 text-orange-600 hover:bg-orange-100/60'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <SlidersHorizontal size={15} />
                Filters
                {hasActiveFilters && (
                  <span className="flex items-center justify-center bg-orange-500 text-white text-[10px] font-black h-5 w-5 rounded-full">
                    {Object.values(filters).filter(Boolean).length}
                  </span>
                )}
              </button>

              {hasActiveFilters && (
                <div className="flex items-center gap-2">
                  {!activeSavedFilterId && (
                    <button
                      onClick={() => setFilterModalConfig({ isOpen: true, mode: 'save', filterId: null })}
                      className="flex items-center gap-1.5 px-3.5 h-11 bg-orange-50 hover:bg-orange-100/80 text-orange-600 font-semibold rounded-xl text-[12px] transition-all cursor-pointer border border-orange-200/50  active:scale-95"
                      title="Save current filters as preset"
                    >
                      <BookmarkPlus size={14} />
                      Save Preset
                    </button>
                  )}
                  <button
                    onClick={() =>
                      clearFilters({
                        companyId: '',
                        branchId: '',
                        teamId: '',
                        sourceId: '',
                        courseId: '',
                        statusId: '',
                        priority: '',
                        assignedToId: '',
                        dateFrom: '',
                        dateTo: ''
                      })
                    }
                    className="flex items-center gap-1.5 px-3.5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[12px] transition-all cursor-pointer  active:scale-95"
                  >
                    <SearchX size={14} />
                    Clear
                  </button>
                </div>
              )}

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
              assignedToId: '',
              dateFrom: '',
              dateTo: ''
            })
          }
          emptyTitle="No leads registered"
          emptyDescription="Manually add a lead or import them from Excel to get started."
          className=" shadow-[0_4px_16px_rgba(0,0,0,0.02)]"
          rowClassName="group"
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


      </section>


      {/* Slide-over Filter Drawer */}
      <Drawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter Leads"
        subtitle="Apply segmentation and business routing rules"
      >
        <div className="flex flex-col h-full justify-between">
          <div className="space-y-5">
            {savedFiltersList.length > 0 && (
              <div className="border-b border-slate-100 pb-5 mb-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Your Saved Filters</label>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {savedFiltersList.map((sf) => (
                    <div key={sf.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-all group/item">
                      <button
                        onClick={() => {
                          const defaultEmptyFilters = {
                            sourceId: '',
                            courseId: '',
                            statusId: '',
                            priority: '',
                            assignedToId: '',
                            dateFrom: '',
                            dateTo: '',
                            branchId: '',
                            teamId: ''
                          };
                          handleFilterChange({
                            ...defaultEmptyFilters,
                            ...sf.filters
                          });
                          setIsFilterOpen(false);
                          toast.success(`Applied filter "${sf.name}"`);
                        }}
                        className="text-xs font-semibold text-slate-700 hover:text-orange-600 transition-colors text-left flex-1"
                      >
                        {sf.name}
                      </button>
                      <div className="flex items-center">
                        <button
                          onClick={() => handleUpdateFilterValues(sf.id)}
                          className="p-1 rounded text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors opacity-0 group-hover/item:opacity-100 mr-0.5"
                          title="Update Preset with current filters"
                        >
                          <Bookmark size={11} />
                        </button>
                        <button
                          onClick={() => {
                            setFilterName(sf.name);
                            setFilterModalConfig({ isOpen: true, mode: 'rename', filterId: sf.id });
                          }}
                          className="p-1 rounded text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors opacity-0 group-hover/item:opacity-100 mr-0.5"
                          title="Rename Filter"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={() => setDeletingFilterId(sf.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover/item:opacity-100"
                          title="Delete Filter"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {canSelectCompany && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Company</label>
                <SelectField
                  id="filter-company"
                  placeholder="All Companies"
                  allowEmptyOption
                  value={tempFilters.companyId}
                  onChange={(val) => {
                    handleTempFilterChange('companyId', val);
                    handleTempFilterChange('branchId', ''); // Reset branch selection
                  }}
                  options={companyOptions}
                  searchable={true}
                />
              </div>
            )}

            {canSelectBranch && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Branch</label>
                <SelectField
                  id="filter-branch"
                  placeholder="All Branches"
                  allowEmptyOption
                  value={tempFilters.branchId}
                  onChange={(val) => handleTempFilterChange('branchId', val)}
                  options={branchOptions}
                  searchable={true}
                  disabled={canSelectCompany && !tempFilters.companyId}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lead Source</label>
              <SelectField
                id="filter-source"
                placeholder="All Sources"
                allowEmptyOption
                value={tempFilters.sourceId}
                onChange={(val) => handleTempFilterChange('sourceId', val)}
                options={sourcesOptions}
                searchable={true}
                isLoading={isLoadingFormData}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Interested Course/Product</label>
              <SelectField
                id="filter-course"
                placeholder="All Courses"
                allowEmptyOption
                value={tempFilters.courseId}
                onChange={(val) => handleTempFilterChange('courseId', val)}
                options={coursesOptions}
                searchable={true}
                isLoading={isLoadingFormData}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pipeline Status</label>
              <SelectField
                id="filter-status"
                placeholder="All Statuses"
                allowEmptyOption
                value={tempFilters.statusId}
                onChange={(val) => handleTempFilterChange('statusId', val)}
                options={statusesOptions}
                searchable={true}
                isLoading={isLoadingFormData}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Priority Level</label>
              <SelectField
                id="filter-priority"
                placeholder="All Priorities"
                allowEmptyOption
                value={tempFilters.priority}
                onChange={(val) => handleTempFilterChange('priority', val)}
                options={priorityOptions}
                searchable={false}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assigned Owner</label>
              <SelectField
                id="filter-assignee"
                placeholder="All Assignees"
                allowEmptyOption
                value={tempFilters.assignedToId}
                onChange={(val) => handleTempFilterChange('assignedToId', val)}
                options={assigneeOptions}
                searchable={true}
                isLoading={isLoadingFormData}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assigned Team</label>
              <SelectField
                id="filter-team"
                placeholder="All Teams"
                allowEmptyOption
                value={tempFilters.teamId}
                onChange={(val) => handleTempFilterChange('teamId', val)}
                options={teamOptions}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Creation Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">From</span>
                  <input
                    type="date"
                    value={tempFilters.dateFrom || ''}
                    onChange={(e) => handleTempFilterChange('dateFrom', e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-700"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">To</span>
                  <input
                    type="date"
                    value={tempFilters.dateTo || ''}
                    onChange={(e) => handleTempFilterChange('dateTo', e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 mt-8">
            <Button
              variant="outlined"
              onClick={() => setFilterModalConfig({ isOpen: true, mode: 'save', filterId: null })}
              disabled={!Object.values(tempFilters).some(Boolean)}
              startIcon={<BookmarkPlus size={16} />}
              sx={{
                borderColor: '#f97316',
                color: '#f97316',
                py: 1.25,
                '&:hover': {
                  borderColor: '#ea580c',
                  backgroundColor: '#fff7ed'
                }
              }}
            >
              Save Filter Preset
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outlined"
                onClick={() => {
                  const cleared = {
                    sourceId: '',
                    courseId: '',
                    statusId: '',
                    priority: '',
                    assignedToId: '',
                    dateFrom: '',
                    dateTo: '',
                    branchId: '',
                    teamId: ''
                  };
                  setTempFilters(cleared);
                  clearFilters(cleared);
                  setIsFilterOpen(false);
                }}
                disabled={!Object.values(tempFilters).some(Boolean)}
                sx={{ flex: 1, borderColor: '#cbd5e1', color: '#64748b' }}
              >
                Reset All
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  handleFilterChange(tempFilters);
                  setIsFilterOpen(false);
                }}
                sx={{ flex: 1, backgroundColor: '#f97316', '&:hover': { backgroundColor: '#ea580c' } }}
              >
                Apply & Close
              </Button>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Dialog Overlays */}
      <LeadCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => refetch()}
      />

      <LeadImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={() => refetch()}
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

      <AssignLeadDrawer
        isOpen={isAssignOpen}
        onClose={() => {
          setIsAssignOpen(false);
          setLeadsToAssign([]);
        }}
        leads={leadsToAssign}
        onSuccess={() => {
          setSelectedLeadIds([]);
        }}
      />

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

      <ConfirmModal
        isOpen={isDeleteAllOpen}
        onClose={() => setIsDeleteAllOpen(false)}
        onConfirm={handleDeleteAllConfirm}
        title="Delete All Leads"
        message="Are you sure you want to delete ALL leads in your current scope? This will soft-delete all active leads."
        confirmText="Delete All Leads"
        cancelText="Cancel"
        danger
        isLoading={deleteAllLeadsMutation.isPending}
      />



      {/* Saved Filters Management Modals */}
      <Dialog
        open={filterModalConfig.isOpen}
        onClose={() => {
          setFilterName('');
          setFilterModalConfig({ isOpen: false, mode: 'save', filterId: null });
        }}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            maxWidth: '440px',
            width: '100%',
            overflow: 'hidden',
            margin: '16px'
          }
        }}
      >
        <div className="bg-white p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-heading font-extrabold text-slate-900 text-lg leading-tight">
                {filterModalConfig.mode === 'save' ? 'Save Current Filter' : 'Rename Saved Filter'}
              </h3>
              <p className="text-[11px] text-slate-400 font-bold mt-1">
                {filterModalConfig.mode === 'save'
                  ? 'Enter a name to save this filter combination'
                  : 'Enter a new name for this filter preset'}
              </p>
            </div>
            <button
              onClick={() => {
                setFilterName('');
                setFilterModalConfig({ isOpen: false, mode: 'save', filterId: null });
              }}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg p-1.5 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div>
            <TextField
              label="Filter Preset Name"
              placeholder="e.g. High Priority Hot Leads"
              value={filterName}
              onChange={(val) => setFilterName(val)}
              fullWidth
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
            <Button
              variant="outlined"
              onClick={() => {
                setFilterName('');
                setFilterModalConfig({ isOpen: false, mode: 'save', filterId: null });
              }}
              sx={{ borderColor: '#cbd5e1', color: '#64748b' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveOrRenameFilter}
              disabled={!filterName.trim() || updatePreferencesMutation.isPending}
              sx={{ backgroundColor: '#f97316', '&:hover': { backgroundColor: '#ea580c' } }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Dialog>

      <ConfirmModal
        isOpen={!!deletingFilterId}
        onClose={() => setDeletingFilterId(null)}
        onConfirm={handleDeleteFilter}
        title="Delete Saved Filter"
        message="Are you sure you want to delete this saved filter? This action cannot be undone."
        confirmText="Delete Preset"
        cancelText="Cancel"
        type="error"
        isLoading={updatePreferencesMutation.isPending}
      />
    </div>
  );
};

export default LeadsPage;
